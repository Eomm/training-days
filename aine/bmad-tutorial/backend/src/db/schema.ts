// backend/src/db/schema.ts
// This file is the SINGLE SOURCE OF TRUTH for all Drizzle table definitions.
// Table definitions are added per story:
//   - Story 2.1: `users` table ✅
//   - Story 3.1: `todos` table (pgTable with id UUID, userId FK, text, done bool, createdAt timestamp)

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

// Story 2.1: users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  type: text('type').notNull().default('guest'), // 'guest' | 'registered'
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Story 3.1: todos table added here
