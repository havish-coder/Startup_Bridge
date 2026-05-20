import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

// Validate required env vars at startup
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is missing in .env')
  process.exit(1)
}

const app = express()

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

// Health check — visit http://localhost:4000/api/health to confirm server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Routes (added sprint by sprint)
// app.use('/api/auth', authRoutes)

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
