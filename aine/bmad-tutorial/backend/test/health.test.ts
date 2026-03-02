import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { build } from '../src/app.ts'

// Set required env vars for tests
before(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://motivatodo:motivatodo@localhost:5432/motivatodo'
  process.env.PORT = process.env.PORT ?? '3000'
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
})

test('GET /health returns 200 with { status: "ok" }', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/health' })
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.json(), { status: 'ok' })
})

test('GET /documentation returns 200 (Swagger UI reachable)', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/documentation' })
  assert.equal(res.statusCode, 200)
})

test('unknown route error response matches { statusCode, error, message } shape', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/nonexistent' })
  assert.equal(res.statusCode, 404)
  const body = res.json()
  assert.ok('statusCode' in body)
  assert.ok('error' in body)
  assert.ok('message' in body)
})
