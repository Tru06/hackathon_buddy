import { Router, Request, Response } from 'express'
import pool from '../../db/client'

const seedRouter = Router()

const hackathons = [
  {
    title: 'HackIndia 2026',
    description: "India's largest student hackathon bringing together 5000+ innovators to build the future.",
    start_date: '2026-04-15',
    end_date: '2026-04-17',
    theme: 'AI/ML',
    location: 'Bengaluru, India',
    max_team_size: 4,
    registration_url: 'https://hackindia.com',
  },
  {
    title: 'DevHacks Global',
    description: 'A 48-hour virtual hackathon focused on developer tools, open source, and cloud infrastructure.',
    start_date: '2026-05-05',
    end_date: '2026-05-07',
    theme: 'DevTools',
    location: 'Online',
    max_team_size: 5,
    registration_url: 'https://devhacks.io',
  },
  {
    title: 'Climate Tech Challenge',
    description: 'Build innovative solutions for climate change, sustainability, and clean energy.',
    start_date: '2026-06-10',
    end_date: '2026-06-12',
    theme: 'Sustainability',
    location: 'Mumbai, India',
    max_team_size: 4,
    registration_url: 'https://climatetechchallenge.org',
  },
  {
    title: 'FinTech Revolution',
    description: 'Revolutionize the future of finance, banking, and payments with cutting-edge technology.',
    start_date: '2026-07-01',
    end_date: '2026-07-03',
    theme: 'FinTech',
    location: 'Mumbai, India',
    max_team_size: 4,
    registration_url: 'https://fintechrevolution.in',
  },
  {
    title: 'HealthTech Hackathon',
    description: 'Create technology solutions that improve healthcare access, diagnostics, and patient outcomes.',
    start_date: '2026-08-20',
    end_date: '2026-08-22',
    theme: 'HealthTech',
    location: 'Hyderabad, India',
    max_team_size: 5,
    registration_url: 'https://healthteckhack.com',
  },
  {
    title: 'Web3 Builders Summit',
    description: 'Build decentralized applications, DeFi protocols, and NFT platforms on the latest chains.',
    start_date: '2026-09-12',
    end_date: '2026-09-14',
    theme: 'Web3',
    location: 'Online',
    max_team_size: 3,
    registration_url: 'https://web3builders.xyz',
  },
]

// GET /api/seed-hackathons  — one-time seed endpoint
seedRouter.get('/', async (_req: Request, res: Response) => {
  const inserted: string[] = []
  for (const h of hackathons) {
    const result = await pool.query(
      `INSERT INTO hackathons (title, description, start_date, end_date, theme, location, max_team_size, registration_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING RETURNING title`,
      [h.title, h.description, h.start_date, h.end_date, h.theme, h.location, h.max_team_size, h.registration_url],
    )
    if (result.rows[0]) inserted.push(result.rows[0].title)
  }
  res.json({ inserted, message: `${inserted.length} hackathon(s) seeded.` })
})

export default seedRouter
