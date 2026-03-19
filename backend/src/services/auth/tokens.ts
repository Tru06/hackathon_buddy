import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const ACCESS_TOKEN_EXPIRY = '15m'

/**
 * Generate a signed JWT access token for the given userId.
 * Expires in 15 minutes.
 */
export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

/**
 * Generate a cryptographically random 32-byte hex refresh token.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
