import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

vi.mock('../../db/client', () => ({ default: { query: vi.fn() } }))
vi.mock('../../db/redis', () => ({ default: { set: vi.fn(), sadd: vi.fn(), expire: vi.fn() } }))
vi.mock('./password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2b$12$mock'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}))

import pool from '../../db/client'
import redis from '../../db/redis'
import * as passwordModule from './password'
import { register, login } from './authService'

function mockRes() {
  return { cookie: vi.fn() } as any
}

function happyPath(uid = 'uid-1') {
  vi.mocked(pool.query).mockResolvedValue({ rows: [{ id: uid }] } as any)
  vi.mocked(redis.set).mockResolvedValue('OK' as any)
  vi.mocked(redis.sadd).mockResolvedValue(1 as any)
  vi.mocked(redis.expire).mockResolvedValue(1 as any)
}

beforeEach(() => { vi.clearAllMocks() })

// Feature: user-authentication, Property 1: Valid registration produces AuthResult
// Validates: Requirements 1.1
describe('Property 1: Valid registration produces AuthResult', () => {
  it('returns non-empty accessToken and userId for any valid email + password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          happyPath('uid-1')
          const r = await register(email, pw, mockRes())
          expect(r.accessToken).toBeTruthy()
          expect(r.userId).toBe('uid-1')
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 3: Duplicate email registration returns 409
// Validates: Requirements 1.3
describe('Property 3: Duplicate email returns 409', () => {
  it('throws 409 for any already-registered email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          vi.mocked(pool.query).mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }))
          await expect(register(email, pw, mockRes())).rejects.toMatchObject({
            status: 409,
            message: 'Email already registered.',
          })
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 4: Invalid email format returns 422
// Validates: Requirements 1.4
describe('Property 4: Invalid email returns 422', () => {
  it('throws 422 for any string that is not a valid email', async () => {
    const badEmail = fc.oneof(
      fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('@')),
      fc.string({ minLength: 1, maxLength: 10 }).map(s => '@' + s),
      fc.string({ minLength: 1, maxLength: 10 }).map(s => s + '@'),
    )
    await fc.assert(
      fc.asyncProperty(badEmail, fc.string({ minLength: 8, maxLength: 64 }), async (email, pw) => {
        await expect(register(email, pw, mockRes())).rejects.toMatchObject({ status: 422 })
      }),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 5: Short password returns 422
// Validates: Requirements 1.5
describe('Property 5: Short password returns 422', () => {
  it('throws 422 for any password shorter than 8 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 0, maxLength: 7 }),
        async (email, pw) => {
          await expect(register(email, pw, mockRes())).rejects.toMatchObject({ status: 422 })
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 6: Successful auth stores refresh token with 7-day TTL
// Validates: Requirements 1.6, 7.5
describe('Property 6: Redis SET called with EX 604800 after registration', () => {
  it('stores refresh token with 7-day TTL for any valid registration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          happyPath()
          await register(email, pw, mockRes())
          expect(vi.mocked(redis.set)).toHaveBeenCalledWith(
            expect.stringMatching(/^refresh:/),
            expect.any(String),
            'EX',
            604800,
          )
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 7: Login round-trip succeeds for any registered user
// Validates: Requirements 2.1
describe('Property 7: Login round-trip succeeds for any registered user', () => {
  it('returns non-empty accessToken and same userId for any valid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          const userId = 'uid-7'
          vi.mocked(pool.query).mockResolvedValue({
            rows: [{ id: userId, password_hash: '$2b$12$mockhashvalue' }],
          } as any)
          vi.mocked(redis.set).mockResolvedValue('OK' as any)
          vi.mocked(redis.sadd).mockResolvedValue(1 as any)
          vi.mocked(redis.expire).mockResolvedValue(1 as any)
          vi.mocked(passwordModule.verifyPassword).mockResolvedValue(true)
          const r = await login(email, pw, mockRes())
          expect(r.accessToken).toBeTruthy()
          expect(r.userId).toBe(userId)
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 8: Invalid credentials return 401 with identical message regardless of failure reason
// Validates: Requirements 2.3, 2.4, 2.5
describe('Property 8: Invalid credentials return 401 with identical message regardless of failure reason', () => {
  it('unknown email and wrong password produce byte-for-byte identical 401 error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          // Case A: unknown email — DB returns no rows
          vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any)
          const errA = await login(email, pw, mockRes()).catch((e: unknown) => e as Error & { status?: number })

          // Case B: correct email, wrong password — verifyPassword returns false
          vi.mocked(pool.query).mockResolvedValueOnce({
            rows: [{ id: 'uid-8', password_hash: '$2b$12$mockhashvalue' }],
          } as any)
          vi.mocked(passwordModule.verifyPassword).mockResolvedValueOnce(false)
          const errB = await login(email, pw, mockRes()).catch((e: unknown) => e as Error & { status?: number })

          expect(errA).toMatchObject({ status: 401 })
          expect(errB).toMatchObject({ status: 401 })
          expect((errA as Error).message).toBe((errB as Error).message)
          expect((errA as Error).message).toBe('Invalid credentials.')
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 19: Password hash never appears in any API response
// Validates: Requirements 6.4
describe('Property 19: No bcrypt hash in response body', () => {
  it('AuthResult JSON contains no bcrypt hash pattern for any valid registration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          happyPath()
          const r = await register(email, pw, mockRes())
          expect(JSON.stringify(r)).not.toMatch(/\$2[aby]\$/)
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 20: Refresh token cookie has all required security attributes
// Validates: Requirements 7.1, 7.2, 7.3
describe('Property 20: Cookie security attributes', () => {
  it('sets httpOnly, secure, sameSite=strict on the refresh token cookie', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          happyPath()
          const res = mockRes()
          await register(email, pw, res)
          expect(vi.mocked(res.cookie)).toHaveBeenCalledWith(
            'refreshToken',
            expect.any(String),
            expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'strict' }),
          )
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 21: Access token transmitted only in response body
// Validates: Requirements 7.4
describe('Property 21: Access token not in Set-Cookie', () => {
  it('accessToken appears in response body and not in any cookie value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (email, pw) => {
          happyPath()
          const res = mockRes()
          const r = await register(email, pw, res)
          expect(r.accessToken).toBeTruthy()
          for (const [, val] of vi.mocked(res.cookie).mock.calls) {
            expect(val).not.toBe(r.accessToken)
          }
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})
