// backend/src/routes/guest.route.ts
import type { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'node:crypto'
import { users } from '../db/schema.ts'

export const guestRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/guest', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      tags: ['identity'],
      summary: 'Create anonymous guest user',
      description:
        'Creates a new anonymous user record. Called by the client on first visit when no userId exists in localStorage. Exempt from X-User-Id header requirement.',
      body: {
        type: 'object',
        additionalProperties: false,
      },
      response: {
        201: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Cryptographically random UUID assigned to this guest user',
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    const id = randomUUID()
    await fastify.db.insert(users).values({ id })
    return reply.status(201).send({ userId: id })
  })
}
