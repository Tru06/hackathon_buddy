import { Router, Request, Response } from 'express'
import { searchUsers, getSuggestedTeammates, getMatchScore } from './searchService'
import { authenticate } from '../../middleware/authenticate'

const searchRouter = Router()

/** GET /api/search/users?skills=React,Python&hackathonId=...&page=1&pageSize=20 */
searchRouter.get('/users', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const skills = req.query.skills ? (req.query.skills as string).split(',') : undefined
    const interests = req.query.interests ? (req.query.interests as string).split(',') : undefined
    const page = parseInt(req.query.page as string) || 1
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100)

    const result = await searchUsers(userId, {
      skills,
      interests,
      availability: req.query.availability as string | undefined,
      hackathonId: req.query.hackathonId as string | undefined,
      excludeTeamed: req.query.excludeTeamed === 'true',
      timezone: req.query.timezone as string | undefined,
    }, page, pageSize)

    res.json(result)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** GET /api/search/suggest?hackathonId=... */
searchRouter.get('/suggest', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { hackathonId } = req.query
    if (!hackathonId) {
      res.status(400).json({ error: 'hackathonId query param is required' })
      return
    }
    const suggestions = await getSuggestedTeammates(userId, hackathonId as string)
    res.json(suggestions)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** GET /api/search/score?userA=...&userB=... */
searchRouter.get('/score', authenticate, async (req: Request, res: Response) => {
  try {
    const { userA, userB } = req.query
    if (!userA || !userB) {
      res.status(400).json({ error: 'userA and userB query params are required' })
      return
    }
    const score = await getMatchScore(userA as string, userB as string)
    res.json({ score })
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

export default searchRouter
