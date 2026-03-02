# Frontend Patterns

Project-specific frontend patterns established during MVP (Phase 1) development.

## `forwardRef` for Parent-Controlled Focus

**Pattern:** Components that need parent-controlled focus or DOM access use `forwardRef`.

```tsx
// TodoItem accepts a ref for parent-controlled focus management
export const TodoItem = forwardRef<HTMLLIElement, TodoItemProps>(
  function TodoItem({ todo, onDone, onDelete, agingClass, isStale }, ref) {
    return (
      <li ref={ref} className={...}>
        {/* ... */}
      </li>
    )
  }
)
```

**Usage in parent:**

```tsx
// TodoList can manage focus across items via refs
const itemRef = useRef<HTMLLIElement>(null)
<TodoItem ref={itemRef} todo={todo} ... />
```

**Why:** `forwardRef` enables keyboard navigation patterns (Story 5.2) where the parent component needs to programmatically move focus between list items. Without it, focus management would require imperative DOM queries.

## StrictMode Cancellation Flag

**Pattern:** One-time initialization hooks use a `cancelled` flag to prevent double execution under React 18 StrictMode.

```tsx
export function useGuestIdentity() {
  const [userId, setUserIdState] = useState<string | null>(getUserId);
  const [isLoading, setIsLoading] = useState<boolean>(userId === null);

  useEffect(() => {
    if (userId !== null) return;

    let cancelled = false; // ← cancellation flag

    apiFetch<GuestResponse>("/guest", {
      method: "POST",
      body: JSON.stringify({}),
    })
      .then((data) => {
        if (cancelled) return; // ← skip if effect was cleaned up
        setUserId(data.userId);
        setUserIdState(data.userId);
      })
      .catch((err) => {
        console.error("Failed to initialise guest identity:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    }; // ← cleanup sets flag
  }, []);

  return { userId, isLoading };
}
```

**Why:** React 18 StrictMode re-runs effects during development to surface cleanup bugs. Without the cancellation flag, `POST /guest` would fire twice, creating two anonymous users. The flag ensures only the second invocation's response is used.

**Apply this pattern to:** Any hook that makes a one-time setup API call (identity initialization, feature flag loading, etc.).

## Optimistic Update Patterns

Three distinct optimistic update strategies, each tailored to its mutation type:

### addTodo — Temp ID Swap

```typescript
async function addTodo(text: string) {
  const tempId = crypto.randomUUID();
  const optimisticTodo: Todo = {
    id: tempId,
    userId: "",
    text,
    done: false,
    createdAt: new Date().toISOString(),
  };

  setTodos((prev) => [optimisticTodo, ...prev]); // prepend with temp ID

  try {
    const created = await apiFetch<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setTodos((prev) =>
      prev.map(
        (t) => (t.id === tempId ? created : t), // swap temp → server-confirmed
      ),
    );
  } catch {
    setTodos((prev) => prev.filter((t) => t.id !== tempId)); // remove on error
  }
}
```

**Key:** Temp UUID allows immediate rendering. On success, swap in the server-confirmed item (with real ID and timestamp). On error, filter out the temp item.

### markDone — Reference Save + Restore

```typescript
async function markDone(id: string) {
  const previous = todos.find((t) => t.id === id); // save reference
  if (!previous) return;

  setTodos((prev) =>
    prev.map(
      (t) => (t.id === id ? { ...t, done: true } : t), // toggle in place
    ),
  );

  try {
    const data = await apiFetch<{ todo: Todo; quote: string }>("/todos/" + id, {
      method: "PATCH",
      body: JSON.stringify({ done: true }),
    });
    setTodos((prev) =>
      prev.map(
        (t) => (t.id === id ? data.todo : t), // replace with server-confirmed
      ),
    );
  } catch {
    setTodos((prev) =>
      prev.map(
        (t) => (t.id === id ? previous : t), // restore saved reference
      ),
    );
  }
}
```

**Key:** Save the original todo reference before mutation. On error, restore it exactly. The server response also returns a motivational quote.

### deleteTodo — Snapshot Restore

```typescript
async function deleteTodo(id: string) {
  const snapshot = todos; // capture full list

  setTodos((prev) => prev.filter((t) => t.id !== id)); // remove immediately

  try {
    await apiFetch<void>("/todos/" + id, { method: "DELETE" });
    // success: nothing to do — item already gone
  } catch {
    setTodos(snapshot); // restore entire snapshot
  }
}
```

**Key:** Simplest pattern — capture the full list, filter out the item. On success, no-op. On error, restore the snapshot.

**Why three patterns?** Each mutation has different success/failure semantics. Copy-pasting a single pattern would create subtle bugs (e.g., using temp-ID swap for delete would lose other concurrent changes in the snapshot).

## `useMemo` for Computed Values

**Pattern:** Expensive computations derived from state are wrapped in `useMemo`, with the algorithm as a pure function in `lib/`.

```tsx
// lib/computeAgeHighlights.ts — pure function, no React dependency
export function computeAgeHighlights(
  todos: AgingInput[],
): Map<string, AgeHighlight> {
  // ranked intensity algorithm...
}

// components/TodoList.tsx — useMemo in component
const activeTodos = todos.filter((t) => !t.done);
const highlights = useMemo(
  () => computeAgeHighlights(activeTodos),
  [activeTodos],
);
```

**Why:**

- **Pure function in `lib/`:** Independently testable with unit tests (18 tests cover edge cases) — no React rendering overhead
- **`useMemo` in component:** Avoids recomputing on every render — only recalculates when `todos` changes
- **Separation of concerns:** Algorithm logic lives outside React; the component only consumes the result

## `motion-safe:` Transition Convention

**Convention:** All CSS transitions use the `motion-safe:` prefix.

```tsx
// ✅ Correct — respects user's reduced-motion preference
className = "motion-safe:transition-all motion-safe:duration-500";

// ❌ Wrong — plays animation regardless of user preference
className = "transition-all duration-500";
```

**Why:** Users with vestibular disorders can set `prefers-reduced-motion: reduce` in their OS. The `motion-safe:` prefix ensures transitions only play when the user hasn't requested reduced motion, meeting WCAG 2.1 guideline 2.3.3.
