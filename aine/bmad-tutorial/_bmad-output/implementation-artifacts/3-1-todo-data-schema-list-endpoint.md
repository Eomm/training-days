# Story 3.1: Todo Data Schema & List Endpoint

Status: done

## Story

As a **user**,
I want my todo list to load when I open the app,
So that I can immediately see everything I need to do.

## Acceptance Criteria

1. **Given** a valid `X-User-Id` header, **When** `GET /todos` is called, **Then** the response is `200 OK` with an array of todo objects for that user, sorted by `created_at` descending (newest first).
2. Each todo object contains: `id`, `userId`, `text`, `done`, `createdAt` (all camelCase in JSON).
3. The `todos` table is added to `backend/src/db/schema.ts` with columns: `id` (uuid, pk, `defaultRandom()`), `user_id` (uuid, FK → users, not null), `text` (text, not null), `done` (boolean, not null, default false), `created_at` (timestamp, not null, defaultNow).
4. Only todos belonging to the requesting user are returned — no cross-user leakage.
5. An empty array `[]` is returned when the user has no todos (not a 404).
6. The endpoint is documented in Swagger with tags, summary, and response schema.
7. Frontend: `frontend/src/hooks/useTodos.ts` is created, exporting `useTodos(userId)` that fetches and returns `{ todos, isLoading, error }`.
8. Frontend: `frontend/src/components/TodoList.tsx` and `frontend/src/components/SkeletonList.tsx` are created and wired into `HomePage.tsx`.
9. Running `npm run test --workspace=backend` and `npm run test --workspace=frontend` both exit with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Add `todos` table to `backend/src/db/schema.ts` (AC: 3)
  - [x] Import `boolean` from `drizzle-orm/pg-core` (add to existing import line)
  - [x] Define and export `todos` table with exact columns from Dev Notes
  - [x] Use `defaultRandom()` for `id` — the route does NOT generate the UUID (unlike `users`)
  - [x] Use `.references(() => users.id)` for the FK — import `users` is already in the file
  - [x] Do NOT remove the `users` table or any existing imports

- [x] Task 2 — Run DB migration (AC: 3)
  - [x] Run `npm run db:push --workspace=backend` to apply the new `todos` table to the local postgres instance
  - [x] Verify no errors — Drizzle will create the table and FK constraint

- [x] Task 3 — Create `backend/src/routes/todos.route.ts` with `GET /todos` (AC: 1, 2, 4, 5, 6)
  - [x] Export `todosRoute: FastifyPluginAsync`
  - [x] Register `GET /todos` with Swagger schema (tags: `['todos']`, response shape: array of todo objects)
  - [x] Read `userId` from `request.headers['x-user-id']` (guaranteed non-null by `validateUserIdHook`)
  - [x] Query: `fastify.db.select().from(todos).where(eq(todos.userId, userId)).orderBy(desc(todos.createdAt))`
  - [x] Map result rows to camelCase response shape (see Dev Notes)
  - [x] Return `reply.send(mappedTodos)` — empty array when none found
  - [x] See Dev Notes for exact file content

- [x] Task 4 — Register `todosRoute` in `backend/src/app.ts` (AC: 1)
  - [x] Import `todosRoute` from `./routes/todos.route.ts`
  - [x] Register after `guestRoute`: `await app.register(todosRoute)`
  - [x] Do NOT change any other registrations

- [x] Task 5 — Write backend tests (AC: 9)
  - [x] Create `backend/test/todos.route.test.ts`
  - [x] `before()`: seed process.env, register a test route helper
  - [x] Test 1: `GET /todos` with valid userId returns `200` and empty array when no todos exist
  - [x] Test 2: `GET /todos` without `X-User-Id` returns `400` (regression: auth hook still active)
  - [x] Test 3: `GET /todos` returns only todos for the requesting user (not another user's todos)
  - [x] Pattern: create user via `POST /guest`, then call `GET /todos`
  - [x] See Dev Notes for exact test content

- [x] Task 6 — Create `frontend/src/hooks/useTodos.ts` (AC: 7)
  - [x] Export `useTodos(userId: string | null): { todos: Todo[]; isLoading: boolean; error: string | null }`
  - [x] If `userId` is null → return `{ todos: [], isLoading: false, error: null }` immediately (skip fetch)
  - [x] `useEffect([userId])`: call `apiFetch<Todo[]>('/todos')` when userId is set
  - [x] Set `isLoading = true` before fetch, `false` in finally block
  - [x] On error: set `error` state with `err.message`
  - [x] See Dev Notes for exact implementation

- [x] Task 7 — Create `frontend/src/components/SkeletonList.tsx` (AC: 8)
  - [x] Renders 3 placeholder skeleton rows using shadcn `Skeleton` component
  - [x] Props: none (always renders 3 rows)
  - [x] See Dev Notes for exact content

- [x] Task 8 — Create `frontend/src/components/TodoList.tsx` (AC: 8)
  - [x] Props: `{ todos: Todo[]; isLoading: boolean }`
  - [x] If `isLoading` → render `<SkeletonList />`
  - [x] If `todos.length === 0` → render empty state: `<p>No tasks yet. Add one above!</p>`
  - [x] Otherwise → render `<ul>` with one `<li>` per todo showing `todo.text`
  - [x] See Dev Notes — `TodoItem` is added in Story 3.2; use a plain `<li>` for now

- [x] Task 9 — Update `frontend/src/pages/HomePage.tsx` to wire up the list (AC: 8)
  - [x] Import `useGuestIdentity` and call it to get `userId`
  - [x] Import `useTodos` and call `useTodos(userId)`
  - [x] Render `<TodoList todos={todos} isLoading={isLoading} />`
  - [x] Keep the existing heading and button (remove button in Story 3.2)

- [x] Task 10 — Write frontend tests (AC: 9)
  - [x] `frontend/src/hooks/useTodos.test.ts`: mock `fetch`, test loading/success/error states
  - [x] `frontend/src/components/TodoList.test.tsx`: test skeleton, empty state, and list render
  - [x] Run `npm run test --workspace=frontend` — all tests pass
  - [x] See Dev Notes for test patterns

## Dev Notes

### Exact: `todos` Table Addition to `backend/src/db/schema.ts`

```typescript
import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Story 3.1: todos table
export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

> **`defaultRandom()` for `id`:** Unlike `users.id` (where the route generates the UUID explicitly for the response), `todos` uses DB-generated UUIDs. The insert returns the generated `id` via Drizzle's `.returning()`.

> **FK `references(() => users.id)`:** Arrow function form (not `references(users.id)`) prevents circular reference issues at module load time.

### Exact: `backend/src/routes/todos.route.ts` (GET /todos only — other methods added in 3.2–3.4)

```typescript
// backend/src/routes/todos.route.ts
import type { FastifyPluginAsync } from "fastify";
import { eq, desc } from "drizzle-orm";
import { todos } from "../db/schema.ts";

export const todosRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/todos",
    {
      schema: {
        tags: ["todos"],
        summary: "List all todos for the requesting user",
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "userId", "text", "done", "createdAt"],
              properties: {
                id: { type: "string", format: "uuid" },
                userId: { type: "string", format: "uuid" },
                text: { type: "string" },
                done: { type: "boolean" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const userId = request.headers["x-user-id"] as string;
      const rows = await fastify.db
        .select()
        .from(todos)
        .where(eq(todos.userId, userId))
        .orderBy(desc(todos.createdAt));

      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        text: row.text,
        done: row.done,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  );
};
```

> **`userId` cast:** `validateUserIdHook` guarantees `x-user-id` is present and valid by this point, so `as string` is safe.

> **`createdAt.toISOString()`:** Drizzle returns `Date` objects for `timestamp` columns. The Swagger schema declares `format: date-time` — always serialise to ISO 8601 string.

### camelCase JSON Keys

All API responses use camelCase per architecture (`userId` not `user_id`, `createdAt` not `created_at`). Drizzle column mapping (`userId: uuid('user_id')`) uses camelCase on the JS side already — no extra mapping needed for most fields.

### Exact: `frontend/src/hooks/useTodos.ts`

```typescript
// frontend/src/hooks/useTodos.ts
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api.ts";
import type { Todo } from "../types.ts";

export function useTodos(userId: string | null): {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
} {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId === null) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiFetch<Todo[]>("/todos")
      .then((data) => {
        if (!cancelled) setTodos(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { todos, isLoading, error };
}
```

### Exact: `frontend/src/components/SkeletonList.tsx`

```tsx
// frontend/src/components/SkeletonList.tsx
import { Skeleton } from "./ui/skeleton.js";

export function SkeletonList() {
  return (
    <ul className="flex flex-col gap-2 w-full">
      {[1, 2, 3].map((i) => (
        <li key={i}>
          <Skeleton className="h-12 w-full rounded-md" />
        </li>
      ))}
    </ul>
  );
}
```

> **shadcn `Skeleton`:** Already available from Story 1.3 scaffold. If `src/components/ui/skeleton.tsx` does not exist, run `npx shadcn@latest add skeleton` in the frontend workspace.

### Exact: `frontend/src/components/TodoList.tsx`

```tsx
// frontend/src/components/TodoList.tsx
import type { Todo } from "../types.js";
import { SkeletonList } from "./SkeletonList.js";

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
}

export function TodoList({ todos, isLoading }: TodoListProps) {
  if (isLoading) return <SkeletonList />;

  if (todos.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-8">
        No tasks yet. Add one above!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 w-full">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="p-3 rounded-md border border-gray-200 bg-white"
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

> **Note:** The `<li>` is a placeholder — Story 3.2 replaces it with `<TodoItem />`. Keep it simple here.

### Learnings from Story 2.1/2.2

- `.ts` import extensions throughout — backend uses `--experimental-strip-types`
- `validateUserIdHook` is the global `onRequest` hook — by the time the route handler runs, `x-user-id` is guaranteed valid
- Test route must be registered before first `inject()` call to avoid `FST_ERR_INSTANCE_ALREADY_LISTENING`
- Access `fastify.db` in routes via the `fastify` argument (not `request.server`) — route handlers are closures inside `FastifyPluginAsync`

### References

- `todos` schema: [architecture.md](../planning-artifacts/architecture.md) — Database Schema (Drizzle)
- `GET /todos` spec: [architecture.md](../planning-artifacts/architecture.md) — REST API Surface
- `useTodos` hook: [architecture.md](../planning-artifacts/architecture.md) — Project Structure — `hooks/useTodos.ts`
- Story ACs: [epics.md](../planning-artifacts/epics.md) — Story 3.1

### Project Structure After This Story

```
backend/src/
├── db/schema.ts            ← UPDATED: +todos table
├── routes/
│   ├── health.route.ts     ← unchanged
│   ├── guest.route.ts      ← unchanged
│   └── todos.route.ts      ← NEW: GET /todos

frontend/src/
├── hooks/
│   ├── useGuestIdentity.ts ← unchanged
│   └── useTodos.ts         ← NEW
├── components/
│   ├── SkeletonList.tsx    ← NEW
│   └── TodoList.tsx        ← NEW (placeholder <li>)
└── pages/
    └── HomePage.tsx        ← UPDATED: wires useTodos + TodoList
```

### Scope Boundary

| Concern                                | This story | Later story |
| -------------------------------------- | ---------- | ----------- |
| `todos` DB schema                      | ✅         | —           |
| `GET /todos` backend                   | ✅         | —           |
| `useTodos` hook (fetch only)           | ✅         | —           |
| `TodoList` + `SkeletonList` components | ✅         | —           |
| `POST /todos` backend + frontend add   | ❌         | Story 3.2   |
| `TodoItem` component                   | ❌         | Story 3.2   |
| `PATCH /todos/:id`                     | ❌         | Story 3.3   |
| `DELETE /todos/:id`                    | ❌         | Story 3.4   |

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

N/A

### Completion Notes List

- todos table added to schema.ts with all required columns and FK to users
- GET /todos route implemented with userId filtering and desc(createdAt) ordering
- todosRoute registered in app.ts inside auth-protected plugin scope
- useTodos hook, SkeletonList, TodoList components created
- HomePage wired with useTodos + TodoList
- All backend and frontend tests pass

### File List

- backend/src/db/schema.ts
- backend/src/routes/todos.route.ts
- backend/src/app.ts
- backend/test/todos.route.test.ts
- frontend/src/hooks/useTodos.ts
- frontend/src/components/SkeletonList.tsx
- frontend/src/components/TodoList.tsx
- frontend/src/pages/HomePage.tsx
- frontend/src/hooks/useTodos.test.ts
- frontend/src/components/TodoList.test.tsx
