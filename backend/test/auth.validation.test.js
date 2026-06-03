import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '../src/app.js'

// These exercise the Zod validation layer, which runs BEFORE any database
// access — so they pass without a running Postgres. They prove malformed
// input is rejected with 400 instead of crashing the route with a 500.
let app
beforeAll(() => {
  app = buildApp()
})

const validRegister = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'secret1',
  role: 'startup',
  verificationNote: 'A sufficiently long description of my startup idea.',
}

describe('POST /api/auth/register validation', () => {
  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/email/i)
  })

  it('rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, password: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/password/i)
  })

  it('rejects self-registration as admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, role: 'admin' })
    expect(res.status).toBe(400)
  })

  it('rejects a too-short verification note', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, verificationNote: 'short' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login validation', () => {
  it('rejects a missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' })
    expect(res.status).toBe(400)
  })
})
