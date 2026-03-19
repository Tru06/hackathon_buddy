import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { hashPassword, verifyPassword } from './password'

// Feature: user-authentication, Property 2: Password stored as bcrypt hash with cost factor >= 12
// Validates: Requirements 1.2, 6.1, 6.2

describe('password utilities', () => {
  describe('hashPassword', () => {
    it('returns a bcrypt hash string', async () => {
      const hash = await hashPassword('mypassword')
      expect(hash).toMatch(/^\$2b\$/)
    })

    it('uses cost factor >= 12', async () => {
      const hash = await hashPassword('mypassword')
      // bcrypt hash format: $2b$<cost>$...
      const costFactor = parseInt(hash.split('$')[2], 10)
      expect(costFactor).toBeGreaterThanOrEqual(12)
    })

    it('does not store plaintext', async () => {
      const plain = 'supersecret'
      const hash = await hashPassword(plain)
      expect(hash).not.toBe(plain)
    })

    it('produces different hashes for the same password (salted)', async () => {
      const hash1 = await hashPassword('samepassword')
      const hash2 = await hashPassword('samepassword')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('returns true for matching password', async () => {
      const plain = 'correctpassword'
      const hash = await hashPassword(plain)
      expect(await verifyPassword(plain, hash)).toBe(true)
    })

    it('returns false for wrong password', async () => {
      const hash = await hashPassword('correctpassword')
      expect(await verifyPassword('wrongpassword', hash)).toBe(false)
    })
  })

  describe('Property 2: Password stored as bcrypt hash with cost factor >= 12', () => {
    it('for any password, hash starts with $2b$12$ or higher and does not equal plaintext', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 72 }),
          async (password) => {
            const hash = await hashPassword(password)

            // Must be a bcrypt hash
            expect(hash).toMatch(/^\$2b\$/)

            // Cost factor must be >= 12
            const costFactor = parseInt(hash.split('$')[2], 10)
            expect(costFactor).toBeGreaterThanOrEqual(12)

            // Must not equal plaintext
            expect(hash).not.toBe(password)

            // Must verify correctly
            expect(await verifyPassword(password, hash)).toBe(true)
          }
        ),
        { numRuns: 10 } // bcrypt is slow; 10 runs is sufficient for property validation
      )
    }, 60000) // 60s timeout — bcrypt at cost 12 takes ~500ms per hash
  })
})
