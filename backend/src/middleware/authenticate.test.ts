import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import jwt from 'jsonwebtoken'
import { authenticate } from './authenticate'
import { generateAccessToken } from '../services/auth/tokens'

const JWT_SECRET = 'dev-secret-change-in-production'

function mockReq(authHeader?: string) {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as any
}

function mockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

beforeEach(() => {
  vi.clearAllMocks()
})

// Feature: user-authentication, Property 16: Valid access token passes the authenticate middleware
// Validates: Requirements 5.1
describe('Property 16: Valid access token passes the authenticate middleware', () => {
  it('calls next() and sets req.user.userId for any freshly generated access token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const token = generateAccessToken(userId)
          const req = mockReq(`Bearer ${token}`)
          const res = mockRes()
          const next = vi.fn()

          authenticate(req, res, next)

          expect(next).toHaveBeenCalledOnce()
          expect(req.user).toEqual({ userId })
          expect(res.status).not.toHaveBeenCalled()
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: user-authentication, Property 17: Expired access token returns 401 "Token expired"
// Validates: Requirements 5.2
describe('Property 17: Expired access token returns 401 "Token expired"', () => {
  it('returns 401 with "Token expired." for any JWT with a past exp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Sign with expiresIn: 0 so the token is immediately expired
          const expiredToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: 0 })

          // Small delay to ensure exp is in the past
          await new Promise((r) => setTimeout(r, 10))

          const req = mockReq(`Bearer ${expiredToken}`)
          const res = mockRes()
          const next = vi.fn()

          authenticate(req, res, next)

          expect(next).not.toHaveBeenCalled()
          expect(res.status).toHaveBeenCalledWith(401)
          expect(res.json).toHaveBeenCalledWith({ error: 'Token expired.' })
        },
      ),
      { numRuns: 50 },
    )
  }, 30000)
})

// Feature: user-authentication, Property 18: Tampered or malformed token returns 401 "Invalid token"
// Validates: Requirements 5.3, 5.4, 5.5
describe('Property 18: Tampered or malformed token returns 401 "Invalid token"', () => {
  it('returns 401 "Invalid token." for random strings as Bearer token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (randomString) => {
          const req = mockReq(`Bearer ${randomString}`)
          const res = mockRes()
          const next = vi.fn()

          authenticate(req, res, next)

          expect(next).not.toHaveBeenCalled()
          expect(res.status).toHaveBeenCalledWith(401)
          expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' })
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns 401 "Invalid token." for JWTs signed with a different secret', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const tamperedToken = jwt.sign({ userId }, 'wrong-secret', { expiresIn: '15m' })
          const req = mockReq(`Bearer ${tamperedToken}`)
          const res = mockRes()
          const next = vi.fn()

          authenticate(req, res, next)

          expect(next).not.toHaveBeenCalled()
          expect(res.status).toHaveBeenCalledWith(401)
          expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' })
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns 401 "Invalid token." when Authorization header is absent', () => {
    const req = mockReq()
    const res = mockRes()
    const next = vi.fn()

    authenticate(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' })
  })

  it('returns 401 "Invalid token." when Authorization header is not Bearer scheme', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (token) => {
          const req = mockReq(`Basic ${token}`)
          const res = mockRes()
          const next = vi.fn()

          authenticate(req, res, next)

          expect(next).not.toHaveBeenCalled()
          expect(res.status).toHaveBeenCalledWith(401)
          expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' })
        },
      ),
      { numRuns: 50 },
    )
  })

  it('returns 401 "Invalid token." for a valid JWT with a tampered signature', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const validToken = generateAccessToken(userId)
          // Corrupt the last character of the signature (3rd segment)
          const parts = validToken.split('.')
          const sig = parts[2]
          const tamperedSig = sig.slice(0, -1) + (sig.endsWith('a') ? 'b' : 'a')
          const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSig}`

          const req = mockReq(`Bearer ${tamperedToken}`)
          const res = mockRes()
          const next = vi.fn()

          authenticate(req, res, next)

          expect(next).not.toHaveBeenCalled()
          expect(res.status).toHaveBeenCalledWith(401)
          expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' })
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: user-authentication, Property 15: Logout with invalid access token returns 401
// Validates: Requirements 4.3
describe('Property 15: Invalid Bearer token returns 401 "Invalid token."', () => {
  it('returns 401 for any non-JWT string used as Bearer token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(),
        async (randomString) => {
          const req = mockReq(`Bearer ${randomString}`)
          const res = mockRes()
          const next = vi.fn()

          authenticate(req, res, next)

          expect(next).not.toHaveBeenCalled()
          expect(res.status).toHaveBeenCalledWith(401)
        },
      ),
      { numRuns: 100 },
    )
  })
})
