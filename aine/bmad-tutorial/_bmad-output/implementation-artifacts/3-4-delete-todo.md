# Story 3.4: Delete Todo

Status: done

## Story

As a **user**,
I want to delete a todo item permanently,
So that I can remove tasks that are no longer relevant.

## Acceptance Criteria

1. **Given** a valid `X-User-Id` header, **When** `DELETE /todos/:id` is called, **Then** the todo is removed from the database and the response is `204 No Content` (empty body).
2. Deleting a todo that belongs to a different user returns `403 Forbidden`.
3. Deleting a non-existent todo returns `404 Not Found`.
4. The todo disappears from the UI **immediately** (optimistic update — removed before API confirms).
5. If the API call fails, the optimistic deletion is reverted and the item reappears.
6. A delete button on the `TodoItem` component triggers the deletion.
7. The endpoint is documented in Swagger.
8. Running `npm run test --workspace=backend` and `npm run test --workspace=frontend` both exit with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Add `DELETE /todos/:id` to `backend/src/routes/todos.route.ts` (AC: 1, 2, 3, 7)
  - [x] Add `DELETE /todos/:id` route handler to the existing `todosRoute` plugin
  - [x] Parse params: `id` (string/uuid)
  - [x] Read `userId` from `request.headers['x-user-id'] as string`
  - [x] Fetch existing todo; if not found → 404; if `todo.userId !== userId` → 403
  - [x] Delete: `fastify.db.delete(todos).where(eq(todos.id, id))`
  - [x] Return `reply.status(204).send()` — NO body (204 contract)
  - [x] See Dev Notes for exact handler

- [x] Task 2 — Write backend tests for DELETE /todos/:id (AC: 1, 2, 3, 8)
  - [x] Add to `backend/test/todos.route.test.ts`
  - [x] Test: `DELETE /todos/:id` own todo returns 204 with empty body
  - [x] Test: after delete, `GET /todos` no longer includes the deleted todo
  - [x] Test: delete non-existent todo returns 404
  - [x] Test: delete another user's todo returns 403
  - [x] Run full suite — all pass

- [x] Task 3 — Add `deleteTodo` to `frontend/src/hooks/useTodos.ts` (AC: 4, 5)
  - [x] Add `deleteTodo(id: string): Promise<void>` function
  - [x] Save snapshot of current `todos` for rollback
  - [x] Optimistically remove the todo from state immediately
  - [x] Call `apiFetch<void>('/todos/' + id, { method: 'DELETE' })`
  - [x] On success: nothing to update (already removed)
  - [x] On error: restore the snapshot + set `error` state
  - [x] Return `{ todos, isLoading, error, addTodo, markDone, deleteTodo, quote, clearQuote }` from hook
  - [x] See Dev Notes for exact implementation

- [x] Task 4 — Update `frontend/src/components/TodoItem.tsx` with delete button (AC: 6)
  - [x] Add prop `onDelete: (id: string) => void`
  - [x] Add a delete button (trash icon or "×") on the right side of the item
  - [x] On click: call `onDelete(todo.id)`
  - [x] Use `lucide-react` `Trash2` icon (already in dependencies)
  - [x] See Dev Notes for exact updated `TodoItem` content

- [x] Task 5 — Wire `deleteTodo` through `TodoList` and `HomePage.tsx` (AC: 4, 5, 6)
  - [x] Update `TodoList` props to accept `onDelete: (id: string) => void`
  - [x] Pass `onDelete` down to each `<TodoItem>`
  - [x] In `HomePage.tsx`: destructure `deleteTodo` from `useTodos` and pass as `onDelete` to `<TodoList>`

- [x] Task 6 — Write frontend tests (AC: 8)
  - [x] Update `frontend/src/components/TodoItem.test.tsx`: clicking delete button calls `onDelete` with correct id
  - [x] Update `useTodos.test.ts`: test `deleteTodo` optimistic removal and rollback on error
  - [x] Run `npm run test --workspace=frontend` — all pass

## Dev Notes

### DELETE /todos/:id Handler

```typescript
fastify.delete(
  "/todos/:id",
  {
    schema: {
      tags: ["todos"],
      summary: "Delete a todo",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        204: { type: "null", description: "Todo deleted" },
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.headers["x-user-id"] as string;

    const [existing] = await fastify.db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);

    if (!existing) {
      return reply.status(404).send({
        statusCode: 404,
        error: "Not Found",
        message: "Todo not found",
      });
    }
    if (existing.userId !== userId) {
      return reply.status(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: "Not your todo",
      });
    }

    await fastify.db.delete(todos).where(eq(todos.id, id));
    return reply.status(204).send();
  },
);
```

> **`204 No Content`:** The architecture spec mandates `204` with empty body for DELETE. Do NOT return the deleted item — this is an explicit design decision.

> **`response: { 204: { type: 'null' } }`:** Fastify Swagger requires a response schema for each status code. `type: 'null'` signals an empty body.

### `apiFetch` with 204 Response

`apiFetch` calls `response.json()` which will throw on an empty body (204). Fix in `api.ts`: check `response.status !== 204` before calling `.json()`:

```typescript
if (response.status === 204) return undefined as T;
return response.json() as Promise<T>;
```

> **This is the only change to `api.ts` in this story.** Make this update as part of Task 3.

### `deleteTodo` Optimistic Pattern

```typescript
async function deleteTodo(id: string): Promise<void> {
  const snapshot = todos; // save reference for rollback

  // Optimistic removal
  setTodos((prev) => prev.filter((t) => t.id !== id));

  try {
    await apiFetch<void>("/todos/" + id, { method: "DELETE" });
    // Success — already removed from UI, nothing more to do
  } catch (err) {
    // Rollback to snapshot
    setTodos(snapshot);
    setError(err instanceof Error ? err.message : "Failed to delete todo");
  }
}
```

### Updated `TodoItem.tsx` with Delete Button

```tsx
// frontend/src/components/TodoItem.tsx
import type { Todo } from "../types.js";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button.js";

interface TodoItemProps {
  todo: Todo;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onDone, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 p-3 rounded-md border border-gray-200 bg-white">
      <button
        type="button"
        aria-label="Mark as done"
        onClick={() => onDone(todo.id)}
        className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-green-400 transition-colors"
      />
      <span
        className={`flex-1 ${todo.done ? "line-through text-gray-400" : ""}`}
      >
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete todo"
        onClick={() => onDelete(todo.id)}
        className="text-gray-400 hover:text-red-500"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );
}
```

> **`lucide-react` is already in `frontend/package.json` dependencies** — no install needed.

### `apiFetch` 204 Handling is Critical

Without the 204 fix in `api.ts`, `DELETE` calls will throw a JSON parse error even on success. Always fix `api.ts` before testing the delete flow. The test for this story must cover the 204 path.

### Learnings from Story 3.1–3.3

- Route handlers in `todosRoute` plugin closure have direct access to `fastify.db` (not `request.server`) — cleaner pattern
- All CRUD ownership checks follow the same pattern: fetch → check userId === existing.userId → 403 if mismatch
- Drizzle `.delete()` does NOT return rows by default — do NOT call `.returning()` on delete unless you need the deleted item

### References

- `DELETE /todos/:id` spec: [architecture.md](../planning-artifacts/architecture.md) — REST API Surface
- 204 contract: [architecture.md](../planning-artifacts/architecture.md) — "Return `204` with empty body for DELETE operations"
- Optimistic update: [architecture.md](../planning-artifacts/architecture.md) — Communication Patterns
- Story ACs: [epics.md](../planning-artifacts/epics.md) — Story 3.4

### Project Structure After This Story (full Epic 3 view)

```
backend/src/
├── data/
│   └── quotes.json             ← NEW (3.3): 100+ motivational quotes
├── db/schema.ts                ← UPDATED (3.1): +todos table
├── routes/
│   ├── health.route.ts         ← unchanged
│   ├── guest.route.ts          ← unchanged
│   └── todos.route.ts          ← UPDATED across 3.1–3.4: full CRUD

frontend/src/
├── lib/
│   └── api.ts                  ← UPDATED (3.4): 204 no-body handling
├── hooks/
│   ├── useGuestIdentity.ts     ← unchanged
│   └── useTodos.ts             ← UPDATED across 3.1–3.4: full CRUD + quote state
├── components/
│   ├── SkeletonList.tsx        ← NEW (3.1)
│   ├── TodoList.tsx            ← UPDATED across 3.1–3.2
│   ├── TodoItem.tsx            ← NEW (3.2), UPDATED (3.3, 3.4)
│   ├── TodoInput.tsx           ← NEW (3.2)
│   └── QuoteModal.tsx          ← NEW (3.3)
└── pages/
    └── HomePage.tsx            ← UPDATED across 3.1–3.4
```

### Scope Boundary

| Concern                         | This story | Later story |
| ------------------------------- | ---------- | ----------- |
| `DELETE /todos/:id` backend     | ✅         | —           |
| `deleteTodo` optimistic removal | ✅         | —           |
| Delete button on `TodoItem`     | ✅         | —           |
| Visual aging / highlighting     | ❌         | Story 4.1   |
| Empty state component           | ❌         | Story 4.3   |

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

N/A

### Completion Notes List

- DELETE /todos/:id route added with ownership check (403), not-found (404), returns 204 No Content
- api.ts updated to handle 204 response (skip response.json() call)
- deleteTodo optimistic pattern in useTodos: immediate filter-out, snapshot rollback on error
- TodoItem updated with onDelete prop and Trash2 icon button
- TodoList updated to pass onDelete down to each TodoItem
- HomePage wired with deleteTodo
- Code review fix: reply.status(404 as any) and reply.status(403 as any) → reply.status(404/403) in DELETE handler

### File List

- backend/src/routes/todos.route.ts
- backend/test/todos.route.test.ts
- frontend/src/lib/api.ts
- frontend/src/hooks/useTodos.ts
- frontend/src/components/TodoItem.tsx
- frontend/src/components/TodoList.tsx
- frontend/src/pages/HomePage.tsx
- frontend/src/components/TodoItem.test.tsx
