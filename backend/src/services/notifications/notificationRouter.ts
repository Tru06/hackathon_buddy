import { Router, Request, Response } from 'express'
import { getNotifications, getUnreadNotifications, markRead, markAllRead } from './notificationService'
import { authenticate } from '../../middleware/authenticate'

const notificationRouter = Router()

/** GET /api/notifications — paginated list */
notificationRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const page = parseInt(req.query.page as string) || 1
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100)
    const result = await getNotifications(userId, page, pageSize)
    res.json(result)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** GET /api/notifications/unread */
notificationRouter.get('/unread', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const items = await getUnreadNotifications(userId)
    res.json(items)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** PATCH /api/notifications/:id/read */
notificationRouter.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    await markRead(req.params.id, req.user!.userId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** PATCH /api/notifications/read-all */
notificationRouter.patch('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    await markAllRead(req.user!.userId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

export default notificationRouter
