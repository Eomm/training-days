import type { FastifyInstance } from 'fastify'

export async function healthRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' } },
            required: ['status'],
          },
        },
      },
    },
    async () => {
      return { status: 'ok' }
    },
  )
}
