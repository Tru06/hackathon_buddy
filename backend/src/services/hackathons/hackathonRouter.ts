import { Router, Request, Response } from 'express';
import { listHackathons, getHackathon, createHackathon } from './hackathonService';
import { authenticate } from '../../middleware/authenticate';

const hackathonRouter = Router();

hackathonRouter.get('/', async (req: Request, res: Response) => {
  try {
    const hackathons = await listHackathons();
    res.json(hackathons);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hackathonRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hackathon = await getHackathon(id);
    if (!hackathon) {
      res.status(404).json({ error: 'Hackathon not found' });
      return;
    }
    res.json(hackathon);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Assuming normal users or authenticated admins can add a hackathon
hackathonRouter.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const hackathon = await createHackathon(req.body);
    res.status(201).json(hackathon);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default hackathonRouter;
