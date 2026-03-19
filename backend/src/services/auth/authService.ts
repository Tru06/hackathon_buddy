import { Response } from 'express'
import pool from '../../db/client'
import redis from '../../db/redis'
import { generateAccessToken, generateRefreshToken } from './tokens'
import { hashPassword, verifyPassword } from './password'
import { AuthResult } from './types'

const REFRESH_TOKEN_TTL = 604800 // 7 days in seconds

/** Validate email format using a standard RFC-5322-ish regex. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Set the refresh token as a secure httpOnly cookie on the response. */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL * 1000,
  })
}

/**
 * Store a refresh token in Redis:
 *   SET refresh:<token> <userId> EX 604800
 *   SADD user_tokens:<userId> refresh:<token>
 *   EXPIRE user_tokens:<userId> 604800
 *
 * Throws an AuthError-shaped object with status 503 if Redis is unavailable.
 */
async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const key = `refresh:${token}`
  const userSetKey = `user_tokens:${userId}`
  try {
    await redis.set(key, userId, 'EX', REFRESH_TOKEN_TTL)
    await redis.sadd(userSetKey, key)
    await redis.expire(userSetKey, REFRESH_TOKEN_TTL)
  } catch {
    const err = new Error('Service temporarily unavailable.') as Error & { status: number }
    err.status = 503
    throw err
  }
}

/**
 * Register a new user.
 *
 * Validates email format and password length, hashes the password,
 * inserts the user into PostgreSQL, issues tokens, stores the refresh
 * token in Redis, and sets the httpOnly cookie on the response.
 *
 * @throws {{ status: 422, message: string }} on validation failure
 * @throws {{ status: 409, message: string }} on duplicate email
 * @throws {{ status: 503, message: string }} on Redis failure
 */
export async function register(
  email: string,
  password: string,
  res: Response,
): Promise<AuthResult> {
  // --- Input validation ---
  if (!isValidEmail(email)) {
    const err = new Error('Invalid email format.') as Error & { status: number }
    err.status = 422
    throw err
  }

  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters.') as Error & { status: number }
    err.status = 422
    throw err
  }

  // --- Hash password ---
  const passwordHash = await hashPassword(password)

  // --- Insert user into PostgreSQL ---
  let userId: string
  try {
    const result = await pool.query<{ id: string }>(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash],
    )
    userId = result.rows[0].id
  } catch (dbErr: unknown) {
    // PostgreSQL unique violation code
    if (
      typeof dbErr === 'object' &&
      dbErr !== null &&
      (dbErr as { code?: string }).code === '23505'
    ) {
      const err = new Error('Email already registered.') as Error & { status: number }
      err.status = 409
      throw err
    }
    throw dbErr
  }

  // --- Issue tokens ---
  const accessToken = generateAccessToken(userId)
  const refreshToken = generateRefreshToken()

  // --- Store refresh token in Redis (fails closed with 503) ---
  await storeRefreshToken(userId, refreshToken)

  // --- Set secure cookie ---
  setRefreshCookie(res, refreshToken)

  return { accessToken, userId }
}

/**
 * Refresh an access token using a valid refresh token.
 *
 * Rotation strategy:
 *   1. GET refresh:<token> from Redis → 401 if missing (expired or never existed)
 *   2. Delete old token key + remove from user_tokens set
 *   3. Issue new refresh token, store in Redis, update user_tokens set
 *   4. Set new cookie, return new AuthResult
 *
 * Replay detection: a token that was already rotated will not be in Redis,
 * so it returns 401. The user_tokens set is used to purge all tokens when
 * a replay is detected with a known userId (e.g. from a concurrent session).
 *
 * @throws {{ status: 401, message: string }} on invalid/expired token
 * @throws {{ status: 503, message: string }} on Redis failure
 */
export async function refreshToken(token: string, res: Response): Promise<AuthResult> {
  const key = `refresh:${token}`

  let userId: string
  try {
    const value = await redis.get(key)
    if (!value) {
      // Clear the cookie so the client doesn't keep retrying
      res.clearCookie('refreshToken', { path: '/' })
      const err = new Error('Invalid or expired refresh token.') as Error & { status: number }
      err.status = 401
      throw err
    }
    userId = value
  } catch (e: unknown) {
    if ((e as { status?: number }).status === 401) throw e
    const err = new Error('Service temporarily unavailable.') as Error & { status: number }
    err.status = 503
    throw err
  }

  // Rotate: delete old token
  try {
    await redis.del(key)
    await redis.srem(`user_tokens:${userId}`, key)
  } catch {
    // Non-fatal — proceed with issuing new token
  }

  // Issue new refresh token
  const newRefreshToken = generateRefreshToken()
  await storeRefreshToken(userId, newRefreshToken)

  // Issue new access token
  const accessToken = generateAccessToken(userId)

  // Set new cookie
  setRefreshCookie(res, newRefreshToken)

  return { accessToken, userId }
}

/**
 * Log out a user by invalidating their refresh token in Redis and clearing the cookie.
 *
 * Best-effort cleanup: Redis errors are swallowed so the cookie is always cleared
 * and the caller can return 200 OK regardless.
 *
 * @param userId  - The authenticated user's ID (from the verified access token)
 * @param token   - The refresh token value from the httpOnly cookie
 * @param res     - Express Response used to clear the cookie
 */
export async function logout(userId: string, token: string, res: Response): Promise<void> {
  const key = `refresh:${token}`
  const userSetKey = `user_tokens:${userId}`

  try {
    await redis.del(key)
    await redis.srem(userSetKey, key)
  } catch {
    // Best-effort — do not throw; cookie is still cleared below
  }

  // Clear the httpOnly cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}

/**
 * Log in an existing user.
 *
 * Looks up the user by email, verifies the password using constant-time
 * comparison, issues tokens, stores the refresh token in Redis, and sets
 * the httpOnly cookie on the response.
 *
 * Both "unknown email" and "wrong password" cases return the identical
 * 401 message to prevent user enumeration.
 *
 * @throws {{ status: 401, message: string }} on invalid credentials
 * @throws {{ status: 503, message: string }} on Redis failure
 */
export async function login(
  email: string,
  password: string,
  res: Response,
): Promise<AuthResult> {
  // --- Look up user by email ---
  const result = await pool.query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email],
  )

  if (result.rows.length === 0) {
    const err = new Error('Invalid credentials.') as Error & { status: number }
    err.status = 401
    throw err
  }

  const { id: userId, password_hash } = result.rows[0]

  // --- Verify password (constant-time) ---
  const valid = await verifyPassword(password, password_hash)
  if (!valid) {
    const err = new Error('Invalid credentials.') as Error & { status: number }
    err.status = 401
    throw err
  }

  // --- Issue tokens ---
  const accessToken = generateAccessToken(userId)
  const refreshToken = generateRefreshToken()

  // --- Store refresh token in Redis (fails closed with 503) ---
  await storeRefreshToken(userId, refreshToken)

  // --- Set secure cookie ---
  setRefreshCookie(res, refreshToken)

  return { accessToken, userId }
}
