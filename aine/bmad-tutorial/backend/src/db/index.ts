// backend/src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Factory — called by db.plugin.ts after @fastify/env sets DATABASE_URL
export function createDb(url: string) {
  const queryClient = postgres(url)
  const db = drizzle(queryClient)
  return { db, queryClient }
}
