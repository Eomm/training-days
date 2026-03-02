# Story 2.2: User Identity Hook & Header Enforcement

Status: done

## Story

As a **developer**,
I want all protected API routes to enforce the presence of the `X-User-Id` header,
So that every request is associated with a known user and cross-user data leakage is prevented.

## Acceptance Criteria

1. **Given** a request to any route other than `POST /guest` and `GET /health`, **When** the `X-User-Id` header is missing or empty, **Then** the response is `400 Bad Request` with body `{ "statusCode": 400, "error": "Bad Request", "message": "Missing X-User-Id header" }`.
2. **Given** a request with a valid `X-User-Id` header where the userId exists in the `users` table, **When** the route is processed, **Then** the request proceeds normally (no 400/403 returned).
3. **Given** a request with a valid `X-User-Id` header where the userId does NOT exist in the `users` table, **When** the route is processed, **Then** the response is `403 Forbidden`.
4. `validateUserIdHook` is implemented as a Fastify `onRequest` hook function exported from `backend/src/plugins/auth.plugin.ts`.
5. `POST /guest` and `GET /health` are explicitly exempt — the hook is NOT applied to those routes.
6. The hook is registered in `app.ts` as a global `onRequest` hook, skipping exempt routes by checking `request.routeOptions.url`.
7. Running `npm run test --workspace=backend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Create `backend/src/plugins/auth.plugin.ts` (AC: 1, 2, 3, 4)
  - [x] Import `FastifyRequest`, `FastifyReply` from `fastify`
  - [x] Import `users` table from `../db/schema.ts`
  - [x] Import `eq` from `drizzle-orm`
  - [x] Export `validateUserIdHook: (request: FastifyRequest, reply: FastifyReply) => Promise<void>`
  - [x] Read `request.headers['x-user-id']` — lowercase: Fastify normalises all header names to lowercase
  - [x] If value is falsy or empty string → `reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Missing X-User-Id header' })` and return
  - [x] Query `fastify.db.select().from(users).where(eq(users.id, userId)).limit(1)`
  - [x] If result is empty → `reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Unknown user' })` and return
  - [x] See Dev Notes for exact file content

- [x] Task 2 — Register `validateUserIdHook` globally in `backend/src/app.ts` (AC: 5, 6)
  - [x] Import `validateUserIdHook` from `./plugins/auth.plugin.ts`
  - [x] After route registrations, add: `app.addHook('onRequest', validateUserIdHook)` — register AFTER routes so `request.routeOptions` is populated
  - [x] Inside the hook skip logic: if `request.routeOptions.url === '/guest'` and `request.method === 'POST'` → skip
  - [x] Inside the hook skip logic: if `request.routeOptions.url === '/health'` → skip
  - [x] Do NOT modify any existing registration order — only add the hook call after routes
  - [x] See Dev Notes for exact registration approach

- [x] Task 3 — Write tests (AC: 7)
  - [x] Create `backend/test/auth.plugin.test.ts`
  - [x] Test 1: Existing exempt routes unaffected — `POST /guest` and `GET /health` work without `X-User-Id` header (regression guard)
  - [x] Test 2: A protected route without `X-User-Id` header returns 400
  - [x] Test 3: A protected route with a valid `X-User-Id` (known user) proceeds (returns non-400/403)
  - [x] Test 4: A protected route with an `X-User-Id` for a non-existent user returns 403
  - [x] Route registered BEFORE first inject() call to avoid Fastify sealed-instance error
  - [x] Run `npm run test --workspace=backend` — all 12 tests pass

## Dev Notes

### Critical: Header Normalisation in Fastify

Fastify lowercases all incoming HTTP header names. When the client sends `X-User-Id: abc`, `request.headers` contains `{ 'x-user-id': 'abc' }`. Always read as `request.headers['x-user-id']` (all lowercase). Never `request.headers['X-User-Id']`.

> **Source:** [architecture.md](../planning-artifacts/architecture.md) — Naming Patterns — "Use `X-User-Id` (exact casing) as the user identity header" refers to the wire format; in Fastify server code always access via lowercase key.

### Global Hook Registration Order

In Fastify, `request.routeOptions` is only populated after the route has been matched (which happens by the time `onRequest` fires). The hook MUST be registered **after** all routes are registered via `app.register()`:

```typescript
// CORRECT: register hook after routes
await app.register(healthRoute);
await app.register(guestRoute);
app.addHook("onRequest", validateUserIdHook);
```

If you register the hook before routes, `request.routeOptions.url` might be undefined for some edge cases.

### Implementing the Skip Logic

The hook must check exempt routes before doing any validation work:

```typescript
export async function validateUserIdHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Exempt routes — skip validation entirely
  const url = request.routeOptions.url;
  if (url === "/health" || (url === "/guest" && request.method === "POST")) {
    return;
  }

  const userId = request.headers["x-user-id"];
  if (!userId || (typeof userId === "string" && userId.trim() === "")) {
    return reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Missing X-User-Id header",
    });
  }

  const id = Array.isArray(userId) ? userId[0] : userId;
  const rows = await (request.server as FastifyInstance).db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (rows.length === 0) {
    return reply.status(403).send({
      statusCode: 403,
      error: "Forbidden",
      message: "Unknown user",
    });
  }
}
```

> **Note:** Use `request.server` (typed as `FastifyInstance`) to access `fastify.db` inside a standalone hook function — `this` context is not available with async arrow functions. Alternatively inject `fastify` via closure if the hook is created inside a plugin wrapper.

### Accessing `fastify.db` from a standalone hook

Since `validateUserIdHook` is a standalone exported function (not inside a `FastifyPluginAsync`), it cannot directly access `fastify.db` via closure. The cleanest approach: access it through `request.server`:

```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
// ...
const db = (request.server as FastifyInstance).db;
```

`request.server` is always the Fastify root instance, which has the `db` decorator from `db.plugin.ts`.

### Error Response Contract

All error responses from the backend must match the global error shape set in `app.ts`'s `setErrorHandler`:

```json
{ "statusCode": 400, "error": "Bad Request", "message": "Missing X-User-Id header" }
{ "statusCode": 403, "error": "Forbidden", "message": "Unknown user" }
```

Do NOT use `reply.send(new Error(...))` — that goes through the error handler and may vary in shape. Use `reply.status(N).send({ statusCode, error, message })` directly.

### Test Structure: Test Route Registration

Since there are no protected routes yet (only `/health` and `/guest`, both exempt), tests must dynamically register a test route. Fastify allows registering routes in `before()`:

```typescript
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

test("GET /health is exempt — no X-User-Id required", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());
  const res = await app.inject({ method: "GET", url: "/health" });
  assert.equal(res.statusCode, 200);
});

test("POST /guest is exempt — no X-User-Id required", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());
  const res = await app.inject({ method: "POST", url: "/guest" });
  assert.equal(res.statusCode, 201);
});

// For protected route tests: temporarily extend app inside the test with a /test-protected route
// Fastify is not fully sealed until listen() -- app.inject() works without listen() so
// you CAN add routes after build() as long as you do it before inject() calls
test("protected route without X-User-Id returns 400", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());
  app.get("/test-protected", async () => ({ ok: true }));
  const res = await app.inject({ method: "GET", url: "/test-protected" });
  assert.equal(res.statusCode, 400);
  const body = res.json<{
    statusCode: number;
    error: string;
    message: string;
  }>();
  assert.equal(body.statusCode, 400);
  assert.equal(body.message, "Missing X-User-Id header");
});

test("protected route with valid X-User-Id returns 200", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());
  // Create a user first via POST /guest
  const guestRes = await app.inject({ method: "POST", url: "/guest" });
  const { userId } = guestRes.json<{ userId: string }>();
  app.get("/test-protected", async () => ({ ok: true }));
  const res = await app.inject({
    method: "GET",
    url: "/test-protected",
    headers: { "x-user-id": userId },
  });
  assert.equal(res.statusCode, 200);
});

test("protected route with unknown X-User-Id returns 403", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());
  app.get("/test-protected", async () => ({ ok: true }));
  const res = await app.inject({
    method: "GET",
    url: "/test-protected",
    headers: { "x-user-id": "00000000-0000-4000-8000-000000000000" },
  });
  assert.equal(res.statusCode, 403);
});
```

### Learnings from Story 2.1

- **Import extensions:** Always use `.ts` extensions in imports (`../db/schema.ts`, not `.js`). The backend uses `--experimental-strip-types` so `.ts` imports work at runtime.
- **`db/index.ts` factory pattern:** `createDb(url)` is called inside `dbPlugin` body, NOT at module top-level. This matters because ES module static imports are hoisted. Any code at module top-level in a non-plugin context may execute before `@fastify/env` has set `process.env.DATABASE_URL`.
- **`request.server` vs closure:** For standalone hook functions not inside a plugin, access the Fastify instance via `request.server` rather than a closure.

### Architecture References

- Hook spec: [architecture.md](../planning-artifacts/architecture.md) — "Backend Auth Hook Pattern" (line ~436)
- File location: [architecture.md](../planning-artifacts/architecture.md) — Project Structure — `backend/src/plugins/auth.plugin.ts`
- Header: [architecture.md](../planning-artifacts/architecture.md) — Enforcement Guidelines — "`X-User-Id` exact casing"
- Identity flow: [architecture.md](../planning-artifacts/architecture.md) — "Identity flow" paragraph
- Apply to: [architecture.md](../planning-artifacts/architecture.md) — "Apply `validateUserIdHook` to every route except `POST /guest` and `GET /health`"

### Project Structure After This Story

```
backend/src/
├── app.ts                        ← UPDATED: global onRequest hook added after route registrations
├── plugins/
│   ├── db.plugin.ts              ← unchanged (Story 1.4)
│   └── auth.plugin.ts            ← NEW: validateUserIdHook export
└── routes/
    ├── health.route.ts           ← unchanged (Story 1.2)
    └── guest.route.ts            ← unchanged (Story 2.1)

backend/test/
├── health.test.ts                ← unchanged
├── guest.route.test.ts           ← unchanged
└── auth.plugin.test.ts           ← NEW: 5 tests for hook behaviour
```

### Scope Boundary

| Concern                                | This story | Later story                        |
| -------------------------------------- | ---------- | ---------------------------------- |
| `validateUserIdHook` implementation    | ✅         | —                                  |
| Global `onRequest` hook in `app.ts`    | ✅         | —                                  |
| 400 on missing header                  | ✅         | —                                  |
| 403 on unknown userId                  | ✅         | —                                  |
| Apply hook per-route on todo routes    | ❌         | Story 3.x (hook is already global) |
| Client-side `X-User-Id` header sending | ❌         | Story 2.3                          |
| `todos` table / todo routes            | ❌         | Story 3.1                          |

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- **`/documentation` exemption:** After adding the global hook, `GET /documentation` (Swagger UI) returned 400 — it was not in the exempt set. Added `EXEMPT_PREFIXES = ['/documentation']` with a `url.startsWith(prefix)` check to exempt all Swagger UI routes as developer tooling.
- **Test route registration order:** `app.get('/test-protected', ...)` must be called BEFORE the first `app.inject()` in a test — calling `inject()` seals the Fastify instance (`FST_ERR_INSTANCE_ALREADY_LISTENING`) and prevents further route additions. Fixed by registering the test route first, then injecting POST /guest to get a real userId.

### Completion Notes List

- All 3 tasks complete; 12/12 backend tests pass (5 new auth tests + 7 pre-existing)
- `validateUserIdHook` in `auth.plugin.ts`: reads `x-user-id` header (lowercased by Fastify), returns 400 if missing, queries DB and returns 403 if user not found
- `/health`, `POST /guest`, and `/documentation/*` exempt from the hook
- Hook registered via `app.addHook('onRequest', validateUserIdHook)` after route registrations in `app.ts` so `request.routeOptions.url` is always populated
- Access to `fastify.db` inside the standalone hook via `request.server as FastifyInstance`

### File List

- `backend/src/plugins/auth.plugin.ts` — NEW: `validateUserIdHook` with exempt route logic
- `backend/src/app.ts` — UPDATED: import + global `onRequest` hook registration
- `backend/test/auth.plugin.test.ts` — NEW: 5 integration tests
