# Story 4.1: Visual Age Highlighting Algorithm

Status: done

## Story

As a **user**,
I want older tasks to become progressively more highlighted,
so that I can see at a glance which tasks have been waiting longest without any manual sorting.

## Acceptance Criteria

1. **Given** a list of todos with varying `createdAt` timestamps, **When** the todo list renders, **Then** each todo receives a highlight intensity value derived from its relative position in the age distribution of the current list (FR8, FR9).
2. The newest todo has no highlight (0% intensity).
3. Highlight intensity increases progressively from newest to oldest across all todos in the list.
4. The algorithm is **relative and list-aware**: a task that is "old" in a list of 3 tasks may be less highlighted than a task of equal age in a list of 20 tasks.
5. The highlighting logic is encapsulated in a pure function (`computeAgeHighlights`) that is independently unit-tested.
6. The highlight intensity is expressed as a value from 0–100 passed as a prop or CSS custom property to each todo item.
7. The 0–100 intensity value is mapped to the zinc palette tiers:

| Intensity | Tailwind class | Visual state         |
| --------- | -------------- | -------------------- |
| 0         | `bg-white`     | Fresh — no highlight |
| 1–25      | `bg-zinc-100`  | Aging                |
| 26–50     | `bg-zinc-200`  | Noticeably aging     |
| 51–75     | `bg-zinc-300`  | Urgent               |
| 76–100    | `bg-zinc-400`  | Peak urgency         |

8. A single-item list always has its one task at 0% (no highlight).
9. A list of N items spreads intensity evenly across the scale based on relative age rank.
10. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Create pure function `computeAgeHighlights` in `frontend/src/lib/computeAgeHighlights.ts` (AC: 1, 2, 3, 4, 5, 6, 8, 9)
  - [x] 1.1 Create file `frontend/src/lib/computeAgeHighlights.ts`
  - [x] 1.2 Define input type: `{ id: string; createdAt: string }[]` (subset of `Todo`)
  - [x] 1.3 Define return type: `Map<string, number>` mapping `todo.id → intensity (0–100)`
  - [x] 1.4 Algorithm: sort by `createdAt` descending (newest first), assign intensity based on rank/position
  - [x] 1.5 Edge cases: empty array → empty Map; single item → Map with `{ id: 0 }`; all same `createdAt` → all 0
  - [x] 1.6 The intensity for rank `i` in a list of `n` items: `Math.round((i / (n - 1)) * 100)` where `i=0` is newest, `i=n-1` is oldest. For `n=1`, intensity is `0`.
  - [x] 1.7 Export the function as a named export

- [x] Task 2 — Write unit tests for `computeAgeHighlights` in `frontend/src/lib/computeAgeHighlights.test.ts` (AC: 5, 8, 9, 10)
  - [x] 2.1 Test: empty array returns empty Map
  - [x] 2.2 Test: single item returns Map with intensity 0
  - [x] 2.3 Test: two items — newest is 0, oldest is 100
  - [x] 2.4 Test: five items — intensity spreads evenly (0, 25, 50, 75, 100)
  - [x] 2.5 Test: items with same `createdAt` — all receive intensity 0 (no age difference)
  - [x] 2.6 Test: relative & list-aware — same dates produce different intensities in different-sized lists
  - [x] 2.7 Test: already-sorted vs unsorted input produces same result (function sorts internally)
  - [x] 2.8 Run `npm run test --workspace=frontend` — all pass

- [x] Task 3 — Create helper function `getAgingClass` in `frontend/src/lib/computeAgeHighlights.ts` (AC: 7)
  - [x] 3.1 Add named export `getAgingClass(intensity: number): string` to the same file
  - [x] 3.2 Map: `0 → 'bg-white'`, `1–25 → 'bg-zinc-100'`, `26–50 → 'bg-zinc-200'`, `51–75 → 'bg-zinc-300'`, `76–100 → 'bg-zinc-400'`
  - [x] 3.3 Add unit tests for `getAgingClass` in the same test file: test each tier boundary (0, 1, 25, 26, 50, 51, 75, 76, 100)

- [x] Task 4 — Integrate aging highlights into `TodoList.tsx` and `TodoItem.tsx` (AC: 1, 6, 7)
  - [x] 4.1 In `TodoList.tsx`: import `computeAgeHighlights` and `getAgingClass` from `../lib/computeAgeHighlights.ts`
  - [x] 4.2 In `TodoList.tsx`: compute `const highlights = useMemo(() => computeAgeHighlights(todos), [todos])` — wrap in `useMemo` for performance
  - [x] 4.3 In `TodoList.tsx`: for each `TodoItem`, pass `agingClass={getAgingClass(highlights.get(todo.id) ?? 0)}` as a prop
  - [x] 4.4 In `TodoItem.tsx`: add `agingClass: string` to `TodoItemProps` interface
  - [x] 4.5 In `TodoItem.tsx`: replace hardcoded `bg-white` in the `<li>` className with the `agingClass` prop value
  - [x] 4.6 Ensure completed (`done: true`) todos do NOT get aging highlights — they remain `bg-white` or dim
  - [x] 4.7 Only compute aging highlights for non-done todos (filter before passing to `computeAgeHighlights`)

- [x] Task 5 — Update existing component tests (AC: 10)
  - [x] 5.1 Update `TodoItem.test.tsx`: add `agingClass` prop to all test renders (e.g., `agingClass="bg-white"`)
  - [x] 5.2 Update `TodoList.test.tsx`: verify aging classes are applied to rendered items
  - [x] 5.3 Add test: single todo renders with `bg-white` (no highlight)
  - [x] 5.4 Add test: multiple todos render with different aging classes based on `createdAt`
  - [x] 5.5 Add test: done todos render without aging highlight
  - [x] 5.6 Run full frontend test suite — all pass

## Dev Notes

### Algorithm Design — CRITICAL

The algorithm MUST be **relative and list-aware** (FR9). This means:

- Intensity is derived from each todo's **proportional rank** in the current list's age distribution
- It is NOT based on absolute day thresholds (e.g., "3 days old = tier 2")
- The zinc tier table is the **visual mapping** of the computed intensity, not an independent threshold system

**Formula:**

```typescript
// For a sorted list (newest first, index 0 = newest):
// intensity(i) = n <= 1 ? 0 : Math.round((i / (n - 1)) * 100)
//
// Examples:
// 1 item:  [0]
// 2 items: [0, 100]
// 3 items: [0, 50, 100]
// 5 items: [0, 25, 50, 75, 100]
```

### Pure Function Signature

```typescript
// frontend/src/lib/computeAgeHighlights.ts

interface AgingInput {
  id: string;
  createdAt: string;
}

export function computeAgeHighlights(todos: AgingInput[]): Map<string, number> {
  if (todos.length <= 1) {
    return new Map(todos.map((t) => [t.id, 0]));
  }

  // Sort by createdAt descending (newest first)
  const sorted = [...todos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const n = sorted.length;
  return new Map(
    sorted.map((todo, i) => [todo.id, Math.round((i / (n - 1)) * 100)]),
  );
}

export function getAgingClass(intensity: number): string {
  if (intensity === 0) return "bg-white";
  if (intensity <= 25) return "bg-zinc-100";
  if (intensity <= 50) return "bg-zinc-200";
  if (intensity <= 75) return "bg-zinc-300";
  return "bg-zinc-400";
}
```

### TodoItem.tsx Changes

Replace the hardcoded `bg-white` with the `agingClass` prop:

```tsx
// BEFORE:
<li className="flex items-center gap-3 p-3 rounded-md border border-gray-200 bg-white">

// AFTER:
<li className={`flex items-center gap-3 p-3 rounded-md border border-gray-200 ${agingClass}`}>
```

### TodoList.tsx Changes

```tsx
import { useMemo } from "react";
import {
  computeAgeHighlights,
  getAgingClass,
} from "../lib/computeAgeHighlights.ts";

// Inside the component:
const activeTodos = todos.filter((t) => !t.done);
const highlights = useMemo(
  () => computeAgeHighlights(activeTodos),
  [activeTodos],
);

// When rendering:
<TodoItem
  key={todo.id}
  todo={todo}
  onDone={onDone}
  onDelete={onDelete}
  agingClass={
    todo.done ? "bg-white" : getAgingClass(highlights.get(todo.id) ?? 0)
  }
/>;
```

### UX Design Compliance

From [ux-design-specification.md](../planning-artifacts/ux-design-specification.md):

- **Colour system:** Pure monochrome (zinc scale only). No accent colours.
- **Visual aging tiers:** `bg-white` → `bg-zinc-50` → `bg-zinc-100` → `bg-zinc-200` → `bg-zinc-300` → `bg-zinc-400`
- **Contrast ratios:** All tiers pass WCAG AA for `zinc-950` text on zinc backgrounds (minimum ~7:1)
- **Staleness state:** Deferred to Story 4.2 — do NOT implement staleness in this story
- **Empty state:** Deferred to Story 4.3 — do NOT touch empty state logic in this story

> **Note:** The epics file maps intensities to 5 tiers (`bg-white`, `bg-zinc-100`–`bg-zinc-400`). The UX spec defines a more granular 7-tier system including `bg-zinc-50`. For this story, follow the **epics file tier mapping** (5 tiers) as the acceptance criteria are explicitly tied to those values. Story 4.2 may refine with additional tiers if needed.

### Architecture Compliance

From [architecture.md](../planning-artifacts/architecture.md):

- Pure function goes in `frontend/src/lib/` (utility, no React dependency)
- Hook usage via `useMemo` — no new custom hook file needed for this story (architecture mentions `useAgeHighlight.ts` but the `useMemo` call directly in `TodoList` is simpler and sufficient)
- Test files co-located: `computeAgeHighlights.test.ts` next to `computeAgeHighlights.ts`
- Naming: `camelCase` function names (`computeAgeHighlights`, `getAgingClass`)
- No backend changes required — this is entirely frontend computation

### Existing File Patterns (from Story 3.4 learnings)

- `TodoItem.tsx` accepts props interface `TodoItemProps` — add `agingClass: string` to it
- `TodoList.tsx` maps over `todos` array — add `useMemo` for highlights computation
- `useTodos.ts` returns `todos` sorted by `createdAt` descending (server-side sort preserved)
- All existing tests must continue to pass after changes

### Project Structure Notes

- New file: `frontend/src/lib/computeAgeHighlights.ts`
- New file: `frontend/src/lib/computeAgeHighlights.test.ts`
- Modified: `frontend/src/components/TodoItem.tsx` (add `agingClass` prop)
- Modified: `frontend/src/components/TodoList.tsx` (add highlight computation)
- Modified: `frontend/src/components/TodoItem.test.tsx` (add `agingClass` prop to renders)
- Modified: `frontend/src/components/TodoList.test.tsx` (add aging class assertions)

### Scope Boundary

| Concern                              | This story | Later story                                 |
| ------------------------------------ | ---------- | ------------------------------------------- |
| `computeAgeHighlights` pure function | ✅         | —                                           |
| `getAgingClass` tier mapping         | ✅         | —                                           |
| Integration into TodoList/TodoItem   | ✅         | —                                           |
| Unit tests for algorithm             | ✅         | —                                           |
| Staleness threshold & prompt         | ❌         | Story 4.2                                   |
| Empty state component                | ❌         | Story 4.3                                   |
| WCAG contrast verification           | ❌         | Story 5.4                                   |
| `useAgeHighlight` custom hook        | ❌         | Not needed — `useMemo` in TodoList suffices |

### References

- Visual aging algorithm: [architecture.md#Frontend Architecture](../planning-artifacts/architecture.md) — "Visual aging algorithm runs in a useMemo hook"
- Zinc palette tiers: [ux-design-specification.md#Visual Aging Tiers](../planning-artifacts/ux-design-specification.md) — Colour system
- Contrast ratios: [ux-design-specification.md#Accessibility Considerations](../planning-artifacts/ux-design-specification.md) — All tiers WCAG AA pass
- FR8: "Each todo displays visual highlight intensity proportional to its relative age"
- FR9: "Highlight graduation is relative and list-aware"
- Epics story 4.1: [epics.md#Story 4.1](../planning-artifacts/epics.md) — Full AC with tier table

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- Created `computeAgeHighlights` pure function: relative, list-aware intensity algorithm (0–100) based on rank position
- Created `getAgingClass` helper: maps intensity to zinc palette Tailwind classes (5 tiers)
- 17 unit tests for algorithm covering: empty, single, two, five items, same timestamps, input order independence, list-awareness, and all tier boundaries
- Integrated into `TodoList.tsx` with `useMemo` for performance — filters out done todos before computing
- Updated `TodoItem.tsx` to accept `agingClass` prop (defaults to `bg-white`)
- Updated 6 existing `TodoItem` tests to include `agingClass` prop
- Added 3 new `TodoList` tests: single todo highlight, multiple aging classes, done todo exclusion
- Full frontend suite: 60 tests, 10 files, 0 failures
- Backend: 1 pre-existing failure in `guest.route.test.ts` (unrelated — no backend changes in this story)

### File List

- frontend/src/lib/computeAgeHighlights.ts (NEW)
- frontend/src/lib/computeAgeHighlights.test.ts (NEW)
- frontend/src/components/TodoItem.tsx (MODIFIED)
- frontend/src/components/TodoList.tsx (MODIFIED)
- frontend/src/components/TodoItem.test.tsx (MODIFIED)
- frontend/src/components/TodoList.test.tsx (MODIFIED)
