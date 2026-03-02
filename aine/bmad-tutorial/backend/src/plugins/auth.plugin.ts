// backend/src/plugins/auth.plugin.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema.ts'

export async function validateUserIdHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Fastify lowercases all header names — always read as 'x-user-id'
  const rawUserId = request.headers['x-user-id']
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId

  if (!userId || userId.trim() === '') {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Missing X-User-Id header',
    })
  }

  // Verify the userId exists in the users table
  const db = (request.server as FastifyInstance).db
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (rows.length === 0) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Unknown user',
    })
  }
}
