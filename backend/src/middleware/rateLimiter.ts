import { Request, Response, NextFunction } from 'express';
import redis from '../db/redis';

/**
 * Express middleware that rate-limits login attempts per IP address.
 *
 * Algorithm:
 *   - Key: rate_limit:login:<ip>
 *   - INCR the key on each request
 *   - If count === 1 (first increment), set EXPIRE 900 to start the 15-min window
 *   - If count > 10, return 429
 *   - On Redis error, fail open (allow the request through)
 */
export async function loginRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip ?? 'unknown';
  const key = `rate_limit:login:${ip}`;

  try {
    const count = await redis.incr(key);

    // Set TTL only on the first increment to avoid resetting the window
    if (count === 1) {
      await redis.expire(key, 900);
    }

    if (count > 10) {
      res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
      return;
    }
  } catch {
    // Fail open: if Redis is unavailable, allow the request through
  }

  next();
}
