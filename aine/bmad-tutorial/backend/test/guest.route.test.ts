// backend/test/guest.route.test.ts
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { build } from '../src/app.ts'

before(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://motivatodo:motivatodo@localhost:5432/motivatodo'
  process.env.PORT = process.env.PORT ?? '3000'
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
})

test('POST /guest returns 201 with a valid UUID userId', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'POST', url: '/guest' })
  assert.equal(res.statusCode, 201)
  const body = res.json<{ userId: string }>()
  assert.ok(typeof body.userId === 'string')
  assert.match(body.userId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
})

test('POST /guest called twice returns two different userIds', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res1 = await app.inject({ method: 'POST', url: '/guest' })
  const res2 = await app.inject({ method: 'POST', url: '/guest' })
  assert.equal(res1.statusCode, 201)
  assert.equal(res2.statusCode, 201)
  const id1 = res1.json<{ userId: string }>().userId
  const id2 = res2.json<{ userId: string }>().userId
  assert.notEqual(id1, id2)
})

test('POST /guest response body contains only userId', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'POST', url: '/guest' })
  const body = res.json<Record<string, unknown>>()
  assert.deepEqual(Object.keys(body).sort(), ['userId'])
})
