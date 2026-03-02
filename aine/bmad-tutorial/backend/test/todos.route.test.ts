// backend/test/todos.route.test.ts
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { build } from '../src/app.ts'

before(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://motivatodo:motivatodo@localhost:5432/motivatodo'
  process.env.PORT = process.env.PORT ?? '3000'
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
})

// Helper: create a guest user and return userId
async function createUser(app: Awaited<ReturnType<typeof build>>): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/guest', headers: { 'content-type': 'application/json' }, payload: '{}' })
  assert.equal(res.statusCode, 201)
  return res.json<{ userId: string }>().userId
}

// ─── GET /todos ───────────────────────────────────────────────────────────────

test('GET /todos without X-User-Id returns 400', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/todos' })
  assert.equal(res.statusCode, 400)
})

test('GET /todos with valid userId returns 200 and empty array when no todos exist', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const res = await app.inject({
    method: 'GET',
    url: '/todos',
    headers: { 'x-user-id': userId },
  })
  assert.equal(res.statusCode, 200)
  const body = res.json<unknown[]>()
  assert.ok(Array.isArray(body))
  assert.equal(body.length, 0)
})

test('GET /todos returns only todos for the requesting user', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId1 = await createUser(app)
  const userId2 = await createUser(app)

  // Add a todo for user1
  await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId1, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'User 1 task' }),
  })

  // User2 should see no todos
  const res = await app.inject({
    method: 'GET',
    url: '/todos',
    headers: { 'x-user-id': userId2 },
  })
  assert.equal(res.statusCode, 200)
  const body = res.json<unknown[]>()
  assert.equal(body.length, 0)
})

test('GET /todos returns todos sorted newest first', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)

  await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'First task' }),
  })
  await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'Second task' }),
  })

  const res = await app.inject({
    method: 'GET',
    url: '/todos',
    headers: { 'x-user-id': userId },
  })
  assert.equal(res.statusCode, 200)
  const body = res.json<Array<{ text: string; createdAt: string }>>()
  assert.equal(body.length, 2)
  // Newest first: "Second task" should come before "First task"
  assert.equal(body[0].text, 'Second task')
  assert.equal(body[1].text, 'First task')
})

// ─── POST /todos ──────────────────────────────────────────────────────────────

test('POST /todos without X-User-Id returns 400', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const res = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'hello' }),
  })
  assert.equal(res.statusCode, 400)
})

test('POST /todos with valid body creates todo and returns 201', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const res = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'Buy milk' }),
  })
  assert.equal(res.statusCode, 201)
  const body = res.json<{ id: string; userId: string; text: string; done: boolean; createdAt: string }>()
  assert.ok(typeof body.id === 'string')
  assert.equal(body.userId, userId)
  assert.equal(body.text, 'Buy milk')
  assert.equal(body.done, false)
  assert.ok(typeof body.createdAt === 'string')
})

test('POST /todos with empty text returns 400', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const res = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: '' }),
  })
  assert.equal(res.statusCode, 400)
})

test('POST /todos with missing text returns 400', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const res = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({}),
  })
  assert.equal(res.statusCode, 400)
})

// ─── PATCH /todos/:id ─────────────────────────────────────────────────────────

test('PATCH /todos/:id marks todo as done and returns 200 with todo and quote', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'Finish project' }),
  })
  const { id } = createRes.json<{ id: string }>()

  const res = await app.inject({
    method: 'PATCH',
    url: `/todos/${id}`,
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ done: true }),
  })
  assert.equal(res.statusCode, 200)
  const body = res.json<{ todo: { id: string; done: boolean }; quote: string }>()
  assert.equal(body.todo.id, id)
  assert.equal(body.todo.done, true)
  assert.ok(typeof body.quote === 'string')
  assert.ok(body.quote.length > 0)
})

test('PATCH /todos/:id returns 404 for non-existent todo', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const res = await app.inject({
    method: 'PATCH',
    url: '/todos/00000000-0000-4000-8000-000000000000',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ done: true }),
  })
  assert.equal(res.statusCode, 404)
})

test('PATCH /todos/:id returns 403 when patching another user\'s todo', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId1 = await createUser(app)
  const userId2 = await createUser(app)

  // User1 creates a todo
  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId1, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'User 1 private task' }),
  })
  const { id } = createRes.json<{ id: string }>()

  // User2 tries to patch it
  const res = await app.inject({
    method: 'PATCH',
    url: `/todos/${id}`,
    headers: { 'x-user-id': userId2, 'content-type': 'application/json' },
    payload: JSON.stringify({ done: true }),
  })
  assert.equal(res.statusCode, 403)
})

// ─── DELETE /todos/:id ────────────────────────────────────────────────────────

test('DELETE /todos/:id returns 204 with empty body', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'Task to delete' }),
  })
  const { id } = createRes.json<{ id: string }>()

  const res = await app.inject({
    method: 'DELETE',
    url: `/todos/${id}`,
    headers: { 'x-user-id': userId },
  })
  assert.equal(res.statusCode, 204)
  assert.equal(res.body, '')
})

test('DELETE /todos/:id removes the todo from GET /todos', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'Ephemeral task' }),
  })
  const { id } = createRes.json<{ id: string }>()

  await app.inject({
    method: 'DELETE',
    url: `/todos/${id}`,
    headers: { 'x-user-id': userId },
  })

  const listRes = await app.inject({
    method: 'GET',
    url: '/todos',
    headers: { 'x-user-id': userId },
  })
  const todos = listRes.json<Array<{ id: string }>>()
  assert.ok(!todos.some((t) => t.id === id))
})

test('DELETE /todos/:id returns 404 for non-existent todo', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId = await createUser(app)
  const res = await app.inject({
    method: 'DELETE',
    url: '/todos/00000000-0000-4000-8000-000000000001',
    headers: { 'x-user-id': userId },
  })
  assert.equal(res.statusCode, 404)
})

test('DELETE /todos/:id returns 403 when deleting another user\'s todo', async (t) => {
  const app = await build({ logger: false })
  t.after(() => app.close())

  const userId1 = await createUser(app)
  const userId2 = await createUser(app)

  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'x-user-id': userId1, 'content-type': 'application/json' },
    payload: JSON.stringify({ text: 'User 1 protected task' }),
  })
  const { id } = createRes.json<{ id: string }>()

  const res = await app.inject({
    method: 'DELETE',
    url: `/todos/${id}`,
    headers: { 'x-user-id': userId2 },
  })
  assert.equal(res.statusCode, 403)
})
