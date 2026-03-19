import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that validates the X-API-Key header against the API_KEY env var.
 * Use this on any route that the frontend calls directly (non-user-auth routes).
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];

  if (!process.env.API_KEY || key !== process.env.API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API key.' });
    return;
  }

  next();
}
