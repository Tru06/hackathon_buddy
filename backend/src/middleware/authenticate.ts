import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string }
    }
  }
}

/**
 * Express middleware that validates a Bearer JWT access token.
 *
 * - Extracts token from `Authorization: Bearer <token>` header
 * - Returns 401 { error: "Invalid token." } if header is absent or not Bearer
 * - Returns 401 { error: "Token expired." } if the token's exp is in the past
 * - Returns 401 { error: "Invalid token." } for bad signature or malformed input
 * - On success: attaches { userId } to req.user and calls next()
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid token.' })
    return
  }

  const token = authHeader.slice(7) // strip "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    req.user = { userId: decoded.userId as string }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired.' })
    } else {
      res.status(401).json({ error: 'Invalid token.' })
    }
  }
}
