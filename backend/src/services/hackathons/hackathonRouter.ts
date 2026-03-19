import { Router, Request, Response } from 'express'
import {
  listHackathons, getHackathon, createHackathon,
  registerInterest, removeInterest, getParticipants,
} from './hackathonService'
import { authenticate } from '../../middleware/authenticate'

const hackathonRouter = Router()

/** GET /api/hackathons?theme=...&location=... */
hackathonRouter.get('/', async (req: Request, res: Response) => {
  try {
    const hackathons = await listHackathons({
      theme: req.query.theme as string | undefined,
      location: req.query.location as string | undefined,
    })
    res.json(hackathons)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/hackathons/:id */
hackathonRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const hackathon = await getHackathon(req.params.id)
    if (!hackathon) { res.status(404).json({ error: 'Hackathon not found.' }); return }
    res.json(hackathon)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/hackathons */
hackathonRouter.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const hackathon = await createHackathon(req.body)
    res.status(201).json(hackathon)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/hackathons/:id/interest */
hackathonRouter.post('/:id/interest', authenticate, async (req: Request, res: Response) => {
  try {
    await registerInterest(req.user!.userId, req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /api/hackathons/:id/interest */
hackathonRouter.delete('/:id/interest', authenticate, async (req: Request, res: Response) => {
  try {
    await removeInterest(req.user!.userId, req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/hackathons/:id/participants */
hackathonRouter.get('/:id/participants', authenticate, async (req: Request, res: Response) => {
  try {
    const participants = await getParticipants(req.params.id)
    res.json(participants)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default hackathonRouter
