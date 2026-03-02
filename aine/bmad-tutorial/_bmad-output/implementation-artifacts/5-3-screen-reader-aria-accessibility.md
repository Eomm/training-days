# Story 5.3: Screen Reader & ARIA Accessibility

Status: done

## Story

As a **screen reader user**,
I want all interactive elements to be properly labelled and announced,
So that I can use the app independently with assistive technology.

## Acceptance Criteria

1. **Given** a screen reader navigates to a todo item, **When** it encounters the complete or delete action, **Then** each button carries the todo's text in its label (e.g. `aria-label="Mark "Buy milk" as complete"` / `aria-label="Delete "Buy milk""`).
2. The motivational quote is announced when it appears after marking a todo done (the Dialog title and quote content are announced via Radix focus management).
3. The staleness prompt ("Is this task still ongoing?") is announced for stale todos as inline text content of the list item.
4. The empty state ("Nothing here yet. Add your first task above.") is announced when there are no todos.
5. The skeleton loading state carries `aria-busy="true"` and `aria-label="Loading tasks"` on its container.
6. The todo list `<ul>` carries `role="list"` and `aria-label="Your tasks"`.
7. A skip-navigation link (`<a href="#task-input">Skip to task input</a>`) is present in the DOM, visually hidden except on focus (per UX spec pattern).
8. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Task-specific aria-labels on action buttons (AC: 1)
  - [x] 1.1 In `TodoItem.tsx`, update mark-done button `aria-label` to `` `Mark "${todo.text}" as complete` ``.
  - [x] 1.2 In `TodoItem.tsx`, update delete button `aria-label` to `` `Delete "${todo.text}"` ``.
  - [x] 1.3 Update `TodoItem.test.tsx`: update all `getByRole('button', { name: /mark as done/i })` queries to match the new dynamic label pattern.
  - [x] 1.4 Update `TodoItem.test.tsx`: update all `getByRole('button', { name: /delete todo/i })` queries to match the new dynamic label.

- [x] Task 2 — ARIA on list and loading state (AC: 5, 6)
  - [x] 2.1 In `TodoList.tsx`, add `role="list"` and `aria-label="Your tasks"` to the `<ul>`.
  - [x] 2.2 In `SkeletonList.tsx`, add `aria-busy="true"` and `aria-label="Loading tasks"` to the outer `<ul>`.
  - [x] 2.3 Update `TodoList.test.tsx` to assert `role="list"` and `aria-label="Your tasks"` are present on the list.

- [x] Task 3 — Skip navigation link (AC: 7)
  - [x] 3.1 In `App.tsx`, restructured `RootLayout` so skip link always renders (not gated on loading state).
  - [x] 3.2 In `TodoInput.tsx`, added `id="task-input"` to the `<Input>` element so the skip link target resolves correctly.
  - [x] 3.3 Added `App.test.tsx` with 2 tests asserting skip link is present in DOM and has correct `href`.

- [x] Task 4 — Run full test suite (AC: 8)
  - [x] 4.1 Run `npm run test --workspace=frontend` — 82 tests passing across 11 test files.

## Dev Notes

### UX Spec — Screen Reader Annotations

| Element            | ARIA                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Task list          | `role="list"` on `ul`                                                                            |
| Task item          | `role="listitem"` on `li` (implicit)                                                             |
| Complete button    | `` `aria-label="Mark [task text] as complete"` ``                                                |
| Delete button      | `` `aria-label="Delete [task text]"` ``                                                          |
| Motivational quote | `role="status"` (polite live region) — Radix Dialog handles announcement via focus + DialogTitle |
| Task count         | `aria-live="polite"` (deferred — no task count UI yet)                                           |
| Loading skeleton   | `aria-busy="true"` on list + `aria-label="Loading tasks"`                                        |
| Error toast        | `role="alert"` (assertive live region) — Story 5.5                                               |

### Skip Navigation Pattern (from UX spec)

```html
<a
  href="#task-input"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
>
  Skip to task input
</a>
```

### Current ARIA State (after Stories 5.1 & 5.2)

- Mark-done button: `aria-label="Mark as done"` — **needs** task-specific text
- Delete button: `aria-label="Delete todo"` — **needs** task-specific text
- Buttons are `<button>` elements — role="button" implicit ✅
- QuoteModal: uses Radix Dialog — focus trap + DialogTitle announced on open ✅
- Staleness prompt: inline `<span>` inside `<li>` — read naturally ✅
- Empty state: `<p>` element — read naturally ✅

### Test Query Updates

The existing tests query by `{ name: /mark as done/i }` and `{ name: /delete todo/i }`. After the update, examples for a todo with `text: "Write tests"`:

- New mark-done label: `'Mark "Write tests" as complete'`
- New delete label: `'Delete "Write tests"'`
  Update queries to: `{ name: /mark "write tests" as complete/i }` and `{ name: /delete "write tests"/i }`.

### Architecture Conventions

- React components: `PascalCase`, hooks: `camelCase` with `use` prefix
- Styling: Tailwind CSS utility classes exclusively — `sr-only`, `focus:not-sr-only` are Tailwind utilities

### Scope Boundary

| Concern                          | This story | Later story |
| -------------------------------- | ---------- | ----------- |
| Task-specific button aria-labels | ✅         | —           |
| list/skeleton ARIA               | ✅         | —           |
| Skip navigation link             | ✅         | —           |
| Error toast `role="alert"`       | ❌         | Story 5.5   |
| Color contrast                   | ❌         | Story 5.4   |

### Previous Story Intelligence (Story 5.2)

- `TodoItem` is now `forwardRef` — component signature changed, tests import stays the same
- Mark-done button restructured with outer 44×44px `<button>` + inner visual `<span>`
- 76 tests passing

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Screen Reader Annotations]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- FR27: All interactive elements compatible with screen readers
- NFR11: Zero critical WCAG 2.1 violations
- NFR14: All interactive elements carry appropriate labels for screen reader compatibility

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
