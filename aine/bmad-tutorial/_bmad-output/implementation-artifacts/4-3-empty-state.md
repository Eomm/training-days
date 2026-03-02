# Story 4.3: Empty State

Status: done

## Story

As a **new user**,
I want to see a clear invitation to add my first task when my list is empty,
So that the purpose of the app is immediately obvious with no confusion.

## Acceptance Criteria

1. **Given** the user has no todos, **When** the todo list renders, **Then** an empty state UI is displayed with the text: _"Nothing here yet. Add your first task above."_
2. The empty state replaces the todo list container entirely — no `<ul>` is rendered.
3. The add-todo input field remains visible and accessible when the empty state is shown.
4. The empty state text uses `text-sm text-zinc-400 text-center mt-8` styling per UX specification.
5. No illustration, icon, or onboarding wizard is shown in the empty state.
6. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Update empty state text and styling in TodoList.tsx (AC: 1, 2, 4, 5)
  - [x] 1.1 Update empty state message from "No tasks yet. Add one above!" to "Nothing here yet. Add your first task above."
  - [x] 1.2 Update styling to `text-sm text-zinc-400 text-center mt-8` per UX spec

- [x] Task 2 — Update existing test for empty state in TodoList.test.tsx (AC: 1, 6)
  - [x] 2.1 Update the "renders empty state message when no todos" test to match new text
  - [x] 2.2 Run tests — all pass (65 tests)

## Dev Notes

### UX Specification

From `ux-design-specification.md` — Empty States & Loading States:

- Input field auto-focused
- Below input: `"Nothing here yet. Add your first task above."` — `text-sm text-zinc-400 text-center mt-8`
- No illustration, no icon, no onboarding wizard

### Current Implementation

The empty state already exists in `TodoList.tsx` with slightly different text ("No tasks yet. Add one above!") and uses `text-gray-400` instead of `text-zinc-400`. The structure is correct — it replaces the `<ul>` entirely. Only text content and class name need updating.

### Scope Boundary

| Concern                    | This story | Later story |
| -------------------------- | ---------- | ----------- |
| Empty state text + styling | ✅         | —           |
| Input auto-focus           | ❌         | Story 5.2   |
| Error state UI             | ❌         | Story 5.5   |

### References

- FR11: "Empty state UI is displayed with a clear affordance to add the first item"
- UX spec: "Nothing here yet. Add your first task above." — text-sm text-zinc-400 text-center mt-8
- Epics story 4.3: empty state replaces todo list, input remains visible

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Updated empty state text to match UX spec exactly
- Changed text-gray-400 to text-zinc-400 for consistency with design system
- Added text-sm class per UX spec
- All 65 frontend tests pass (10 test files)

### File List

- frontend/src/components/TodoList.tsx (modified — empty state text + styling)
- frontend/src/components/TodoList.test.tsx (modified — updated empty state text assertion)
