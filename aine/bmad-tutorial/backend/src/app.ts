import Fastify from 'fastify'
import type { FastifyInstance, FastifyServerOptions, FastifyError } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fastifyEnv from '@fastify/env'
import dbPlugin from './plugins/db.plugin.ts'
import { validateUserIdHook } from './plugins/auth.plugin.ts'
import { healthRoute } from './routes/health.route.ts'
import { guestRoute } from './routes/guest.route.ts'
import { todosRoute } from './routes/todos.route.ts'

const envSchema = {
  type: 'object',
  required: ['DATABASE_URL', 'PORT', 'CORS_ORIGIN'],
  properties: {
    DATABASE_URL: { type: 'string' },
    PORT: { type: 'string', default: '3000' },
    CORS_ORIGIN: { type: 'string', default: 'http://localhost:5173' },
    LOG_LEVEL: { type: 'string', default: 'info' },
    RATE_LIMIT_MAX: { type: 'string', default: '100' },
  },
}

export async function build(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger ?? { level: process.env.LOG_LEVEL ?? 'info' },
    ...opts,
  })

  // Env validation — register first so all subsequent plugins can read process.env safely
  await app.register(fastifyEnv, { schema: envSchema, dotenv: true })

  // DB plugin — registers fastify.db; requires DATABASE_URL from @fastify/env above
  await app.register(dbPlugin)

  // Global error handler — MUST match { statusCode, error, message } contract (all stories depend on this)
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500
    reply.status(statusCode).send({
      statusCode,
      error: error.name ?? 'Internal Server Error',
      message: error.message ?? 'An unexpected error occurred',
    })
  })

  // Security plugins
  await app.register(helmet)
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    timeWindow: '1 minute',
    skipOnError: true,
    allowList: ['/health'],
  })

  // API documentation — swagger before swagger-ui
  await app.register(swagger, {
    openapi: {
      info: { title: 'MotivaTodo API', version: '1.0.0' },
    },
  })
  await app.register(swaggerUi, { routePrefix: '/documentation' })

  // Routes

  // No-auth routes:
  app.register(async function plugin(app) {
    await app.register(healthRoute)
    await app.register(guestRoute)
  })

  // Auth routes:
  app.register(async function plugin(app) {
    app.addHook('onRequest', validateUserIdHook)
    await app.register(todosRoute)
  })

  return app
}
