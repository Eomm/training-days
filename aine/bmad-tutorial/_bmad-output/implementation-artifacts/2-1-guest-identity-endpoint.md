# Story 2.1: Guest Identity Endpoint

Status: review

## Story

As a **new user**,
I want the backend to silently assign me a unique anonymous ID on my first visit,
so that my data is persisted from the very first interaction with no action required from me.

## Acceptance Criteria

1. **Given** no `X-User-Id` header is present, **When** `POST /guest` is called, **Then** a new anonymous user record is created in the database with a cryptographically random UUID as `id`.
2. The response is `201 Created` with body `{ "userId": "<uuid>" }`.
3. The `users` table is present in `backend/src/db/schema.ts` with columns: `id` (uuid, primary key), `type` (text, not null, default `'guest'`), `created_at` (timestamp, not null, default now).
4. Calling `POST /guest` a second time creates a second independent user — no deduplication.
5. The endpoint is documented in Swagger (tags, summary, response schema).
6. The endpoint does NOT require the `X-User-Id` header (it is explicitly exempt — `validateUserIdHook` from Story 2.2 must never apply to this route).
7. Running `npm run test --workspace=backend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Add `users` table to `backend/src/db/schema.ts` (AC: 3)
  - [x] Import `pgTable`, `uuid`, `text`, `timestamp` from `drizzle-orm/pg-core`
  - [x] Define and export `users` table exactly as specified in Dev Notes
  - [x] Do NOT add `todos` table yet — that is Story 3.1
  - [x] Do NOT remove existing imports/stubs already in the file from Story 1.4

- [x] Task 2 — Create `backend/src/routes/guest.route.ts` (AC: 1, 2, 4, 5, 6)
  - [x] Export `guestRoute: FastifyPluginAsync`
  - [x] Register `POST /guest` route with Swagger schema (see Dev Notes for exact shape)
  - [x] Generate UUID using `randomUUID` from `node:crypto` — no external uuid package needed
  - [x] Insert new user via `fastify.db.insert(users).values({ id })` — `type` and `createdAt` use column defaults
  - [x] Return `reply.status(201).send({ userId: id })`
  - [x] Apply stricter per-route rate limit override: `max: 10, timeWindow: '1 minute'` (see Dev Notes)

- [x] Task 3 — Register `guestRoute` in `backend/src/app.ts` (AC: 1, 6)
  - [x] Import `guestRoute` from `./routes/guest.route.ts`
  - [x] Register AFTER `dbPlugin` and AFTER swagger/swagger-ui, alongside `healthRoute`
  - [x] Do NOT modify any existing registrations — only add the new `await app.register(guestRoute)` line

- [x] Task 4 — Write tests (AC: 7)
  - [x] Create `backend/test/guest.route.test.ts`
  - [x] Test 1: `POST /guest` returns `201` with `{ userId }` where userId is a valid UUID
  - [x] Test 2: Two calls to `POST /guest` return different `userId` values (no deduplication)
  - [x] Test 3: Response body shape matches `{ userId: string }` — no extra fields
  - [x] See Dev Notes for exact test content and DB dependency note
  - [x] Run `npm run test --workspace=backend` — all tests must pass (requires running DB from Story 1.5 Docker Compose or local Postgres)

## Dev Notes

### Dependency: Story 1.4 Must Be Complete

This story builds directly on Story 1.4:

- `fastify.db` decorator — provided by `backend/src/plugins/db.plugin.ts` (Story 1.4 Task 4)
- `drizzle.config.ts` — already configured for schema at `./src/db/schema.ts` (Story 1.4 Task 1)
- `backend/src/db/schema.ts` — stub file exists from Story 1.4 Task 2; this story adds the `users` table to it

If Story 1.4 is not yet done, implement it first before starting 2.1.

### `users` Table Schema

Add to `backend/src/db/schema.ts`:

```typescript
// backend/src/db/schema.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  type: text("type").notNull().default("guest"), // 'guest' | 'registered'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

> **Why no `defaultRandom()` on `id`?** The architecture mandates the route handler generates the UUID using `crypto.randomUUID()` and passes it explicitly. This gives the handler control over the value returned in the response without a round-trip SELECT.

### `POST /guest` Route

```typescript
// backend/src/routes/guest.route.ts
import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import { users } from "../db/schema.js";

export const guestRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/guest",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["identity"],
        summary: "Create anonymous guest user",
        description:
          "Creates a new anonymous user record. Called by the client on first visit when no userId exists in localStorage. Exempt from X-User-Id header requirement.",
        response: {
          201: {
            type: "object",
            required: ["userId"],
            properties: {
              userId: {
                type: "string",
                format: "uuid",
                description:
                  "Cryptographically random UUID assigned to this guest user",
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const id = randomUUID();
      await fastify.db.insert(users).values({ id });
      return reply.status(201).send({ userId: id });
    },
  );
};
```

> **Rate limit override:** The global rate limit in `app.ts` is `max: 100` per minute. This route config overrides it with `max: 10` per minute per IP to prevent UUID farming (architecture requirement). The `@fastify/rate-limit` plugin supports per-route overrides via `config.rateLimit`.

> **`X-User-Id` exemption:** Story 2.2 adds `validateUserIdHook` as a global `onRequest` hook. When that story is implemented, `/guest` and `/health` must be explicitly excluded. This route must never be broken by that hook. The story 2.2 developer must read this note.

### Registering the Route in `app.ts`

Add after the existing `healthRoute` registration:

```typescript
import { guestRoute } from "./routes/guest.route.js";

// inside build():
await app.register(guestRoute);
```

Only add this single line alongside the existing `healthRoute` registration. Do not touch any other part of `app.ts`.

### Test File

Tests require a running PostgreSQL instance (see Docker Compose from Story 1.5, or run a local Postgres with the same credentials). Set `DATABASE_URL` in environment before running.

```typescript
// backend/test/guest.route.test.ts
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { build } from "../src/app.ts";

before(() => {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    "postgres://motivatodo:motivatodo@localhost:5432/motivatodo";
  process.env.PORT = process.env.PORT ?? "3000";
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
});

test("POST /guest returns 201 with a valid UUID userId", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());

  const res = await app.inject({ method: "POST", url: "/guest" });
  assert.equal(res.statusCode, 201);
  const body = res.json<{ userId: string }>();
  assert.ok(typeof body.userId === "string");
  assert.match(
    body.userId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
});

test("POST /guest called twice returns two different userIds", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());

  const res1 = await app.inject({ method: "POST", url: "/guest" });
  const res2 = await app.inject({ method: "POST", url: "/guest" });
  assert.equal(res1.statusCode, 201);
  assert.equal(res2.statusCode, 201);
  const id1 = res1.json<{ userId: string }>().userId;
  const id2 = res2.json<{ userId: string }>().userId;
  assert.notEqual(id1, id2);
});

test("POST /guest response body contains only userId", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());

  const res = await app.inject({ method: "POST", url: "/guest" });
  const body = res.json<Record<string, unknown>>();
  assert.deepEqual(Object.keys(body).sort(), ["userId"]);
});
```

### Architecture Compliance Checklist

- [ ] `users` table defined in `backend/src/db/schema.ts` with exact column specs from architecture
- [ ] UUID generated via `node:crypto` `randomUUID()` — no external package
- [ ] Response shape: `{ userId: string }` — camelCase, matching `GuestResponse` interface in `frontend/src/types.ts`
- [ ] Response status: `201 Created` (not 200)
- [ ] Route exempt from `validateUserIdHook` (Story 2.2 must enforce this)
- [ ] Per-route rate limit: `max: 10, timeWindow: '1 minute'` applied
- [ ] Swagger tags `['identity']`, summary, response schema registered on the route
- [ ] Test file in `backend/test/` (not co-located with source — backend convention)
- [ ] Tests use `app.inject()` + `t.after(() => app.close())` pattern from Story 1.2

### Project Structure After This Story

```
backend/src/
├── app.ts                        ← UPDATED: +guestRoute registration
├── server.ts                     ← unchanged
├── db/
│   ├── schema.ts                 ← UPDATED: +users table (from Story 1.4 stub)
│   ├── index.ts                  ← unchanged (Story 1.4)
│   └── migrations/               ← unchanged (Story 1.4)
├── plugins/
│   └── db.plugin.ts              ← unchanged (Story 1.4)
└── routes/
    ├── health.route.ts           ← unchanged (Story 1.2)
    └── guest.route.ts            ← NEW: POST /guest

backend/test/
├── health.test.ts                ← unchanged (Story 1.2)
└── guest.route.test.ts           ← NEW: 3 integration tests
```

### Scope Boundary

| Concern                                 | This story | Later story |
| --------------------------------------- | ---------- | ----------- |
| `users` table schema                    | ✅         | —           |
| `POST /guest` endpoint                  | ✅         | —           |
| Swagger docs for /guest                 | ✅         | —           |
| Rate limit on /guest                    | ✅         | —           |
| `validateUserIdHook`                    | ❌         | Story 2.2   |
| `X-User-Id` enforcement on other routes | ❌         | Story 2.2   |
| `todos` table schema                    | ❌         | Story 3.1   |
| Client-side identity initialization     | ❌         | Story 2.3   |

### References

- `POST /guest` endpoint spec: [architecture.md](../planning-artifacts/architecture.md) — API Endpoints table
- `users` table Drizzle schema: [architecture.md](../planning-artifacts/architecture.md) — Database Schema (Drizzle)
- Identity flow overview: [architecture.md](../planning-artifacts/architecture.md) — Identity flow paragraph
- Rate limiting: [architecture.md](../planning-artifacts/architecture.md) — Backend security posture
- `X-User-Id` header casing: [architecture.md](../planning-artifacts/architecture.md) — Naming Patterns / API Naming Conventions
- Story scope: [epics.md](../planning-artifacts/epics.md) — Story 2.1: Guest Identity Endpoint

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

- **Import extensions:** story Dev Notes used `.js` extensions; backend codebase uses `.ts` with `--experimental-strip-types`. Fixed: `guest.route.ts` imports use `.ts`.
- **db/index.ts refactor:** Story Dev Notes showed `postgres(process.env.DATABASE_URL!)` at module top-level. This caused 500 errors in tests because ES module static imports are hoisted before `before()` sets env vars. Refactored to `createDb(url)` factory called inside `dbPlugin` body — connection now created after `@fastify/env` runs, fixing the ordering issue.
- **drizzle-kit push:** Ran `db:push` with temp postgres:17 Docker container to verify schema applies cleanly and integration tests pass against a live DB.

### Completion Notes List

- All 4 tasks complete; 7/7 backend tests pass (includes guest route integration tests against live postgres)
- `users` table added to `schema.ts` with exact columns: `id` (uuid PK), `type` (text default `'guest'`), `created_at` (timestamp defaultNow)
- `POST /guest` returns `201 { userId }` with per-route rate limit `max: 10/min`
- `randomUUID()` from `node:crypto` — no external uuid package
- Tests require live PostgreSQL (Docker Compose from Story 1.5, or local postgres)

### File List

- `backend/src/db/schema.ts` — UPDATED: +users table
- `backend/src/db/index.ts` — UPDATED: refactored to `createDb(url)` factory
- `backend/src/plugins/db.plugin.ts` — UPDATED: calls `createDb(DATABASE_URL)` inside plugin body
- `backend/src/routes/guest.route.ts` — NEW: POST /guest route
- `backend/src/app.ts` — UPDATED: +guestRoute registration
- `backend/test/guest.route.test.ts` — NEW: 3 integration tests
