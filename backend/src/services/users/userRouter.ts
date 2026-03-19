import { Router, Request, Response } from 'express';
import { getProfile, upsertProfile, findMatches } from './userService';
import { authenticate } from '../../middleware/authenticate';

const userRouter = Router();

userRouter.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await getProfile(userId);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profile = await upsertProfile(userId, req.body);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.get('/match', authenticate, async (req: Request, res: Response) => {
  try {
    const skills = (req.query.skills as string)?.split(',') || [];
    const matches = await findMatches(skills);
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default userRouter;
