import { Router, Request, Response } from 'express'
import { register, login, refreshToken, logout } from './authService'
import { authenticate } from '../../middleware/authenticate'
import { loginRateLimiter } from '../../middleware/rateLimiter'

const authRouter = Router()

/** POST /auth/register */
authRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const result = await register(email, password, res)
    res.status(201).json(result)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status ?? 500).json({ error: e.message ?? 'Internal server error.' })
  }
})

/** POST /auth/login */
authRouter.post('/auth/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const result = await login(email, password, res)
    res.status(200).json(result)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status ?? 500).json({ error: e.message ?? 'Internal server error.' })
  }
})

/** POST /auth/refresh */
authRouter.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const token: string | undefined = req.cookies?.refreshToken
    if (!token) {
      res.status(401).json({ error: 'Invalid or expired refresh token.' })
      return
    }
    const result = await refreshToken(token, res)
    res.status(200).json(result)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status ?? 500).json({ error: e.message ?? 'Internal server error.' })
  }
})

/** POST /auth/logout */
authRouter.post('/auth/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const token: string | undefined = req.cookies?.refreshToken
    const userId = req.user!.userId
    await logout(userId, token ?? '', res)
    res.status(200).json({ message: 'Logged out.' })
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status ?? 500).json({ error: e.message ?? 'Internal server error.' })
  }
})

export default authRouter
