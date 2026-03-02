# Story 4.2: Staleness Threshold & Contextual Prompt

Status: done

## Story

As a **user**,
I want tasks that may be abandoned to signal their staleness with a reduced highlight and a prompt,
so that I can distinguish urgently pending tasks from potentially forgotten ones.

## Acceptance Criteria

1. **Given** a todo that has crossed the staleness threshold (based on its relative age position), **When** the todo list renders, **Then** that todo displays reduced highlight intensity (backing off from peak, per FR10).
2. The stale todo displays the contextual prompt: _"Is this task still ongoing?"_
3. **Given** a todo that has NOT crossed the staleness threshold, **When** the todo list renders, **Then** no staleness prompt is shown.
4. The staleness threshold logic is part of `computeAgeHighlights` and is unit-tested with both stale and non-stale cases.
5. Stale items use `bg-zinc-200` background + `border-dashed border-zinc-400` border (reduced from peak `bg-zinc-400`), per UX design spec.
6. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Extend `computeAgeHighlights` to return staleness flag (AC: 1, 4)
  - [x] 1.1 Update return type from `Map<string, number>` to `Map<string, { intensity: number; isStale: boolean }>`
  - [x] 1.2 Define staleness threshold: in a list of N items (N > 2), items at rank position ≥ 80% (i.e., final ~20% oldest) are marked stale
  - [x] 1.3 Stale items get reduced intensity: clamped to 50 (maps to `bg-zinc-200`) instead of their natural 76–100
  - [x] 1.4 For lists of 1–2 items: no item is ever stale
  - [x] 1.5 Update all callers of `computeAgeHighlights` to use new return shape

- [x] Task 2 — Update unit tests for `computeAgeHighlights` staleness logic (AC: 4, 6)
  - [x] 2.1 Update existing tests to use new `{ intensity, isStale }` return shape
  - [x] 2.2 Test: single item → `{ intensity: 0, isStale: false }`
  - [x] 2.3 Test: two items → neither is stale
  - [x] 2.4 Test: five items → oldest item (rank 4/4) is stale with reduced intensity (50), others are not stale
  - [x] 2.5 Test: ten items → oldest 2 items are stale with reduced intensity
  - [x] 2.6 Test: three items → oldest item is stale (rank 2/2, ≥80% = position 2 in 0-indexed)
  - [x] 2.7 Run tests — all pass

- [x] Task 3 — Update `TodoList.tsx` and `TodoItem.tsx` to handle staleness (AC: 1, 2, 3, 5)
  - [x] 3.1 In `TodoList.tsx`: update to pass both `agingClass` and `isStale` to `TodoItem`
  - [x] 3.2 In `TodoItem.tsx`: add `isStale?: boolean` prop
  - [x] 3.3 In `TodoItem.tsx`: when `isStale` is true, override border to `border-dashed border-zinc-400`
  - [x] 3.4 In `TodoItem.tsx`: when `isStale` is true, render staleness prompt below the task text: `"Is this task still ongoing?"` styled as `text-xs text-zinc-500`
  - [x] 3.5 When `isStale` is false, no staleness prompt is shown

- [x] Task 4 — Update component tests for staleness UI (AC: 2, 3, 6)
  - [x] 4.1 Update `TodoItem.test.tsx`: test that stale item renders contextual prompt text
  - [x] 4.2 Update `TodoItem.test.tsx`: test that stale item has dashed border class
  - [x] 4.3 Update `TodoItem.test.tsx`: test that non-stale item does NOT render prompt
  - [x] 4.4 Update `TodoList.test.tsx`: test that oldest item in 5-item list gets staleness styling
  - [x] 4.5 Run full frontend test suite — all pass (65 tests)

## Dev Notes

### Staleness Algorithm Design

The staleness threshold is **relative** (consistent with FR9 and FR10). It is NOT based on absolute day counts.

**Threshold rule:** In a list of N items (N > 2), items at rank position ≥ 80% are marked stale. Stale items get their intensity reduced to 50 (maps to `bg-zinc-200` per the tier table).

```
N=1:  [no staleness possible]
N=2:  [no staleness — too few items]
N=3:  rank 0=0%, rank 1=50%, rank 2=100% → rank 2 ≥ 80% → stale
N=5:  ranks [0, 25, 50, 75, 100] → rank 4 (100%) ≥ 80% → stale
N=10: ranks [0, 11, 22, 33, 44, 56, 67, 78, 89, 100] → ranks 8 (89%) and 9 (100%) ≥ 80% → stale
```

### Updated `computeAgeHighlights` Return Type

```typescript
interface AgeHighlight {
  intensity: number; // 0–100
  isStale: boolean; // true if staleness threshold crossed
}

export function computeAgeHighlights(
  todos: AgingInput[],
): Map<string, AgeHighlight>;
```

### Staleness implementation in `computeAgeHighlights`

```typescript
const STALENESS_THRESHOLD = 0.8; // 80th percentile

sorted.map((todo, i) => {
  const rank = i / (n - 1); // 0.0 to 1.0
  const isStale = n > 2 && rank >= STALENESS_THRESHOLD;
  const intensity = isStale ? 50 : Math.round(rank * 100);
  return [todo.id, { intensity, isStale }];
});
```

### Stale TodoItem Visual Treatment

From UX design spec:

- Background: `bg-zinc-200` (backed off from peak `bg-zinc-400`)
- Border: `border-dashed border-zinc-400` (replaces default `border-gray-200`)
- Prompt: `text-xs text-zinc-500` text reading "Is this task still ongoing?"
- Prompt positioned below the task text, indented to align with text content

```tsx
// TodoItem when stale:
<li
  className={`flex flex-col gap-1 p-3 rounded-md ${isStale ? "border-dashed border-zinc-400" : "border border-gray-200"} ${agingClass}`}
>
  <div className="flex items-center gap-3">
    {/* existing checkmark, text, delete button */}
  </div>
  {isStale && (
    <span className="text-xs text-zinc-500 pl-8">
      Is this task still ongoing?
    </span>
  )}
</li>
```

### Impact on `TodoList.tsx`

```typescript
// Update the highlights usage:
const highlight = highlights.get(todo.id) ?? { intensity: 0, isStale: false }
agingClass={todo.done ? 'bg-white' : getAgingClass(highlight.intensity)}
isStale={!todo.done && highlight.isStale}
```

### Previous Story (4.1) Learnings

- `computeAgeHighlights` is a pure function in `frontend/src/lib/computeAgeHighlights.ts`
- `getAgingClass` maps intensity to Tailwind class — no changes needed
- `TodoList.tsx` uses `useMemo` for highlight computation — keep this pattern
- `TodoItem.tsx` accepts `agingClass` prop — add `isStale` prop alongside it
- All 60 existing tests pass — must remain green

### Scope Boundary

| Concern                           | This story | Later story |
| --------------------------------- | ---------- | ----------- |
| Staleness flag in algorithm       | ✅         | —           |
| Staleness prompt in UI            | ✅         | —           |
| Reduced highlight for stale items | ✅         | —           |
| Empty state component             | ❌         | Story 4.3   |
| WCAG contrast for stale text      | ❌         | Story 5.4   |
| Screen reader for staleness       | ❌         | Story 5.3   |

### References

- FR10: "Todo items crossing the staleness threshold display reduced highlight intensity and a contextual prompt"
- FR9: "intensity increases progressively…then decreases for tasks crossing the staleness threshold"
- UX spec staleness: [ux-design-specification.md#Visual Aging Tiers](../planning-artifacts/ux-design-specification.md) — `bg-zinc-200 + border-dashed`
- UX spec StalenessNudge component: [ux-design-specification.md#StalenessNudge](../planning-artifacts/ux-design-specification.md)
- Epics story 4.2: [epics.md#Story 4.2](../planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- All 65 frontend tests pass (10 test files)
- Staleness threshold set at 80th percentile rank (STALENESS_THRESHOLD = 0.8)
- Items in lists of N ≤ 2 are never stale
- Stale item intensity clamped to 50 → bg-zinc-200
- Staleness prompt "Is this task still ongoing?" renders below task text
- Dashed border (border-dashed border-zinc-400) applied to stale items

### File List

- frontend/src/lib/computeAgeHighlights.ts (modified — added AgeHighlight type, staleness logic)
- frontend/src/lib/computeAgeHighlights.test.ts (modified — 18 tests, all using new return shape + staleness)
- frontend/src/components/TodoItem.tsx (modified — isStale prop, dashed border, staleness prompt)
- frontend/src/components/TodoItem.test.tsx (modified — 9 tests, 3 new staleness tests)
- frontend/src/components/TodoList.tsx (modified — passes isStale prop from highlight map)
- frontend/src/components/TodoList.test.tsx (modified — 7 tests, 1 new staleness integration test)
