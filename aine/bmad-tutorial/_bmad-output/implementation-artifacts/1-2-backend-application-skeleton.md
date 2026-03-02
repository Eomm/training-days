# Story 1.2: Backend Application Skeleton

Status: done

## Story

As a **developer**,
I want a running Fastify backend with health check, Swagger docs, and all security plugins registered,
so that the backend is ready to receive routes and is observable from day one.

## Acceptance Criteria

1. **Given** the backend dependencies are installed, **When** I start the backend with `node --experimental-strip-types src/server.ts`, **Then** the server starts without errors and logs the listening port.
2. `GET /health` returns `200 OK` with body `{ "status": "ok" }`.
3. `GET /documentation` serves the Swagger UI.
4. `app.ts` exports a factory function that creates and configures the Fastify instance **without calling `listen()`**.
5. `server.ts` is the sole entrypoint that calls `app()` then `listen()`.
6. `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui` are all registered.
7. A `.env.example` documents all required environment variables.
8. Running `node --test` executes backend tests with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Install missing backend dependencies (AC: 6)
  - [x] `npm install @fastify/swagger @fastify/swagger-ui @fastify/env fastify-plugin --workspace=backend`
  - [x] Verify `backend/package.json` lists all required packages: `fastify@5`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui`, `@fastify/env`, `fastify-plugin`
  - [x] `fastify-plugin` is installed now but only used starting Story 1.4 (DB plugin). Import it in `app.ts` at that point, not here.

- [x] Task 2 — Create `backend/src/app.ts` factory (AC: 4, 6)
  - [x] Export an async `build(opts?)` function that creates a Fastify instance and returns it — **never calls `listen()`**
  - [x] Register all plugins in order: helmet → cors → rate-limit → swagger → swagger-ui → routes
  - [x] Register `GET /health` route (inline or via `health.route.ts`)
  - [x] Log level: read from env (`LOG_LEVEL`) or default to `'info'`; accept `logger` override via opts for test isolation

- [x] Task 3 — Create `backend/src/server.ts` entrypoint (AC: 1, 5)
  - [x] Call `build()` then `app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })`
  - [x] This is the **only** file that calls `listen()`
  - [x] No `--env-file` flag needed — `@fastify/env` loads and validates env inside `build()`

- [x] Task 4 — Create `backend/src/routes/health.route.ts` (AC: 2)
  - [x] `GET /health` → `200 OK` with `{ status: 'ok' }` — full JSON Schema on response
  - [x] Route is **unauthenticated** (no `preHandler` hook)
  - [x] Route is **exempt from rate limiting** (configure rate-limit to exclude `/health`)
  - [x] Register in `app.ts` via `fastify.register(healthRoute)`

- [x] Task 5 — Configure all security plugins (AC: 6)
  - [x] `@fastify/helmet` — register with defaults (includes CSP, HSTS, X-Frame-Options)
  - [x] `@fastify/cors` — `origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173'`
  - [x] `@fastify/rate-limit` — global default (e.g. 100 req/min); exclude `/health`
  - [x] `@fastify/swagger` — register **before** swagger-ui; openapi 3 spec with `title: 'MotivaTodo API'`, `version: '1.0.0'`
  - [x] `@fastify/swagger-ui` — `routePrefix: '/documentation'`

- [x] Task 6 — Update `backend/package.json` scripts (AC: 1, 8)
  - [x] `"dev": "node --experimental-strip-types --watch src/server.ts"`
  - [x] `"start": "node dist/server.js"` (production — compiled output)
  - [x] `"build": "tsc"`
  - [x] `"test": "node --experimental-strip-types --test test/**/*.test.ts"`

- [x] Task 7 — Write tests (AC: 3, 8)
  - [x] Create `backend/test/health.test.ts`
  - [x] Test 1: `GET /health` → 200 with `{ status: 'ok' }`
  - [x] Test 2: `GET /documentation` → 200 (Swagger UI is reachable — AC: 3)
  - [x] Test 3: `GET /nonexistent` → error body has shape `{ statusCode, error, message }` (validates error handler)
  - [x] Use `app.inject()` — do **not** call `listen()` in test
  - [x] Call `app.close()` in cleanup (`t.after(() => app.close())`)

- [x] Task 8 — Update `.env.example` (AC: 7)
  - [x] Ensure `backend/.env.example` contains all variables: `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `LOG_LEVEL`

## Dev Notes

### CRITICAL: `app.ts` Factory Pattern

```typescript
// backend/src/app.ts
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyEnv from "@fastify/env";
import { healthRoute } from "./routes/health.route.js";

const envSchema = {
  type: "object",
  required: ["DATABASE_URL", "PORT", "CORS_ORIGIN"],
  properties: {
    DATABASE_URL: { type: "string" },
    PORT: { type: "string", default: "3000" },
    CORS_ORIGIN: { type: "string", default: "http://localhost:5173" },
    LOG_LEVEL: { type: "string", default: "info" },
  },
};

export async function build(
  opts: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger ?? { level: process.env.LOG_LEVEL ?? "info" },
    ...opts,
  });

  // Env validation — register first so all subsequent plugins can read process.env safely
  await app.register(fastifyEnv, { schema: envSchema, dotenv: true });

  // Global error handler — MUST match { statusCode, error, message } contract (all stories depend on this)
  app.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      statusCode,
      error: error.name ?? "Internal Server Error",
      message: error.message ?? "An unexpected error occurred",
    });
  });

  // Security plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    skipOnError: true,
    allowList: ["/health"],
  });

  // API documentation — swagger before swagger-ui
  await app.register(swagger, {
    openapi: {
      info: { title: "MotivaTodo API", version: "1.0.0" },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/documentation" });

  // Routes
  await app.register(healthRoute);

  return app;
}
```

> **`@fastify/env` with `dotenv: true`** reads `.env` from the current working directory, validates all required fields against the schema, and throws a descriptive error on startup if any required variable is missing. No `--env-file` CLI flag and no `dotenv` package needed. Tests that call `build({ logger: false })` must have required env vars set (use `process.env.DATABASE_URL = 'postgres://...'` in a test helper or provide a `.env` in the backend root).

> **NEVER** call `app.listen()` inside `app.ts`. Tests import `build()` and use `app.inject()`. `listen()` only lives in `server.ts`.

### `server.ts` — The Only Entrypoint That Calls `listen()`

```typescript
// backend/src/server.ts
import { build } from "./app.js";

const app = await build();

try {
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
```

> Run as: `node --experimental-strip-types src/server.ts` (dev) or `node dist/server.js` (prod after `tsc`).
> Env is loaded by `@fastify/env` inside `build()` — no CLI flags or `dotenv` imports needed.

### Health Route

```typescript
// backend/src/routes/health.route.ts
import type { FastifyInstance } from "fastify";

export async function healthRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: { status: { type: "string" } },
            required: ["status"],
          },
        },
      },
    },
    async () => {
      return { status: "ok" };
    },
  );
}
```

### Health Route Test

```typescript
// backend/test/health.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "../src/app.js";

test('GET /health returns 200 with { status: "ok" }', async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());

  const res = await app.inject({ method: "GET", url: "/health" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { status: "ok" });
});

test("GET /documentation returns 200 (Swagger UI reachable)", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());

  const res = await app.inject({ method: "GET", url: "/documentation" });
  assert.equal(res.statusCode, 200);
});

test("unknown route error response matches { statusCode, error, message } shape", async (t) => {
  const app = await build({ logger: false });
  t.after(() => app.close());

  const res = await app.inject({ method: "GET", url: "/nonexistent" });
  assert.equal(res.statusCode, 404);
  const body = res.json();
  assert.ok("statusCode" in body);
  assert.ok("error" in body);
  assert.ok("message" in body);
});
```

### CRITICAL: Import Extensions with `--experimental-strip-types`

With `NodeNext` module resolution and `--experimental-strip-types`, **all local imports must use `.js` extension** even when the source file is `.ts`:

```typescript
// ✅ Correct
import { healthRoute } from "./routes/health.route.js";
import { build } from "../app.js";

// ❌ Wrong — will throw ERR_MODULE_NOT_FOUND at runtime
import { healthRoute } from "./routes/health.route";
import { build } from "../app";
```

This is a Node ESM + TypeScript strip-types convention — the `.js` extension resolves to the `.ts` source file at dev time and to the `.js` compiled file at prod time.

### Plugin Registration Order (REQUIRED)

The order matters — helmet and cors must come before route registration:

1. `@fastify/helmet` — sets security headers on all responses
2. `@fastify/cors` — must be before routes to apply CORS on all responses
3. `@fastify/rate-limit` — global rate limiting applied before routes handle requests
4. `@fastify/swagger` — must register before `@fastify/swagger-ui` and before routes (decorates schemas)
5. `@fastify/swagger-ui` — must be after swagger
6. Routes — registered last

### `backend/package.json` scripts

```json
{
  "type": "module",
  "scripts": {
    "dev": "node --experimental-strip-types --watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc",
    "test": "node --experimental-strip-types --test test/**/*.test.ts"
  }
}
```

> `"type": "module"` is required for ESM imports with `NodeNext` module resolution.
> All test files live under `backend/test/` — **not** co-located with source. The `--test` glob `test/**/*.test.ts` is expanded by the shell on Linux/macOS (CI). On Windows, wrap in quotes.

### `.env.example`

```
DATABASE_URL=postgres://motivatodo:motivatodo@localhost:5432/motivatodo
PORT=3000
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Files Created / Modified by This Story

```
backend/
├── package.json                ← add scripts, @fastify/env, fastify-plugin, @fastify/swagger, @fastify/swagger-ui
├── .env.example                ← add LOG_LEVEL
├── src/
│   ├── app.ts                  ← NEW: Fastify factory (build function, includes @fastify/env)
│   ├── server.ts               ← REPLACE stub: entrypoint calling build() + listen()
│   └── routes/
│       └── health.route.ts     ← NEW: GET /health handler
└── test/
    └── health.test.ts          ← NEW: tests for health, swagger-ui, error shape
```

> **Not created in this story:** `plugins/` directory and its files (db.plugin.ts, auth.plugin.ts, etc.) — those are created in Stories 1.4 (DB) and 2.2 (auth hook). `data/quotes.json` is Story 3.3.
> **Test directory convention:** All backend tests live under `backend/test/` and import source via `../src/`. This applies to all future stories — no co-located test files in `src/`.

### Scope Boundary

| Concern                           | This story | Later story   |
| --------------------------------- | ---------- | ------------- |
| `GET /health`                     | ✅         | —             |
| Swagger docs at `/documentation`  | ✅         | —             |
| All 5 security plugins registered | ✅         | —             |
| DB connection plugin              | ❌         | Story 1.4     |
| `validateUserIdHook`              | ❌         | Story 2.2     |
| `POST /guest` route               | ❌         | Story 2.1     |
| Todos CRUD routes                 | ❌         | Story 3.1–3.4 |

### Architecture Compliance Checklist

- [ ] `app.ts` never calls `listen()` — only exports `build()`
- [ ] `server.ts` is the sole file calling `listen()`
- [ ] `setErrorHandler` registered in `app.ts` — responses have shape `{ statusCode, error, message }`
- [ ] `GET /health` returns exactly `{ "status": "ok" }` (no extra fields)
- [ ] Swagger UI is at `/documentation` (exact path)
- [ ] All imports use `.js` extension (ESM + NodeNext)
- [ ] `"type": "module"` in `backend/package.json`
- [ ] Test uses `app.inject()` — no real HTTP port bound during tests
- [ ] `t.after(() => app.close())` in every test to prevent resource leaks
- [ ] `/health` is exempt from rate limiting

### References

- `app.ts` factory mandate: [architecture.md](../planning-artifacts/architecture.md#structure-patterns) — _"`app.ts` factory function — never call `listen()` inside `app.ts`; use `server.ts` entrypoint"_
- Plugin list: [architecture.md](../planning-artifacts/architecture.md#backend--fastify-5--typescript--drizzle-orm) — `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui`
- Health endpoint spec: [architecture.md](../planning-artifacts/architecture.md#rest-api-surface) — `GET /health → { status: "ok" }`, Docker Compose healthcheck
- Backend code organization: [architecture.md](../planning-artifacts/architecture.md#structure-patterns) — `routes/`, `plugins/`, `app.ts`, `server.ts`
- Test strategy: [architecture.md](../planning-artifacts/architecture.md#backend-architecture) — Node built-in `--test`; test files under `backend/test/` (overrides architecture's co-location default — confirmed by user)
- Story scope: [epics.md](../planning-artifacts/epics.md#story-12-backend-application-skeleton)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

- **Node 22.19 `.js` → `.ts` remapping not supported**: Despite Node.js 22.12+ documentation stating that `--experimental-strip-types` remaps `.js` imports to `.ts` files, Node 22.19.0 on this machine does NOT perform this remapping. Investigation confirmed it fails even in a minimal isolated case.
- **Fix applied**: Switched all relative imports in backend source and test files to use `.ts` extension directly (e.g. `import { build } from './app.ts'`). Added `allowImportingTsExtensions: true` and `rewriteRelativeImportExtensions: true` to `backend/tsconfig.json`. TypeScript 5.7+ `rewriteRelativeImportExtensions` rewrites `.ts` → `.js` in compiled output, so production `dist/` is correct.
- **FastifyInstance/FastifyServerOptions named import error**: `fastify` is a CJS module. `FastifyInstance` and `FastifyServerOptions` are types — must use `import type { ... } from 'fastify'` to avoid the "Named export not found in CJS module" runtime error. Changed to `import Fastify from 'fastify'` + `import type { FastifyInstance, FastifyServerOptions, FastifyError } from 'fastify'`.
- **Error handler strict TypeScript**: With `strict: true`, the `error` parameter in `setErrorHandler` is typed. Resolved by typing it explicitly as `FastifyError`.

### Completion Notes List

- All 8 tasks completed.
- 3 tests pass: health endpoint, Swagger UI, error shape.
- TypeScript `tsc --noEmit` exits clean.
- `@fastify/env` with `dotenv: true` reads `.env` from CWD; tests set env vars in a `before()` hook, relying on the existing `.env` file created from `.env.example`.
- Import extension deviation from story dev notes: uses `.ts` extension instead of `.js` due to Node 22.19 runtime limitation. Functionally equivalent.

### File List

- `backend/package.json` (updated scripts, added @fastify/swagger, @fastify/swagger-ui, fastify-plugin)
- `backend/.env.example` (added LOG_LEVEL)
- `backend/tsconfig.json` (added allowImportingTsExtensions, rewriteRelativeImportExtensions)
- `backend/src/app.ts` (NEW)
- `backend/src/server.ts` (replaced stub)
- `backend/src/routes/health.route.ts` (NEW)
- `backend/test/health.test.ts` (NEW)
