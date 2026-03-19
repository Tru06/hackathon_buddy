import bcrypt from 'bcrypt'

const BCRYPT_COST_FACTOR = 12

/**
 * Hash a plaintext password using bcrypt with cost factor ≥ 12.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST_FACTOR)
}

/**
 * Verify a plaintext password against a bcrypt hash.
 * Uses constant-time comparison (bcrypt.compare) to prevent timing attacks.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
