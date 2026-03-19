import { Router, Request, Response } from 'express'
import {
  getProfile, upsertProfile, getConnections,
  sendConnectionRequest, respondToConnectionRequest, getPendingRequests,
} from './userService'
import { authenticate } from '../../middleware/authenticate'

const userRouter = Router()

/** GET /api/users/profile/:userId */
userRouter.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await getProfile(req.params.userId)
    if (!profile) { res.status(404).json({ error: 'Profile not found.' }); return }
    res.json(profile)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** PUT /api/users/profile */
userRouter.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const profile = await upsertProfile(req.user!.userId, req.body)
    res.json(profile)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/users/connections */
userRouter.get('/connections', authenticate, async (req: Request, res: Response) => {
  try {
    const connections = await getConnections(req.user!.userId)
    res.json(connections)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/users/connections/pending */
userRouter.get('/connections/pending', authenticate, async (req: Request, res: Response) => {
  try {
    const requests = await getPendingRequests(req.user!.userId)
    res.json(requests)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/users/connections */
userRouter.post('/connections', authenticate, async (req: Request, res: Response) => {
  try {
    const { toUserId, message } = req.body
    if (!toUserId) { res.status(400).json({ error: 'toUserId is required.' }); return }
    const request = await sendConnectionRequest(req.user!.userId, toUserId, message ?? '')
    res.status(201).json(request)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** PATCH /api/users/connections/:id */
userRouter.patch('/connections/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { accept } = req.body
    if (typeof accept !== 'boolean') {
      res.status(400).json({ error: 'accept (boolean) is required.' }); return
    }
    const result = await respondToConnectionRequest(req.params.id, req.user!.userId, accept)
    res.json(result)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

export default userRouter
