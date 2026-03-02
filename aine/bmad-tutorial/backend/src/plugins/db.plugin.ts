// backend/src/plugins/db.plugin.ts
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createDb } from '../db/index.ts'

// TypeScript module augmentation — allows `fastify.db` to be fully typed in routes
declare module 'fastify' {
  interface FastifyInstance {
    db: PostgresJsDatabase
  }
}

async function dbPlugin(fastify: FastifyInstance): Promise<void> {
  // Create connection here — after @fastify/env has set DATABASE_URL
  const { db, queryClient } = createDb(process.env.DATABASE_URL!)

  fastify.decorate('db', db)

  // Clean close — end postgres connection pool when Fastify shuts down
  fastify.addHook('onClose', async () => {
    await queryClient.end()
  })
}

export default fp(dbPlugin, { name: 'db' })
