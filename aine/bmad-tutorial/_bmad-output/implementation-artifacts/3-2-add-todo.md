# Story 3.2: Add Todo

Status: ready-for-dev

## Story

As a **user**,
I want to add a new todo item with a single input action,
So that I can capture a task in under 10 seconds.

## Acceptance Criteria

1. **Given** a valid `X-User-Id` header and a non-empty `text` field, **When** `POST /todos` is called with `{ "text": "..." }`, **Then** the response is `201 Created` with the created todo object (id, userId, text, done, createdAt).
2. Submitting an empty or whitespace-only `text` returns `400 Bad Request`.
3. The new todo appears at the top of the list in the UI **immediately** (optimistic update — UI updates before API confirms).
4. If the API call fails, the optimistic addition is reverted and an error state is shown.
5. The input field is cleared after a successful submission.
6. Submitting an empty or whitespace-only input from the UI is blocked — no API call is made.
7. The endpoint is documented in Swagger.
8. Frontend: `TodoItem` component renders a single todo row.
9. Frontend: `TodoInput` component handles text entry and submission.
10. Running `npm run test --workspace=backend` and `npm run test --workspace=frontend` both exit with zero failures.

## Tasks / Subtasks

- [ ] Task 1 — Add `POST /todos` to `backend/src/routes/todos.route.ts` (AC: 1, 2, 7)
  - [ ] Add `POST /todos` route handler to the existing `todosRoute` plugin
  - [ ] Parse body: `{ text: string }` — validate `text` is non-empty string (Fastify JSON schema body validation)
  - [ ] Read `userId` from `request.headers['x-user-id'] as string`
  - [ ] Insert: `fastify.db.insert(todos).values({ userId, text }).returning()`
  - [ ] Return `reply.status(201).send(mappedTodo)` — mapped to camelCase with `createdAt.toISOString()`
  - [ ] See Dev Notes for exact handler and Swagger schema

- [ ] Task 2 — Write backend tests for POST /todos (AC: 1, 2, 10)
  - [ ] Add to `backend/test/todos.route.test.ts`
  - [ ] Test: `POST /todos` with valid body creates todo and returns 201 with correct shape
  - [ ] Test: `POST /todos` with empty `text` returns 400
  - [ ] Test: `POST /todos` without `X-User-Id` returns 400 (auth hook regression)
  - [ ] Run full suite — all tests pass

- [ ] Task 3 — Create `frontend/src/components/TodoItem.tsx` (AC: 8)
  - [ ] Props: `{ todo: Todo }` (done/delete actions added in 3.3/3.4 — keep simple here)
  - [ ] Renders `<li>` with todo text, a checkbox-style button (visually unchecked), and a delete button (disabled/placeholder for now)
  - [ ] On done button click: no-op for now — Story 3.3 wires it up
  - [ ] See Dev Notes for exact content

- [ ] Task 4 — Create `frontend/src/components/TodoInput.tsx` (AC: 5, 6, 9)
  - [ ] Props: `{ onAdd: (text: string) => void }`
  - [ ] Controlled input with `useState('')`
  - [ ] On submit (button click or Enter key): trim text, if empty → do nothing; if non-empty → call `onAdd(text.trim())` and clear input
  - [ ] See Dev Notes for exact content

- [ ] Task 5 — Add `addTodo` to `frontend/src/hooks/useTodos.ts` (AC: 3, 4)
  - [ ] Add optimistic `addTodo(text: string): Promise<void>` function
  - [ ] Generate a temporary `id` (`crypto.randomUUID()`) for the optimistic item
  - [ ] Optimistically prepend `{ id: tempId, userId: '', text, done: false, createdAt: new Date().toISOString() }` to todos state
  - [ ] Call `apiFetch<Todo>('/todos', { method: 'POST', body: JSON.stringify({ text }) })`
  - [ ] On success: replace the optimistic item with the server response (swap by tempId)
  - [ ] On error: remove the optimistic item + set `error` state
  - [ ] Return `{ todos, isLoading, error, addTodo }` from the hook
  - [ ] See Dev Notes for exact implementation

- [ ] Task 6 — Update `frontend/src/pages/HomePage.tsx` (AC: 3, 5, 9)
  - [ ] Replace placeholder `<Button>Add Task</Button>` with `<TodoInput onAdd={addTodo} />`
  - [ ] Replace plain `<li>` in `<TodoList>` with `<TodoItem todo={todo} />` — update `TodoList.tsx` accordingly
  - [ ] Pass `addTodo` from `useTodos` destructuring

- [ ] Task 7 — Write frontend tests (AC: 10)
  - [ ] `frontend/src/components/TodoInput.test.tsx`: submit with text calls `onAdd`, submit with empty does not, input clears after submit
  - [ ] `frontend/src/components/TodoItem.test.tsx`: renders todo text
  - [ ] Update `useTodos.test.ts`: test `addTodo` optimistic path and rollback on error
  - [ ] Run `npm run test --workspace=frontend` — all pass

## Dev Notes

### POST /todos Handler Addition to `todos.route.ts`

```typescript
fastify.post(
  "/todos",
  {
    schema: {
      tags: ["todos"],
      summary: "Create a new todo",
      body: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", minLength: 1 },
        },
      },
      response: {
        201: {
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
  async (request, reply) => {
    const { text } = request.body as { text: string };
    const userId = request.headers["x-user-id"] as string;

    const [row] = await fastify.db
      .insert(todos)
      .values({ userId, text })
      .returning();

    return reply.status(201).send({
      id: row.id,
      userId: row.userId,
      text: row.text,
      done: row.done,
      createdAt: row.createdAt.toISOString(),
    });
  },
);
```

> **`minLength: 1` in body schema:** Fastify JSON Schema validation rejects `""` or missing `text` with a 400 before the handler runs — no manual validation needed.

### `addTodo` Optimistic Update Pattern

```typescript
async function addTodo(text: string): Promise<void> {
  const tempId = crypto.randomUUID();
  const optimisticTodo: Todo = {
    id: tempId,
    userId: "", // unknown at optimistic time — server confirms
    text,
    done: false,
    createdAt: new Date().toISOString(),
  };

  // Optimistically prepend (newest first)
  setTodos((prev) => [optimisticTodo, ...prev]);

  try {
    const created = await apiFetch<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    // Replace temp item with confirmed server item
    setTodos((prev) => prev.map((t) => (t.id === tempId ? created : t)));
  } catch (err) {
    // Rollback
    setTodos((prev) => prev.filter((t) => t.id !== tempId));
    setError(err instanceof Error ? err.message : "Failed to add todo");
  }
}
```

### Exact: `frontend/src/components/TodoInput.tsx`

```tsx
// frontend/src/components/TodoInput.tsx
import { useState, KeyboardEvent } from "react";
import { Button } from "./ui/button.js";
import { Input } from "./ui/input.js";

interface TodoInputProps {
  onAdd: (text: string) => void;
}

export function TodoInput({ onAdd }: TodoInputProps) {
  const [text, setText] = useState("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="flex gap-2 w-full">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task…"
        className="flex-1"
      />
      <Button onClick={handleSubmit}>Add</Button>
    </div>
  );
}
```

> **shadcn `Input`:** Run `npx shadcn@latest add input` if `src/components/ui/input.tsx` does not exist.

### Exact: `frontend/src/components/TodoItem.tsx` (placeholder — extended in 3.3/3.4)

```tsx
// frontend/src/components/TodoItem.tsx
import type { Todo } from "../types.js";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 p-3 rounded-md border border-gray-200 bg-white">
      <button
        type="button"
        aria-label="Mark as done"
        className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"
      />
      <span className={todo.done ? "line-through text-gray-400" : ""}>
        {todo.text}
      </span>
    </li>
  );
}
```

### `crypto.randomUUID()` in Browser

`crypto.randomUUID()` is available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+) and in jsdom (Vitest). No polyfill needed.

### `TodoList.tsx` Update

In Story 3.1, `TodoList` renders plain `<li>` tags. In this story, replace the `<li>` body with `<TodoItem todo={todo} />`. Import `TodoItem` at the top of `TodoList.tsx`.

### References

- Architecture optimistic update pattern: [architecture.md](../planning-artifacts/architecture.md) — "Optimistic Update Pattern"
- `POST /todos` spec: [architecture.md](../planning-artifacts/architecture.md) — REST API Surface
- Story ACs: [epics.md](../planning-artifacts/epics.md) — Story 3.2

### Scope Boundary

| Concern                      | This story | Later story |
| ---------------------------- | ---------- | ----------- |
| `POST /todos` backend        | ✅         | —           |
| `TodoInput` component        | ✅         | —           |
| `TodoItem` component (basic) | ✅         | —           |
| `addTodo` optimistic update  | ✅         | —           |
| Done button wired            | ❌         | Story 3.3   |
| Delete button wired          | ❌         | Story 3.4   |
| Quote modal                  | ❌         | Story 3.3   |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
