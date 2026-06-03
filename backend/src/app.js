// Builds and configures the Express app WITHOUT starting it listening.
// server.js imports this and calls listen(); tests import it directly into supertest.
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import pitchRoutes from './routes/pitches.js'
import interestRoutes from './routes/interests.js'
import investorPitchRoutes from './routes/investor/pitches.js'
import investorInterestRoutes from './routes/investor/interests.js'
import fileRoutes from './routes/files.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import startupRoutes from './routes/startup_routes.js'
import negotiationRoutes from './routes/negotiations.js'
import messageRoutes from './routes/messages.js'
import { errorHandler } from './middleware/errorHandler.js'

// Money is stored as BigInt. Without this, res.json() throws
// "Do not know how to serialize a BigInt" in any route that forgets
// to .toString() it manually. One line removes the whole class of bug.
// We return a string (not Number) so the JSON contract is unchanged and
// large values never lose precision.
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export function buildApp() {
  const app = express()

  // Security headers (CSP, nosniff, etc.)
  app.use(helmet())

  // CORS — pin to the known frontend origin. Falling back to "*" (the cors
  // default when origin is undefined) would let any site call the API, so we
  // require FRONTEND_URL to be set explicitly.
  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is missing in .env — required to pin CORS')
  }
  app.use(cors({ origin: process.env.FRONTEND_URL }))

  app.use(express.json({ limit: '1mb' }))

  // Global rate limiter — backstop against abuse on every endpoint.
  // Generous enough not to trip the 5s chat / 30s notification polling
  // (one active user is well under 20 req/min). The stricter login/register
  // limiters in routes/auth.js stack on top of this.
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests — please slow down' },
    })
  )

  // Health check — visit /api/health to confirm the server is running
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/pitches', pitchRoutes)
  app.use('/api/interests', interestRoutes)
  app.use('/api/investor/pitches', investorPitchRoutes)
  app.use('/api/investor/interests', investorInterestRoutes)
  app.use('/api/files', fileRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/startup', startupRoutes)
  app.use('/api/negotiations', negotiationRoutes)
  app.use('/api/messages', messageRoutes)

  // Error handler — MUST be last
  app.use(errorHandler)

  return app
}
