import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './services/auth/authRouter'
import userRouter from './services/users/userRouter'
import hackathonRouter from './services/hackathons/hackathonRouter'
import hackathonSeedRouter from './services/hackathons/hackathonSeedRouter'
import teamRouter from './services/teams/teamRouter'
import searchRouter from './services/search/searchRouter'
import notificationRouter from './services/notifications/notificationRouter'

const app = express()
const PORT = process.env.PORT ?? 3000

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://v0-hackbuddy.vercel.app',
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (e.g. curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api', authRouter)
app.use('/api/users', userRouter)
app.use('/api/hackathons', hackathonRouter)
app.use('/api/seed-hackathons', hackathonSeedRouter)
app.use('/api/teams', teamRouter)
app.use('/api/search', searchRouter)
app.use('/api/notifications', notificationRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

let server: ReturnType<typeof app.listen> | undefined
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export { app, server }
export default app
