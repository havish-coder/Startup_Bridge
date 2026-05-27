// Admin routes — user management + negotiation oversight
import express from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireApproved } from '../middleware/requireApproved.js'
import { requireRole } from '../middleware/requireRole.js'
import { createNotification } from '../lib/notify.js'

const router = express.Router()
router.use(requireAuth, requireApproved, requireRole(['admin']))

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [pendingUsers, totalUsers, activeNegotiations, concludedDeals] = await Promise.all([
      prisma.user.count({ where: { status: 'pending' } }),
      prisma.user.count(),
      prisma.negotiation.count({ where: { status: { in: ['open', 'pending_admin_close'] } } }),
      prisma.negotiation.count({ where: { status: 'concluded' } }),
    ])
    res.json({ pendingUsers, totalUsers, activeNegotiations, concludedDeals })
  } catch (err) { next(err) }
})

// GET /api/admin/users?status=
router.get('/users', async (req, res, next) => {
  try {
    const where = {}
    if (req.query.status) where.status = req.query.status
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        status: true, contactPhone: true, createdAt: true,
        verificationNote: true,
        _count: { select: { pitches: true, interestsSent: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ users })
  } catch (err) { next(err) }
})

// PUT /api/admin/users/:id/approve
router.put('/users/:id/approve', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.status === 'approved') return res.status(409).json({ error: 'Already approved' })
    await prisma.user.update({ where: { id: user.id }, data: { status: 'approved' } })
    await createNotification(user.id, 'user_approved', 'Account Approved',
      'Your account has been approved. You can now log in.', '/login')
    console.log(`[ADMIN] Approved user ${user.email}`)
    res.json({ message: 'User approved' })
  } catch (err) { next(err) }
})

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot suspend an admin' })
    if (user.status === 'suspended') return res.status(409).json({ error: 'Already suspended' })
    await prisma.user.update({ where: { id: user.id }, data: { status: 'suspended' } })
    console.log(`[ADMIN] Suspended user ${user.email}`)
    res.json({ message: 'User suspended' })
  } catch (err) { next(err) }
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete an admin' })
    const activePitch = await prisma.pitch.findFirst({
      where: { startupId: user.id, status: { in: ['published', 'in_negotiation'] } },
    })
    if (activePitch) return res.status(409).json({ error: 'User has active pitches — withdraw them first' })
    const activeNeg = await prisma.negotiation.findFirst({
      where: {
        OR: [{ startupId: user.id }, { acceptedInvestorId: user.id }],
        status: { in: ['open', 'pending_admin_close'] },
      },
    })
    if (activeNeg) return res.status(409).json({ error: 'User has an active negotiation — close it first' })
    await prisma.user.delete({ where: { id: user.id } })
    console.log(`[ADMIN] Deleted user ${user.email}`)
    res.json({ message: 'User deleted' })
  } catch (err) { next(err) }
})

// GET /api/admin/negotiations?status=
router.get('/negotiations', async (req, res, next) => {
  try {
    const where = {}
    if (req.query.status) where.status = req.query.status
    const negotiations = await prisma.negotiation.findMany({
      where,
      include: {
        pitch: { select: { id: true, title: true, domain: true } },
        startup: { select: { id: true, name: true, email: true } },
        acceptedInvestor: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true, interests: true } },
      },
      orderBy: { openedAt: 'desc' },
    })
    res.json({
      negotiations: negotiations.map(n => ({
        ...n, finalAmount: n.finalAmount?.toString() || null,
      })),
    })
  } catch (err) { next(err) }
})

// GET /api/admin/negotiations/:id/messages
router.get('/negotiations/:id/messages', async (req, res, next) => {
  try {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: req.params.id },
      include: {
        pitch: { select: { id: true, title: true } },
        startup: { select: { id: true, name: true } },
      },
    })
    if (!negotiation) return res.status(404).json({ error: 'Negotiation not found' })
    const messages = await prisma.message.findMany({
      where: { negotiationId: req.params.id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ negotiation, messages })
  } catch (err) { next(err) }
})

// PUT /api/admin/negotiations/:id/conclude
router.put('/negotiations/:id/conclude', async (req, res, next) => {
  try {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: req.params.id }, include: { pitch: true },
    })
    if (!negotiation) return res.status(404).json({ error: 'Negotiation not found' })
    if (!['open', 'pending_admin_close'].includes(negotiation.status)) {
      return res.status(409).json({ error: 'Cannot conclude — negotiation is already ' + negotiation.status })
    }
    await prisma.$transaction(async (tx) => {
      await tx.negotiation.update({ where: { id: negotiation.id }, data: { status: 'concluded', concludedAt: new Date() } })
      await tx.pitch.update({ where: { id: negotiation.pitchId }, data: { status: 'closed', closedAt: new Date() } })
    })
    await createNotification(negotiation.startupId, 'negotiation_concluded', 'Deal Concluded!',
      `The negotiation for "${negotiation.pitch.title}" has been concluded.`, '/dashboard')
    if (negotiation.acceptedInvestorId) {
      await createNotification(negotiation.acceptedInvestorId, 'negotiation_concluded', 'Deal Concluded!',
        `The deal for "${negotiation.pitch.title}" is officially closed.`, '/investor/interests')
    }
    console.log(`[ADMIN] Concluded negotiation for pitch "${negotiation.pitch.title}"`)
    res.json({ message: 'Negotiation concluded' })
  } catch (err) { next(err) }
})

// PUT /api/admin/negotiations/:id/fail
router.put('/negotiations/:id/fail', async (req, res, next) => {
  try {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: req.params.id }, include: { pitch: true },
    })
    if (!negotiation) return res.status(404).json({ error: 'Negotiation not found' })
    if (['concluded', 'failed'].includes(negotiation.status)) {
      return res.status(409).json({ error: 'Negotiation is already ' + negotiation.status })
    }
    await prisma.$transaction(async (tx) => {
      await tx.negotiation.update({ where: { id: negotiation.id }, data: { status: 'failed' } })
      await tx.pitch.update({ where: { id: negotiation.pitchId }, data: { status: 'published' } })
    })
    await createNotification(negotiation.startupId, 'negotiation_concluded', 'Negotiation Failed',
      `The negotiation for "${negotiation.pitch.title}" was marked failed. Pitch is back on the feed.`, '/dashboard')
    console.log(`[ADMIN] Failed negotiation for pitch "${negotiation.pitch.title}"`)
    res.json({ message: 'Negotiation marked as failed' })
  } catch (err) { next(err) }
})

export default router
