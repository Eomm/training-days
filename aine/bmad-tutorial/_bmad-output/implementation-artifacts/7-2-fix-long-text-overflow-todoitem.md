# Story 7.2: Fix Long Text Overflow in TodoItem

Status: review

## Story

As a **user**,
I want todo items with long text to display correctly without breaking the layout,
so that the UI remains usable regardless of text length.

## Acceptance Criteria

1. **Given** a todo item with very long text (no spaces or very few word breaks)
   **When** it is rendered in the todo list
   **Then** the text wraps within the item boundaries and does not overflow or push buttons off-screen

2. **Given** a todo item with long text containing normal word breaks
   **When** it is rendered
   **Then** the text wraps naturally at word boundaries

3. **Given** the fix is applied
   **When** existing unit tests run
   **Then** all tests continue to pass (no regressions)

## Tasks / Subtasks

- [x] Task 1: Add overflow/word-break handling to TodoItem text span (AC: #1, #2)
  - [x] 1.1 Add `min-w-0` to the flex row container so flex children can shrink below content size
  - [x] 1.2 Add `break-words` (Tailwind) to the text span for word-break control
- [x] Task 2: Add unit test for long text rendering (AC: #1, #3)
  - [x] 2.1 Add a test that renders TodoItem with a long unbroken string and asserts it renders without overflow

## Dev Notes

- **Root cause**: The `<div className="flex items-center gap-3">` row doesn't have `min-w-0`, so the text `<span className="flex-1">` cannot shrink below its intrinsic content width. Long unbroken strings force the flex item to expand, pushing the delete button off-screen.
- **Fix**: Add `min-w-0` to the flex row div + `break-words` to the text span.
- **File**: `frontend/src/components/TodoItem.tsx`

## Dev Agent Record

### Agent Model Used

### Completion Notes List

- Added `min-w-0` to flex row container and `break-words` + `min-w-0` to text span in TodoItem
- Added unit test verifying long unbroken text renders with overflow-safe CSS classes
- All 104 unit tests pass, lint clean

### File List

- frontend/src/components/TodoItem.tsx (modified)
- frontend/src/components/TodoItem.test.tsx (modified)
