// backend/src/routes/todos.route.ts
import { createRequire } from 'node:module'
import type { FastifyPluginAsync } from 'fastify'
import { eq, desc } from 'drizzle-orm'
import { todos } from '../db/schema.ts'

const require = createRequire(import.meta.url)
const quotes: string[] = require('../data/quotes.json')

export const todosRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/todos', {
    schema: {
      tags: ['todos'],
      summary: 'List all todos for the requesting user',
      headers: {
        type: 'object',
        required: ['x-user-id'],
        properties: {
          'x-user-id': { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'userId', 'text', 'done', 'createdAt'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              text: { type: 'string' },
              done: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async (request) => {
    const userId = request.headers['x-user-id'] as string
    const rows = await fastify.db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(desc(todos.createdAt))

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      text: row.text,
      done: row.done,
      createdAt: row.createdAt.toISOString(),
    }))
  })

  fastify.post('/todos', {
    schema: {
      tags: ['todos'],
      summary: 'Create a new todo',
      headers: {
        type: 'object',
        required: ['x-user-id'],
        properties: {
          'x-user-id': { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1, maxLength: 250 },
        },
      },
      response: {
        201: {
          type: 'object',
          required: ['id', 'userId', 'text', 'done', 'createdAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            text: { type: 'string' },
            done: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { text } = request.body as { text: string }
    const userId = request.headers['x-user-id'] as string

    const [row] = await fastify.db
      .insert(todos)
      .values({ userId, text })
      .returning()

    return reply.status(201).send({
      id: row.id,
      userId: row.userId,
      text: row.text,
      done: row.done,
      createdAt: row.createdAt.toISOString(),
    })
  })

  fastify.patch('/todos/:id', {
    schema: {
      tags: ['todos'],
      summary: 'Update a todo (mark done)',
      headers: {
        type: 'object',
        required: ['x-user-id'],
        properties: {
          'x-user-id': { type: 'string', format: 'uuid' },
        },
      },
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        required: ['done'],
        properties: { done: { type: 'boolean' } },
      },
      response: {
        200: {
          type: 'object',
          required: ['todo', 'quote'],
          properties: {
            todo: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                text: { type: 'string' },
                done: { type: 'boolean' },
                createdAt: { type: 'string' },
              },
            },
            quote: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { done } = request.body as { done: boolean }
    const userId = request.headers['x-user-id'] as string

    const [existing] = await fastify.db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1)

    if (!existing) {
      return reply.status(404 as any).send({ statusCode: 404, error: 'Not Found', message: 'Todo not found' })
    }
    if (existing.userId !== userId) {
      return reply.status(403 as any).send({ statusCode: 403, error: 'Forbidden', message: 'Not your todo' })
    }

    const [updated] = await fastify.db
      .update(todos)
      .set({ done })
      .where(eq(todos.id, id))
      .returning()

    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    return reply.send({
      todo: {
        id: updated.id,
        userId: updated.userId,
        text: updated.text,
        done: updated.done,
        createdAt: updated.createdAt.toISOString(),
      },
      quote,
    })
  })

  fastify.delete('/todos/:id', {
    schema: {
      tags: ['todos'],
      summary: 'Delete a todo',
      headers: {
        type: 'object',
        required: ['x-user-id'],
        properties: {
          'x-user-id': { type: 'string', format: 'uuid' },
        },
      },
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        204: { type: 'null', description: 'Todo deleted' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.headers['x-user-id'] as string

    const [existing] = await fastify.db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1)

    if (!existing) {
      return reply.status(404 as any).send({ statusCode: 404, error: 'Not Found', message: 'Todo not found' })
    }
    if (existing.userId !== userId) {
      return reply.status(403 as any).send({ statusCode: 403, error: 'Forbidden', message: 'Not your todo' })
    }

    await fastify.db.delete(todos).where(eq(todos.id, id))
    return reply.status(204).send()
  })
}
