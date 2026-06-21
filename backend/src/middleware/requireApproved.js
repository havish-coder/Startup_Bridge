// Blocks users who are not approved yet (pending) or suspended.
// Use AFTER requireAuth.
//
// Re-reads status from the DB on every request so that an admin
// suspension takes effect immediately — not 7 days later when the
// JWT finally expires.
import prisma from '../prisma.js'

export async function requireApproved(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { status: true },
    })
    if (!user || user.status !== 'approved') {
      return res.status(403).json({ error: 'Your account is not approved' })
    }
    next()
  } catch (err) {
    next(err)
  }
}
