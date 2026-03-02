// backend/test/db.plugin.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "../src/app.ts";

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
