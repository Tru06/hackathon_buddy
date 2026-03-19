import { Router, Request, Response } from 'express';
import { createTeam, getTeamsByHackathon, joinTeam, addMessage, getMessages, createProject } from './teamService';
import { authenticate } from '../../middleware/authenticate';

const teamRouter = Router();

teamRouter.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const team = await createTeam(userId, req.body);
    res.status(201).json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

teamRouter.get('/', async (req: Request, res: Response) => {
  try {
    const hackathonId = req.query.hackathonId as string;
    if (!hackathonId) {
      res.status(400).json({ error: 'hackathonId query param is required' });
      return;
    }
    const teams = await getTeamsByHackathon(hackathonId);
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

teamRouter.post('/:id/join', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const member = await joinTeam(userId, id);
    res.json(member);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

teamRouter.get('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = await getMessages(id);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

teamRouter.post('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const message = await addMessage(userId, id, req.body.content);
    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

teamRouter.post('/:id/projects', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await createProject(id, req.body);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default teamRouter;
