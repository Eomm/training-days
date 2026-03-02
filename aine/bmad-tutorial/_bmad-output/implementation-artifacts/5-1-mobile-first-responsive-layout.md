# Story 5.1: Mobile-First Responsive Layout

Status: done

## Story

As a **mobile user**,
I want the app to be fully usable with one hand on a phone,
So that I can capture tasks quickly in real-world time-constrained scenarios.

## Acceptance Criteria

1. **Given** the app is opened on a mobile viewport (320px–768px width), **When** the page loads, **Then** the todo input and list are fully visible without horizontal scrolling.
2. All interactive elements (input, add button, complete button, delete button) have touch targets of at least 44×44px (FR23).
3. The add-todo input field is always visible without scrolling, anchored near the top of the viewport.
4. **Given** the app is opened on a desktop viewport (> 768px), **When** the page loads, **Then** the layout is fully functional with a comfortable reading width (FR24).
5. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Apply mobile-first responsive wrapper to HomePage (AC: 1, 3, 4)
  - [x] 1.1 Update the outer `<div>` in `HomePage.tsx` to use mobile-first responsive classes: `w-full px-4 lg:max-w-lg lg:mx-auto` per UX spec. Remove the current `max-w-xl mx-auto p-8` which uses fixed padding unsuitable for small screens.
  - [x] 1.2 Ensure padding is `py-4` on mobile (compact) and `py-8` on desktop via `py-4 lg:py-8`.
  - [x] 1.3 Verify no horizontal overflow on 320px viewport width.

- [x] Task 2 — Enforce 44×44px minimum touch targets on all interactive elements (AC: 2)
  - [x] 2.1 In `TodoItem.tsx`, update the mark-done circle button to have `min-h-[44px] min-w-[44px]` on the outer `<button>` element (not the icon). Keep the visual circle at `w-5 h-5` but ensure the tappable area is 44×44px using padding or sizing on the button itself.
  - [x] 2.2 In `TodoItem.tsx`, update the delete button to have `min-h-[44px] min-w-[44px]` on the outer `<Button>` element.
  - [x] 2.3 In `TodoInput.tsx`, ensure the Add button has `min-h-[44px] min-w-[44px]` touch target size.
  - [x] 2.4 In `TodoInput.tsx`, ensure the input field has `min-h-[44px]`.

- [x] Task 3 — Update existing tests and add responsive layout tests (AC: 5)
  - [x] 3.1 Update `HomePage.test.tsx` to verify the responsive wrapper classes are applied.
  - [x] 3.2 Ensure all existing tests still pass after layout changes.
  - [x] 3.3 Run full frontend test suite (`npm run test --workspace=frontend`) — zero failures.

## Dev Notes

### Architecture & UX Requirements

**Responsive Strategy** (from UX spec — Responsive Design & Accessibility):

- Mobile-first, single-column layout on ALL screen sizes
- Single breakpoint pattern: `w-full px-4 lg:max-w-lg lg:mx-auto` on main content wrapper
- Only `lg:` prefix (1024px+) needed for layout — avoid `sm:` and `md:` on structural classes
- All font sizes in `rem` (Tailwind defaults) — never `px` for text
- Touch targets: `min-h-[44px] min-w-[44px]` on the outer interactive element, not the icon

**Breakpoint Strategy** (from UX spec):

| Breakpoint    | Width      | Layout change                                            |
| ------------- | ---------- | -------------------------------------------------------- |
| Base (mobile) | 0 — 1023px | Full-width column, `px-4` gutters, delete always visible |
| `lg`          | 1024px+    | Content centred `max-w-lg`, delete on-hover only         |

**Current Implementation** (from `HomePage.tsx`):

```tsx
<div className="flex flex-col items-center gap-4 p-8 max-w-xl mx-auto">
```

This needs to change to:

```tsx
<div className="flex flex-col items-center gap-4 py-4 lg:py-8 w-full px-4 lg:max-w-lg lg:mx-auto">
```

**TouchItem targets** (from `TodoItem.tsx`):

- Mark-done button: Currently `w-5 h-5` — needs outer element to be 44×44px tappable area
- Delete button: Currently uses shadcn `Button` with `size="icon"` — verify it meets 44×44px, add `min-h-[44px] min-w-[44px]` if needed

**TodoInput** (from `TodoInput.tsx`):

- Add button: shadcn `Button` default — add `min-h-[44px] min-w-[44px]`
- Input field: shadcn `Input` default — add `min-h-[44px]`

### Naming Conventions

- React components: `PascalCase` — `TodoItem.tsx`, `HomePage.tsx`
- Styling: Tailwind CSS utility classes exclusively — no CSS modules, no inline styles
- Co-located tests: `*.test.tsx` next to source files

### Scope Boundary

| Concern                          | This story | Later story |
| -------------------------------- | ---------- | ----------- |
| Responsive wrapper layout        | ✅         | —           |
| Touch target sizing              | ✅         | —           |
| Delete hover-only on desktop     | ✅         | —           |
| Keyboard navigation & focus      | ❌         | Story 5.2   |
| Screen reader / ARIA             | ❌         | Story 5.3   |
| Color contrast WCAG              | ❌         | Story 5.4   |
| Error state / registration nudge | ❌         | Story 5.5   |

### Previous Story Intelligence (Story 4.3)

- Last story was a small text/styling update — simple in-place changes
- All 65 frontend tests were passing after epic 4 completion
- Pattern: update component → update corresponding test → run full suite

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- FR23: Mobile one-handed layout — all touch targets ≥ 44×44px
- FR24: Desktop fully functional — comfortable reading width

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Applied mobile-first responsive wrapper: `w-full px-4 lg:max-w-lg lg:mx-auto` with `py-4 lg:py-8`
- Updated mark-done button in TodoItem to use outer 44×44px tap target with inner 20×20px visual circle
- Added `min-h-[44px] min-w-[44px]` to delete button, add button, and input field
- Added responsive wrapper test to HomePage.test.tsx
- All 72 tests pass (10 test files)

### File List

- frontend/src/pages/HomePage.tsx (modified — responsive wrapper classes)
- frontend/src/pages/HomePage.test.tsx (modified — added responsive class test)
- frontend/src/components/TodoItem.tsx (modified — 44×44px touch targets on mark-done and delete buttons)
- frontend/src/components/TodoInput.tsx (modified — 44×44px touch targets on input and add button)
