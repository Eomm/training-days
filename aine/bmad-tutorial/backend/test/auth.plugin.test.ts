// backend/test/auth.plugin.test.ts
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { build } from '../src/app.ts'

before(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://motivatodo:motivatodo@localhost:5432/motivatodo'
  process.env.PORT = process.env.PORT ?? '3000'
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
})

test('GET /health is exempt — no X-User-Id required', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/health' })
  assert.equal(res.statusCode, 200)
})

test('POST /guest is exempt — no X-User-Id required', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'POST', url: '/guest', headers: { 'content-type': 'application/json' }, payload: '{}' })
  assert.equal(res.statusCode, 201)
})

test('protected route without X-User-Id returns 400', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/todos' })
  assert.equal(res.statusCode, 400)
  const body = res.json<{ statusCode: number; error: string; message: string }>()
  assert.equal(body.statusCode, 400)
  assert.equal(body.error, 'Bad Request')
  assert.equal(body.message, 'Missing X-User-Id header')
})

test('protected route with valid existing X-User-Id returns 200', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  // Create a real user via POST /guest to get a valid userId
  const guestRes = await app.inject({ method: 'POST', url: '/guest', headers: { 'content-type': 'application/json' }, payload: '{}' })
  assert.equal(guestRes.statusCode, 201)
  const { userId } = guestRes.json<{ userId: string }>()

  const res = await app.inject({
    method: 'GET',
    url: '/todos',
    headers: { 'x-user-id': userId },
  })
  assert.equal(res.statusCode, 200)
  assert.ok(Array.isArray(res.json()))
})

test('protected route with unknown X-User-Id returns 403', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({
    method: 'GET',
    url: '/todos',
    headers: { 'x-user-id': '00000000-0000-4000-8000-000000000000' },
  })
  assert.equal(res.statusCode, 403)
  const body = res.json<{ statusCode: number; error: string; message: string }>()
  assert.equal(body.statusCode, 403)
  assert.equal(body.error, 'Forbidden')
  assert.equal(body.message, 'Unknown user')
})
