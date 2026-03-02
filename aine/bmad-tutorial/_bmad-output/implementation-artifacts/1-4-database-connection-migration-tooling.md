# Story 1.4: Database Connection & Migration Tooling

Status: done

## Story

As a **developer**,
I want a PostgreSQL database connection via Drizzle ORM with migration tooling ready,
so that subsequent epics can define and migrate their schemas.

## Acceptance Criteria

1. **Given** a running PostgreSQL instance (local or Docker), **When** I run `drizzle-kit push`, **Then** the command connects to the database successfully (exit code 0).
2. `drizzle.config.ts` is present in `backend/` and configured for the PostgreSQL connection using `DATABASE_URL`.
3. `backend/src/db/index.ts` exports the Drizzle `db` instance.
4. `backend/src/db/schema.ts` is the single source of truth for all table definitions (starts empty — tables added in Epic 2+).
5. `DATABASE_URL` is configurable via env variable (already present in `backend/.env.example`).
6. `backend/src/plugins/db.plugin.ts` registers the Drizzle `db` instance as a Fastify decorator so all routes access it via `fastify.db`.
7. `app.ts` registers `db.plugin.ts` so the DB is available at route registration time.
8. Running `node --test` via `npm run test --workspace=backend` still exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Create `backend/drizzle.config.ts` (AC: 1, 2)
  - [x] Use `defineConfig` from `drizzle-kit`
  - [x] Set `dialect: 'postgresql'`
  - [x] Set `schema: './src/db/schema.ts'`
  - [x] Set `out: './src/db/migrations'`
  - [x] Read `DATABASE_URL` from `process.env.DATABASE_URL` for `dbCredentials.url`
  - [x] See Dev Notes for exact file content

- [x] Task 2 — Create `backend/src/db/schema.ts` (AC: 4)
  - [x] File starts with only the Drizzle imports needed for future table definitions
  - [x] No table definitions yet — tables are added story-by-story in Epics 2 and 3
  - [x] Export comments document which epic/story will add each table
  - [x] See Dev Notes for exact file content

- [x] Task 3 — Create `backend/src/db/index.ts` (AC: 3)
  - [x] Import `drizzle` from `drizzle-orm/postgres-js` and `postgres` from `postgres`
  - [x] Export `createDb(url: string)` factory that creates and returns `{ db, queryClient }`
  - [x] Factory pattern prevents top-level module execution before `@fastify/env` sets `DATABASE_URL`
  - [x] `db.plugin.ts` calls `createDb(process.env.DATABASE_URL!)` inside the plugin body
  - [x] See Dev Notes for actual file content

- [x] Task 4 — Create `backend/src/plugins/db.plugin.ts` (AC: 6)
  - [x] Use `fastify-plugin` (`fp`) to ensure the decorator is scoped globally (not per-plugin)
  - [x] Decorate `fastify` with `db` using `fastify.decorate('db', db)`
  - [x] Add a TypeScript module augmentation (`declare module 'fastify'`) for the `db` property
  - [x] Register `fastify.addHook('onClose', ...)` to close the postgres connection cleanly
  - [x] See Dev Notes for exact file content

- [x] Task 5 — Register `db.plugin.ts` in `app.ts` (AC: 7)
  - [x] Import `dbPlugin` from `./plugins/db.plugin.ts`
  - [x] Register AFTER `@fastify/env` (so `DATABASE_URL` is validated and available) but BEFORE route registrations
  - [x] Do NOT change any existing plugin registrations — only insert the new `await app.register(dbPlugin)` line

- [x] Task 6 — Add DB scripts to `backend/package.json` (AC: 1)
  - [x] `"db:push": "drizzle-kit push"` — pushes schema directly to DB (dev workflow)
  - [x] `"db:generate": "drizzle-kit generate"` — generates SQL migration files
  - [x] `"db:migrate": "drizzle-kit migrate"` — applies migration files (production workflow)
  - [x] These scripts require `DATABASE_URL` to be set in the environment before running

- [x] Task 7 — Verify `backend/.env.example` contains `DATABASE_URL` (AC: 5)
  - [x] `DATABASE_URL=postgres://motivatodo:motivatodo@localhost:5432/motivatodo` should already be present from Story 1.2
  - [x] If not, add it with the above example value
  - [x] Confirm `backend/.env` (gitignored, local dev) also has this value for local testing

- [x] Task 8 — Write integration test for DB plugin (AC: 8)
  - [x] Create `backend/test/db.plugin.test.ts`
  - [x] Test 1: `build()` resolves without error when `DATABASE_URL` is set (even if DB is unreachable — plugin should register, the error appears at query time)
  - [x] Test 2: `fastify.db` is defined after `build()` completes
  - [x] Use `build({ logger: false })` + `app.inject()` (do NOT call `listen()`)
  - [x] Call `app.close()` in cleanup (`t.after(() => app.close())`)
  - [x] Pre-set `process.env.DATABASE_URL` in test if not already set via `.env`
  - [x] See Dev Notes for exact test content

## Dev Notes

### Critical: Dependency Versions Already Installed

> **All required packages are already in `backend/package.json`** — no `npm install` needed for this story:
>
> - `drizzle-orm: ^0.45.1`
> - `postgres: ^3.4.8`
> - `drizzle-kit: ^0.31.9` (devDependency)
> - `fastify-plugin: ^5.1.0`

### `backend/drizzle.config.ts`

```typescript
// backend/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

> **drizzle-kit CLI:** With `drizzle-kit ^0.31.x`, the commands are:
>
> - `drizzle-kit push` — direct schema push (dev, no migration files)
> - `drizzle-kit generate` — generate SQL migration files from schema diff
> - `drizzle-kit migrate` — apply generated migration files
> - `drizzle-kit studio` — visual DB browser (optional dev tool)
>
> `DATABASE_URL` must be set in environment when running any `drizzle-kit` command. Running `npm run db:push` reads from `backend/.env` automatically via `drizzle-kit`'s built-in dotenv support.

### `backend/src/db/schema.ts` — Starts Empty

```typescript
// backend/src/db/schema.ts
// This file is the SINGLE SOURCE OF TRUTH for all Drizzle table definitions.
// Import helpers here as tables are added. Table definitions are added per story:
//   - Story 2.1: `users` table (pgTable with id UUID, type text, createdAt timestamp)
//   - Story 3.1: `todos` table (pgTable with id UUID, userId FK, text, done bool, createdAt timestamp)

// Anticipated imports (uncomment when adding tables):
// import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

// No tables defined yet — this establishes tooling only.
// drizzle-kit push with an empty schema is valid and connects to verify credentials.
export {};
```

> **Why start empty?** This story proves the connection and tooling work. Actual schemas belong to the stories that introduce the corresponding routes (users table → Story 2.1, todos table → Story 3.1). Never add tables in anticipation — add them when the consuming route is built.

> **Architecture reference for future tables** [Source: _bmad-output/planning-artifacts/architecture.md#Database Schema]:
>
> ```typescript
> // users table (Story 2.1):
> export const users = pgTable("users", {
>   id: uuid("id").primaryKey(),
>   type: text("type").notNull().default("guest"),
>   createdAt: timestamp("created_at").notNull().defaultNow(),
> });
> // todos table (Story 3.1):
> export const todos = pgTable("todos", {
>   id: uuid("id").primaryKey().defaultRandom(),
>   userId: uuid("user_id")
>     .notNull()
>     .references(() => users.id),
>   text: text("text").notNull(),
>   done: boolean("done").notNull().default(false),
>   createdAt: timestamp("created_at").notNull().defaultNow(),
> });
> ```
>
> Columns use `snake_case` (DB layer); JSON fields use `camelCase` (API layer). Drizzle handles the mapping.

### `backend/src/db/index.ts` — DB Instance Export

```typescript
// backend/src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// queryClient is exported so db.plugin.ts can close it on fastify shutdown
export const queryClient = postgres(process.env.DATABASE_URL!);

// db is the Drizzle instance used in all routes via fastify.db
export const db = drizzle(queryClient);
```

> **Import path note:** `drizzle-orm/postgres-js` is the sub-path for the `postgres` (postgres.js) driver adapter. Do NOT use `drizzle-orm/node-postgres` (that's for `pg` / `node-postgres`). The installed driver is `postgres` (postgres.js), matching the architecture decision. [Source: _bmad-output/planning-artifacts/architecture.md#Backend — Fastify 5 + TypeScript + Drizzle ORM]

> **DATABASE_URL must be loaded before this module is imported.** `@fastify/env` in `app.ts` validates and sets `process.env.DATABASE_URL` before `db.plugin.ts` (which imports from `db/index.ts`) is registered. Registration order in `app.ts` is critical — see Task 5.

### `backend/src/plugins/db.plugin.ts` — Fastify DB Plugin

```typescript
// backend/src/plugins/db.plugin.ts
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { db, queryClient } from "../db/index.js";

// TypeScript module augmentation — allows `fastify.db` to be fully typed in routes
declare module "fastify" {
  interface FastifyInstance {
    db: typeof db;
  }
}

async function dbPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorate("db", db);

  // Clean close — end postgres connection pool when Fastify shuts down
  fastify.addHook("onClose", async () => {
    await queryClient.end();
  });
}

export default fp(dbPlugin, { name: "db" });
```

> **Why `fastify-plugin`?** Without `fp()`, Fastify encapsulates plugins — decorators added inside a plugin are only visible to children. `fastify-plugin` breaks encapsulation so `fastify.db` is visible to ALL routes regardless of where they are registered. This is the standard pattern for shared resources (DB, auth). [Source: _bmad-output/planning-artifacts/architecture.md#Code Organization]

> **`onClose` hook:** Always close the postgres connection pool on shutdown. This prevents test hangs (Node process stays alive if connections remain open) and ensures graceful shutdown in production containers.

### `app.ts` — Registration Order (CRITICAL)

The DB plugin must be registered AFTER `@fastify/env` but BEFORE routes:

```typescript
// In build() inside app.ts — after the existing fastifyEnv registration:

// Env validation — FIRST (already present from Story 1.2)
await app.register(fastifyEnv, { schema: envSchema, dotenv: true });

// --- ADD THIS LINE (after fastifyEnv, before security plugins) ---
// DB plugin — registers fastify.db; requires DATABASE_URL from @fastify/env above
import dbPlugin from "./plugins/db.plugin.js";
// ...
await app.register(dbPlugin);
// ----------------------------------------------------------------

// Security plugins (already present)
await app.register(helmet);
// ...rest unchanged
```

> **Exact placement:** Insert `await app.register(dbPlugin)` immediately after the `@fastify/env` registration block and before `await app.register(helmet)`. This ensures `DATABASE_URL` is validated before the postgres connection is attempted.

> **envSchema update:** `DATABASE_URL` must be in the required array. Story 1.2 already added it (`"required": ["DATABASE_URL", "PORT", "CORS_ORIGIN"]`). No change needed.

### `backend/src/plugins/db.plugin.test.ts` — Test

```typescript
// backend/src/plugins/db.plugin.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "../app.js";

// Ensure DATABASE_URL is set — drizzle/postgres doesn't connect until first query
process.env.DATABASE_URL ??=
  "postgres://motivatodo:motivatodo@localhost:5432/motivatodo";
process.env.PORT ??= "3000";
process.env.CORS_ORIGIN ??= "http://localhost:5173";

test("db plugin registers fastify.db decorator", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());

  assert.ok(app.db !== undefined, "fastify.db should be defined after build()");
});
```

> **No live DB required for the decorator test.** `postgres` (postgres.js) is lazy — it does not connect until the first actual SQL query. The `build()` will succeed even if PostgreSQL is not running. The test only verifies the decorator exists.
>
> **For AC 1 (drizzle-kit push success):** This requires a running PostgreSQL. Use `docker compose up postgres -d` locally or integrate into CI with a postgres service container. The test above does NOT require a live DB — `db:push` is the manual acceptance gate.

### Project Structure After This Story

```
backend/
├── drizzle.config.ts          ← NEW: drizzle-kit config
└── src/
    ├── app.ts                 ← MODIFIED: register dbPlugin
    ├── server.ts              (unchanged)
    ├── db/
    │   ├── index.ts           ← NEW: postgres + drizzle instance
    │   ├── schema.ts          ← NEW: empty (tables added in Epics 2-3)
    │   └── migrations/        ← generated by drizzle-kit (gitignored or committed)
    ├── plugins/
    │   └── db.plugin.ts       ← NEW: fastify decorator for db
    ├── routes/
    │   └── health.route.ts    (unchanged)
    └── test/
        ├── health.test.ts         (unchanged)
        └── db.plugin.test.ts      ← NEW: decorator test
```

### Naming Conventions Enforced

Per [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]:

- DB columns: `snake_case` — `user_id`, `created_at` (Drizzle maps to `camelCase` via schema)
- Backend plugin files: `kebab-case` — `db.plugin.ts` ✓
- DB folder: `backend/src/db/` ✓
- Migrations folder: `backend/src/db/migrations/` ✓ (generated, never hand-edit)

### Git Intelligence (Story Context)

Recent relevant commits:

- `fd8e695 bmad: backend scaffholding` — Story 1.2 implementation (Fastify skeleton)
- `380e425 bmad: imple 1.1` — monorepo initialization

The backend `app.ts` factory pattern from Story 1.2 is the integration point. No frontend changes in this story.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

- Import extensions: story Dev Notes used `.js` extensions but the existing backend codebase uses `.ts` extensions with `--experimental-strip-types`. Fixed all imports to `.ts` accordingly: `db.plugin.ts`, `db.plugin.test.ts`, `app.ts`.
- Test file location: `db.plugin.test.ts` placed in `backend/test/` (not co-located) per backend convention (all test files in `test/`). Test script remains `test/**/*.test.ts`.

### Completion Notes List

- All 8 tasks complete; 4/4 tests pass (`node --test`)
- `drizzle.config.ts` created at backend root
- `schema.ts` starts empty with comments pointing to Story 2.1 (users) and 3.1 (todos)
- `db/index.ts` exports `createDb(url)` factory (not a top-level instance) — avoids ES module hoisting bug where `postgres()` would execute before `@fastify/env` sets `DATABASE_URL` in tests
- `db.plugin.ts` calls `createDb(process.env.DATABASE_URL!)` inside the plugin body; uses `fastify-plugin` for global decorator scope; `onClose` cleans up connection
- `app.ts` registers `dbPlugin` after `fastifyEnv`, before security plugins
- `db:push`, `db:generate`, `db:migrate` scripts added to `package.json`

### File List

- `backend/drizzle.config.ts` — NEW: drizzle-kit config
- `backend/src/db/schema.ts` — NEW: empty schema stub
- `backend/src/db/index.ts` — NEW: postgres + drizzle instance
- `backend/src/plugins/db.plugin.ts` — NEW: Fastify db decorator
- `backend/test/db.plugin.test.ts` — NEW: decorator test (moved to test/ per convention)
- `backend/src/app.ts` — UPDATED: +dbPlugin registration
- `backend/package.json` — UPDATED: test glob + db: scripts
