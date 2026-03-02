# Backend Conventions

Project-specific backend conventions established during MVP (Phase 1) development.

## TypeScript Import Extensions

**Convention:** Use `.ts` extensions in all backend imports.

Node 22.19 with `--experimental-strip-types` does **not** correctly remap `.js` imports to `.ts` files at runtime, despite documentation suggesting otherwise. The project uses `.ts` extensions directly with two `tsconfig.json` flags:

```jsonc
{
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
  },
}
```

- `allowImportingTsExtensions` — lets TypeScript accept `.ts` in import specifiers
- `rewriteRelativeImportExtensions` — rewrites `.ts` → `.js` in compiled output (TypeScript 5.7+)

```typescript
// ✅ Correct
import { guestRoute } from "./routes/guest.route.ts";

// ❌ Wrong — will fail at runtime under Node 22.19 strip-types
import { guestRoute } from "./routes/guest.route.js";
```

**Why:** Node 22.19's `--experimental-strip-types` strips TypeScript syntax but does not perform module resolution remapping. The `.ts` extension matches the actual file on disk, which is what Node resolves at runtime.

## `app.ts` Factory Pattern

**Convention:** `app.ts` exports a `build()` factory function. It never calls `listen()`.

```typescript
// backend/src/app.ts
export async function build(
  opts?: FastifyServerOptions,
): Promise<FastifyInstance> {
  const app = Fastify(opts);
  // ... register plugins, routes ...
  return app;
}
```

```typescript
// backend/src/server.ts — sole entrypoint that calls listen()
import { build } from "./app.ts";

const app = await build();
await app.listen({ port: Number(app.config.PORT), host: "0.0.0.0" });
```

**Why:** Tests call `build()` directly and use `app.inject()` to send requests without binding a port. This avoids port conflicts, speeds up tests, and keeps the Fastify instance disposable.

## Fastify Test Ordering

**Convention:** Register all routes before the first `app.inject()` call.

```typescript
// ✅ Correct — register test route, then inject
test("protected route works", async (t) => {
  const app = await build({ logger: false });
  app.get("/test-protected", async () => ({ ok: true })); // register first
  t.after(() => app.close());

  const res = await app.inject({
    method: "GET",
    url: "/test-protected",
    headers: { "x-user-id": userId },
  });
  assert.equal(res.statusCode, 200);
});

// ❌ Wrong — inject() seals the instance, route registration throws FST_ERR_INSTANCE_ALREADY_LISTENING
```

**Why:** The first `app.inject()` call triggers Fastify's internal `ready()`, which seals the instance. Any attempt to register routes after that throws `FST_ERR_INSTANCE_ALREADY_LISTENING`.

## Static JSON Loading with `createRequire`

**Convention:** Use `createRequire` to load static JSON files in ESM backend code.

```typescript
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const quotes: string[] = require("../data/quotes.json");
```

**Why:**

- `import ... with { type: 'json' }` is deprecated in Node 22
- `fs.readFileSync` + `JSON.parse` is noisier and requires path resolution
- `createRequire` loads once at module level, is synchronous, and works reliably across Node versions

## Ownership Check Pattern

**Convention:** All protected CRUD endpoints follow the fetch → 404 → 403 → proceed pattern.

```typescript
// 1. Fetch the resource
const [existing] = await fastify.db
  .select()
  .from(todos)
  .where(eq(todos.id, id));

// 2. Not found?
if (!existing) {
  return reply.status(404).send({
    statusCode: 404,
    error: "Not Found",
    message: "Todo not found",
  });
}

// 3. Wrong user?
if (existing.userId !== userId) {
  return reply.status(403).send({
    statusCode: 403,
    error: "Forbidden",
    message: "Not authorized",
  });
}

// 4. Proceed with operation
```

**Why:** Consistent error handling across all endpoints (`PATCH /todos/:id`, `DELETE /todos/:id`). The order matters — 404 before 403 prevents information leakage about resource existence to unauthorized users.

## Docker Healthcheck Convention

**Convention:** Use `127.0.0.1` instead of `localhost` in Docker healthcheck commands.

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:3000/health"]
```

**Why:** Alpine Linux's `wget` resolves `localhost` to IPv6 (`::1`) first. Fastify binds IPv4 only by default. Using `127.0.0.1` bypasses DNS resolution and connects directly over IPv4.
