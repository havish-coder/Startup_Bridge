import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '../src/app.js'

let app
beforeAll(() => {
  app = buildApp()
})

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
