import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './services/auth/authRouter'
import userRouter from './services/users/userRouter'
import hackathonRouter from './services/hackathons/hackathonRouter'
import teamRouter from './services/teams/teamRouter'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())
app.use(cookieParser())

app.use('/api', authRouter) // Optionally move auth to /api/auth or keep as '/'
app.use('/api/users', userRouter)
app.use('/api/hackathons', hackathonRouter)
app.use('/api/teams', teamRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

let server: any;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export { app, server }
export default app
