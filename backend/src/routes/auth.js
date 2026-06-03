import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { parseBody } from '../lib/validate.js'

const router = express.Router()

// ── Validation schemas ────────────────────────────────────────────
// Email is trimmed + lowercased so sign-up and login are case-insensitive
// and we don't end up with duplicate accounts that differ only by case.
const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().toLowerCase().email('A valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    // Admins are seeded only — you cannot self-register as admin
    role: z.enum(['investor', 'startup'], { error: 'Role must be investor or startup' }),
    contact_phone: z.string().trim().optional(),
    verificationNote: z.string().optional(),
  })
  // Verification note is mandatory — admin needs this to review the registration.
  // Message is role-specific.
  .superRefine((data, ctx) => {
    if (!data.verificationNote || data.verificationNote.trim().length < 20) {
      ctx.addIssue({
        code: 'custom',
        path: ['verificationNote'],
        message:
          data.role === 'startup'
            ? 'Please describe your startup (at least 20 characters)'
            : 'Please describe your investment background (at least 20 characters)',
      })
    }
  })

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email and password are required'),
  password: z.string().min(1, 'Email and password are required'),
})

// Rate limiter for login — max 10 attempts per IP per 15 minutes.
// Prevents brute-force password attacks. Returns 429 when limit is hit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,   // sends RateLimit-* headers so clients know the limit
  legacyHeaders: false,
  message: { error: 'Too many login attempts — please try again in 15 minutes' },
})

// Rate limiter for register — max 5 registrations per IP per hour.
// Prevents spam account creation.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registrations from this IP — please try again later' },
})

// POST /api/auth/register
// Body: { name, email, password, role, contact_phone }
// Creates a User with status='pending'. Admin must approve before login works.
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const { name, email, password, role, contact_phone, verificationNote } = parseBody(
      registerSchema,
      req.body
    )

    // Email must be unique
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Hash the password — bcrypt auto-generates a unique salt per password (cost 10)
    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status: 'pending',
        contactPhone: contact_phone || null,
        verificationNote: verificationNote.trim(),
      },
    })

    res.status(201).json({ message: 'Registration successful — awaiting admin approval' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
// Body: { email, password }
// Verifies credentials, checks status, returns a JWT valid for 7 days.
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = parseBody(loginSchema, req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    // Same generic message whether email or password is wrong (don't leak which)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Status gate
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Your account is awaiting admin approval' })
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended' })
    }

    // Sign the JWT — payload is minimal (no email, no name)
    const token = jwt.sign(
      { id: user.id, role: user.role, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    )

    // Never send the password hash to the client
    const { passwordHash, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
// Requires a valid JWT. Returns the current user, freshly read from the DB.
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const { passwordHash, ...safeUser } = user
    res.json({ user: safeUser })
  } catch (err) {
    next(err)
  }
})

export default router
