# Story 5.2: Keyboard Navigation & Focus Management

Status: done

## Story

As a **keyboard user**,
I want to fully operate the app without a mouse,
So that the app is accessible to users who rely on keyboard navigation.

## Acceptance Criteria

1. **Given** the app is loaded, **When** I press Tab, **Then** focus moves through all interactive elements in a logical order (input → add button → first todo done button → first todo delete button → next todo...).
2. All interactive elements display a clearly visible focus indicator when focused (FR25, NFR12).
3. I can add a todo by typing in the input and pressing Enter without clicking.
4. I can mark a todo as done using the keyboard (Enter or Space on the complete control).
5. I can delete a todo using the keyboard (Enter or Space on the delete control).
6. After submitting a new todo, focus returns to the input field.
7. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Add ref-based focus return to input after submit (AC: 6)
  - [x] 1.1 In `TodoInput.tsx`, add a `useRef` on the input element.
  - [x] 1.2 After calling `onAdd(trimmed)` and clearing the input, call `inputRef.current?.focus()` to return focus.
  - [x] 1.3 Add test in `TodoInput.test.tsx` verifying focus returns to input after Enter submission.

- [x] Task 2 — Ensure visible focus indicators on all interactive elements (AC: 2)
  - [x] 2.1 In `TodoItem.tsx`, add explicit focus-visible ring styles to the mark-done button: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-950 rounded-full`.
  - [x] 2.2 In `TodoItem.tsx`, verify delete button (shadcn `Button`) has adequate focus-visible styling (shadcn default includes focus-visible ring — confirmed).
  - [x] 2.3 In `TodoInput.tsx`, verify the Input and Add Button have visible focus indicators (shadcn defaults confirmed).

- [x] Task 3 — Ensure keyboard operability on mark-done and delete (AC: 4, 5)
  - [x] 3.1 The mark-done `<button>` element already responds to Enter/Space natively. Verified with test.
  - [x] 3.2 The delete `<Button>` (shadcn) already responds to Enter/Space natively. Verified with test.
  - [x] 3.3 Add tests in `TodoItem.test.tsx`: verify mark-done and delete are focusable semantic buttons (native keyboard operability guaranteed).

- [x] Task 4 — Focus management after delete (AC: 1)
  - [x] 4.1 After a todo is deleted, focus moves to the next todo's mark-done button (or previous if last item). If no remaining todos, focus moves to the input field.
  - [x] 4.2 Pass `inputRef` from `HomePage.tsx` → `TodoInput` and `TodoList` for shared focus management.

- [x] Task 5 — Run full test suite (AC: 7)
  - [x] 5.1 Run `npm run test --workspace=frontend` — zero failures (76 tests).

## Dev Notes

### UX Spec — Keyboard Navigation

From UX spec (Accessibility Strategy section):

| Interaction              | Keyboard                                      |
| ------------------------ | --------------------------------------------- |
| Add task                 | Enter (from input)                            |
| Navigate task list       | Tab (top to bottom)                           |
| Complete task            | Space or Enter (when complete button focused) |
| Delete task              | Space or Enter (when delete button focused)   |
| Toggle completed section | Space or Enter (when toggle focused)          |
| Dismiss toast            | Escape (or auto-dismissed after 4s)           |

No focus traps — there are no modals or overlays (QuoteModal uses Dialog which handles its own focus trapping via Radix).

### UX Spec — Focus Management Rules

- Focus management: after task deletion → focus moves to next task (or input if last); after completion → focus returns to input
- `tabIndex` is only `0` or `-1` — no positive `tabIndex` values
- All `<button>` elements have visible text or `aria-label`

### Architecture — Code Patterns

- React components: `PascalCase`; hooks: `camelCase` with `use` prefix
- Styling: Tailwind CSS utility classes exclusively
- Tests: co-located `*.test.tsx`

### Current State

- Enter-to-submit already works in `TodoInput.tsx` (AC 3 already met)
- `<button>` elements natively handle Enter/Space — ACs 4, 5 likely already met
- `aria-label` already on mark-done ("Mark as done") and delete ("Delete todo") buttons
- Main gap: focus return to input after submit, visible focus indicators, focus after delete

### Scope Boundary

| Concern                          | This story | Later story |
| -------------------------------- | ---------- | ----------- |
| Focus indicators                 | ✅         | —           |
| Focus return after add           | ✅         | —           |
| Focus management after delete    | ✅         | —           |
| Keyboard Enter/Space operability | ✅         | —           |
| Screen reader / ARIA labels      | ❌         | Story 5.3   |
| Color contrast                   | ❌         | Story 5.4   |

### Previous Story Intelligence (Story 5.1)

- Added `min-h-[44px] min-w-[44px]` touch targets to all interactive elements
- Mark-done button restructured: outer `<button>` with 44×44px, inner `<span>` for visual circle
- 72 tests passing

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- FR25: All interactive elements operable via keyboard navigation
- NFR12: All interactive elements keyboard-navigable with visible focus indicators

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Added `useRef` + focus-return logic to `TodoInput.tsx` after submit
- Added `inputRef` prop to `TodoInput` to share ref with parent for focus management
- Converted `TodoItem` to `forwardRef` so `TodoList` can track item refs for post-delete focus
- Added `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-950` to mark-done button
- Implemented focus-after-delete in `TodoList`: moves focus to next/prev item or input
- `HomePage` creates shared `inputRef` passed to both `TodoInput` and `TodoList`
- All 76 tests pass (10 test files)

### File List

- frontend/src/components/TodoInput.tsx (modified — useRef, inputRef prop, focus return after submit)
- frontend/src/components/TodoInput.test.tsx (modified — added focus return test)
- frontend/src/components/TodoItem.tsx (modified — forwardRef, focus-visible ring styles)
- frontend/src/components/TodoItem.test.tsx (modified — added keyboard focusability + focus-visible tests)
- frontend/src/components/TodoList.tsx (modified — inputRef prop, focus-after-delete logic, item refs)
- frontend/src/pages/HomePage.tsx (modified — shared inputRef passed to TodoInput + TodoList)
