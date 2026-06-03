import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { requireRole } from '../src/middleware/requireRole.js'
import { requireAuth } from '../src/middleware/requireAuth.js'

function mockRes() {
  const res = { statusCode: 200, body: null }
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (body) => {
    res.body = body
    return res
  }
  return res
}

describe('requireRole', () => {
  it('calls next() when the role matches', () => {
    const res = mockRes()
    let nextCalled = false
    requireRole(['admin'])({ user: { role: 'admin' } }, res, () => {
      nextCalled = true
    })
    expect(nextCalled).toBe(true)
  })

  it('blocks with 403 when the role does not match', () => {
    const res = mockRes()
    let nextCalled = false
    requireRole(['admin'])({ user: { role: 'startup' } }, res, () => {
      nextCalled = true
    })
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(403)
  })
})

describe('requireAuth', () => {
  it('rejects with 401 when no token is provided', () => {
    const res = mockRes()
    let nextCalled = false
    requireAuth({ headers: {} }, res, () => {
      nextCalled = true
    })
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('attaches req.user for a valid token', () => {
    const token = jwt.sign(
      { id: 'u1', role: 'startup', status: 'approved' },
      process.env.JWT_SECRET
    )
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = mockRes()
    let nextCalled = false
    requireAuth(req, res, () => {
      nextCalled = true
    })
    expect(nextCalled).toBe(true)
    expect(req.user.id).toBe('u1')
  })
})
