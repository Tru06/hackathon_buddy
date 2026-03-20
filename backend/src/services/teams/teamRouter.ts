import { Router, Request, Response } from 'express'
import {
  createTeam, getTeam, getTeamsByHackathon, updateTeam,
  inviteMember, respondToInvite, leaveTeam,
  addMessage, getMessages, createProject,
  getMyTeams, getPendingInvites,
} from './teamService'
import { authenticate } from '../../middleware/authenticate'

const teamRouter = Router()

/** POST /api/teams */
teamRouter.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const team = await createTeam(req.user!.userId, req.body)
    res.status(201).json(team)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** GET /api/teams?hackathonId=... */
teamRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { hackathonId } = req.query
    if (!hackathonId) { res.status(400).json({ error: 'hackathonId query param is required.' }); return }
    const teams = await getTeamsByHackathon(hackathonId as string)
    res.json(teams)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/teams/mine */
teamRouter.get('/mine', authenticate, async (req: Request, res: Response) => {
  try {
    const teams = await getMyTeams(req.user!.userId)
    res.json(teams)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/teams/invites/pending */
teamRouter.get('/invites/pending', authenticate, async (req: Request, res: Response) => {
  try {
    const invites = await getPendingInvites(req.user!.userId)
    res.json(invites)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/teams/:id */
teamRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const team = await getTeam(req.params.id)
    if (!team) { res.status(404).json({ error: 'Team not found.' }); return }
    res.json(team)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** PATCH /api/teams/:id */
teamRouter.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const team = await updateTeam(req.params.id, req.user!.userId, req.body)
    res.json(team)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** POST /api/teams/:id/invite */
teamRouter.post('/:id/invite', authenticate, async (req: Request, res: Response) => {
  try {
    const { inviteeId } = req.body
    if (!inviteeId) { res.status(400).json({ error: 'inviteeId is required.' }); return }
    const invite = await inviteMember(req.params.id, req.user!.userId, inviteeId)
    res.status(201).json(invite)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** PATCH /api/teams/invites/:inviteId */
teamRouter.patch('/invites/:inviteId', authenticate, async (req: Request, res: Response) => {
  try {
    const { accept } = req.body
    if (typeof accept !== 'boolean') { res.status(400).json({ error: 'accept (boolean) is required.' }); return }
    const team = await respondToInvite(req.params.inviteId, req.user!.userId, accept)
    res.json(team)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** DELETE /api/teams/:id/leave */
teamRouter.delete('/:id/leave', authenticate, async (req: Request, res: Response) => {
  try {
    await leaveTeam(req.params.id, req.user!.userId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** GET /api/teams/:id/messages */
teamRouter.get('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const messages = await getMessages(req.params.id)
    res.json(messages)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/teams/:id/messages */
teamRouter.post('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const message = await addMessage(req.user!.userId, req.params.id, req.body.content)
    res.status(201).json(message)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/teams/:id/projects */
teamRouter.post('/:id/projects', authenticate, async (req: Request, res: Response) => {
  try {
    const project = await createProject(req.params.id, req.body)
    res.status(201).json(project)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default teamRouter
