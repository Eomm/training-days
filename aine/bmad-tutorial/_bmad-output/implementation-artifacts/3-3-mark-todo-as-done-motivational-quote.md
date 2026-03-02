# Story 3.3: Mark Todo as Done & Motivational Quote

Status: ready-for-dev

## Story

As a **user**,
I want to mark a todo as done and see a motivational quote,
So that completing tasks feels rewarding and reinforces the habit loop.

## Acceptance Criteria

1. **Given** a valid `X-User-Id` header, **When** `PATCH /todos/:id` is called with `{ "done": true }`, **Then** the todo's `done` field is set to `true` and the response is `200 OK` with body `{ "todo": {...}, "quote": "..." }`.
2. Only the todo's owner can patch it — a different user's `X-User-Id` returns `403 Forbidden`.
3. Patching a non-existent todo returns `404 Not Found`.
4. `quotes.json` is loaded at backend startup into memory; a random quote is selected on each `PATCH /todos/:id` call. No DB query for quotes.
5. `quotes.json` contains at least 20 unique quotes (architecture requires 100+).
6. The todo is marked visually as complete in the UI immediately (optimistic update — `done: true` before API response).
7. A `QuoteModal` displays the motivational quote from the response.
8. If the API call fails, the optimistic completion is reverted.
9. The endpoint is documented in Swagger.
10. Running `npm run test --workspace=backend` and `npm run test --workspace=frontend` both exit with zero failures.

## Tasks / Subtasks

- [ ] Task 1 — Create `backend/src/data/quotes.json` (AC: 4, 5)
  - [ ] Create `backend/src/data/` directory
  - [ ] Create `quotes.json` as a JSON array of at least 100 unique motivational quote strings
  - [ ] See Dev Notes for the initial set of 100 quotes

- [ ] Task 2 — Add `PATCH /todos/:id` to `backend/src/routes/todos.route.ts` (AC: 1, 2, 3, 4, 9)
  - [ ] Load `quotes.json` ONCE at module load time (not per-request): `import quotesData from '../data/quotes.json' assert { type: 'json' }` — or use `fs.readFileSync` in ESM
  - [ ] Add route parameter `id` of type `string`
  - [ ] Parse body: `{ done: boolean }` — Fastify JSON schema validation
  - [ ] Read `userId` from `request.headers['x-user-id'] as string`
  - [ ] Fetch existing todo: if not found → 404; if `todo.userId !== userId` → 403
  - [ ] Update: `fastify.db.update(todos).set({ done }).where(eq(todos.id, id)).returning()`
  - [ ] Select random quote: `quotesData[Math.floor(Math.random() * quotesData.length)]`
  - [ ] Return `{ todo: mappedTodo, quote }` with status 200
  - [ ] See Dev Notes for exact implementation

- [ ] Task 3 — Write backend tests for PATCH /todos/:id (AC: 1, 2, 3, 10)
  - [ ] Add to `backend/test/todos.route.test.ts`
  - [ ] Test: patch own todo with `{ done: true }` returns 200 with `{ todo, quote }`
  - [ ] Test: patch non-existent todo returns 404
  - [ ] Test: patch another user's todo returns 403
  - [ ] Test: response `quote` is a non-empty string
  - [ ] Run full suite — all pass

- [ ] Task 4 — Create `frontend/src/components/QuoteModal.tsx` (AC: 7)
  - [ ] Props: `{ quote: string | null; onClose: () => void }`
  - [ ] If `quote` is null → render nothing
  - [ ] Use shadcn `Dialog` component for the modal
  - [ ] Display the quote text and a "Keep going! 🎉" close button
  - [ ] See Dev Notes for exact content

- [ ] Task 5 — Add `markDone` to `frontend/src/hooks/useTodos.ts` (AC: 6, 7, 8)
  - [ ] Add `markDone(id: string): Promise<void>` function
  - [ ] Optimistically set `done: true` on the todo immediately
  - [ ] Call `apiFetch<{ todo: Todo; quote: string }>('/todos/' + id, { method: 'PATCH', body: JSON.stringify({ done: true }) })`
  - [ ] On success: replace the todo with the server-confirmed todo; set `quote` state with `data.quote`
  - [ ] On error: revert `done` back to `false` + set `error` state
  - [ ] Return `{ todos, isLoading, error, addTodo, markDone, quote, clearQuote }` from hook
  - [ ] See Dev Notes for exact implementation

- [ ] Task 6 — Wire `TodoItem` done button and `QuoteModal` into `HomePage.tsx` (AC: 6, 7)
  - [ ] Update `TodoItem` props: add `onDone: (id: string) => void`
  - [ ] Wire the circular done button to call `onDone(todo.id)`
  - [ ] In `HomePage.tsx`: destructure `{ markDone, quote, clearQuote }` from `useTodos`
  - [ ] Render `<QuoteModal quote={quote} onClose={clearQuote} />` in `HomePage`
  - [ ] Pass `onDone={markDone}` to `<TodoItem>` (via `<TodoList>`)

- [ ] Task 7 — Write frontend tests (AC: 10)
  - [ ] `frontend/src/components/QuoteModal.test.tsx`: renders quote text, calls onClose on button click, renders nothing when quote is null
  - [ ] Update `useTodos.test.ts`: test `markDone` optimistic set, server replace, and rollback on error
  - [ ] Run `npm run test --workspace=frontend` — all pass

## Dev Notes

### Loading quotes.json in ESM Backend

The backend uses ES modules (`"type": "module"` in `package.json`). The recommended pattern for loading a JSON data file in Node >= 22 with `--experimental-strip-types`:

```typescript
// At the top of todos.route.ts (module-level, loaded ONCE)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const quotes: string[] = require("../data/quotes.json");
```

> **Why not `import ... assert { type: 'json' }`?** JSON import assertions are deprecated in Node 22 in favour of `with { type: 'json' }` (import attributes). Either works but `createRequire` is the most stable cross-version pattern for this stack. Alternatively: `import quotes from '../data/quotes.json' with { type: 'json' }` works in Node 22.4+.

> **Why not `fs.readFileSync`?** It works but parsing JSON manually adds noise. `createRequire` is simpler.

### PATCH /todos/:id Handler

```typescript
fastify.patch(
  "/todos/:id",
  {
    schema: {
      tags: ["todos"],
      summary: "Update a todo (mark done)",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["done"],
        properties: { done: { type: "boolean" } },
      },
      response: {
        200: {
          type: "object",
          required: ["todo", "quote"],
          properties: {
            todo: {
              type: "object",
              properties: {
                id: { type: "string" },
                userId: { type: "string" },
                text: { type: "string" },
                done: { type: "boolean" },
                createdAt: { type: "string" },
              },
            },
            quote: { type: "string" },
          },
        },
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params as { id: string };
    const { done } = request.body as { done: boolean };
    const userId = request.headers["x-user-id"] as string;

    // Fetch existing to validate ownership
    const [existing] = await fastify.db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);

    if (!existing) {
      return reply
        .status(404)
        .send({
          statusCode: 404,
          error: "Not Found",
          message: "Todo not found",
        });
    }
    if (existing.userId !== userId) {
      return reply
        .status(403)
        .send({
          statusCode: 403,
          error: "Forbidden",
          message: "Not your todo",
        });
    }

    const [updated] = await fastify.db
      .update(todos)
      .set({ done })
      .where(eq(todos.id, id))
      .returning();

    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    return reply.send({
      todo: {
        id: updated.id,
        userId: updated.userId,
        text: updated.text,
        done: updated.done,
        createdAt: updated.createdAt.toISOString(),
      },
      quote,
    });
  },
);
```

### `markDone` Optimistic Pattern

```typescript
async function markDone(id: string): Promise<void> {
  // Save previous state for rollback
  const previous = todos.find((t) => t.id === id);
  if (!previous) return;

  // Optimistic update
  setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)));

  try {
    const data = await apiFetch<{ todo: Todo; quote: string }>("/todos/" + id, {
      method: "PATCH",
      body: JSON.stringify({ done: true }),
    });
    setTodos((prev) => prev.map((t) => (t.id === id ? data.todo : t)));
    setQuote(data.quote);
  } catch (err) {
    // Rollback
    setTodos((prev) => prev.map((t) => (t.id === id ? previous : t)));
    setError(err instanceof Error ? err.message : "Failed to update todo");
  }
}
```

> Add `const [quote, setQuote] = useState<string | null>(null)` and `clearQuote = () => setQuote(null)` to `useTodos`.

### QuoteModal with shadcn Dialog

```tsx
// frontend/src/components/QuoteModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog.js";
import { Button } from "./ui/button.js";

interface QuoteModalProps {
  quote: string | null;
  onClose: () => void;
}

export function QuoteModal({ quote, onClose }: QuoteModalProps) {
  return (
    <Dialog
      open={quote !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Complete! 🎉</DialogTitle>
        </DialogHeader>
        <p className="text-lg italic text-center py-4">"{quote}"</p>
        <DialogFooter>
          <Button onClick={onClose}>Keep going!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

> **shadcn `Dialog`:** Run `npx shadcn@latest add dialog` if `src/components/ui/dialog.tsx` does not exist.

### 100 Motivational Quotes (for `quotes.json`)

The file is a flat JSON array of strings. Use a mix of short and medium-length quotes. A representative starting set (generate at least 100):

```json
[
  "The secret of getting ahead is getting started.",
  "It always seems impossible until it's done.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Believe you can and you're halfway there."
]
```

> Generate 100+ unique quotes covering themes of: persistence, progress, focus, momentum, completion. They must be non-offensive, culturally neutral, and brief (< 120 characters each preferred).

### Scope Boundary

| Concern                          | This story | Later story |
| -------------------------------- | ---------- | ----------- |
| `PATCH /todos/:id` backend       | ✅         | —           |
| `quotes.json` + random selection | ✅         | —           |
| `QuoteModal` component           | ✅         | —           |
| `markDone` optimistic update     | ✅         | —           |
| `DELETE /todos/:id`              | ❌         | Story 3.4   |
| Delete button on `TodoItem`      | ❌         | Story 3.4   |

### References

- `PATCH /todos/:id` spec: [architecture.md](../planning-artifacts/architecture.md) — REST API Surface
- Quotes: [architecture.md](../planning-artifacts/architecture.md) — "Motivational quotes: Stored as a static JSON file... Minimum 100 quotes"
- Optimistic update pattern: [architecture.md](../planning-artifacts/architecture.md) — Communication Patterns
- Story ACs: [epics.md](../planning-artifacts/epics.md) — Story 3.3

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
