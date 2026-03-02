# Story 5.5: Error State & Registration Nudge

Status: done

## Story

As a **user**,
I want to see a clear error message when the backend is unavailable, and a gentle prompt to register after I've added several tasks,
So that I trust the app handles problems gracefully and know how to make my data permanent.

## Acceptance Criteria

1. **Given** the backend API is unreachable, **When** the app attempts to load todos or perform any mutation, **Then** a clear, non-technical error message is displayed (NFR16, e.g. "Couldn't connect — your tasks are safe. Please try again.").
2. The error state does not crash the app or show a blank screen.
3. A "Retry" button in the error banner triggers a fresh fetch and clears the error.
4. **Given** a user has 5 or more active todos, **When** the todo list renders, **Then** a non-intrusive dismissible nudge to register is shown.
5. The nudge does not block or interrupt the core todo workflow.
6. Dismissing the nudge removes it for the current session (stored in `sessionStorage`).
7. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Add `retryFetch` to `useTodos` hook (AC: 3)
  - [x] 1.1 Added `fetchKey` counter state to `useTodos`; included in `useEffect` dependency array.
  - [x] 1.2 Exposed `retryFetch: () => void` from the hook (increments `fetchKey` via `useCallback`).
  - [x] 1.3 Added `clearError: () => void` for manual error dismissal.

- [x] Task 2 — Error banner in `HomePage` (AC: 1, 2, 3)
  - [x] 2.1 Consuming `error`, `retryFetch` from `useTodos` in `HomePage.tsx`.
  - [x] 2.2 Renders error banner with `role="alert"` when `error` is non-null.
  - [x] 2.3 Banner copy: "Couldn’t connect — your tasks are safe. Please try again."
  - [x] 2.4 Banner includes a "Retry" button that calls `retryFetch`.

- [x] Task 3 — Registration nudge component (AC: 4, 5, 6)
  - [x] 3.1 Created `frontend/src/components/RegistrationNudge.tsx`.
  - [x] 3.2 Component accepts `todoCount: number`; renders nothing if `todoCount < 5`.
  - [x] 3.3 Dismissal stored in `sessionStorage` key `'nudge-dismissed'`; survives re-renders but clears on tab close.
  - [x] 3.4 Dismiss button has `aria-label="Dismiss registration prompt"`.
  - [x] 3.5 Added `<RegistrationNudge>` to `HomePage.tsx` below `TodoInput`, counts active (non-done) todos.

- [x] Task 4 — Tests (AC: 7)
  - [x] 4.1 Added `retryFetch` coverage test to `useTodos.test.ts`: verifies re-fetch after error clears error state and loads todos.
  - [x] 4.2 Created `RegistrationNudge.test.tsx` with 9 tests (null < 5 todos, renders at 5+, dismiss interaction, sessionStorage persistence, role=status).
  - [x] 4.3 Updated `HomePage.test.tsx` with 2 new tests: error banner render + Retry button present (using pre-seeded localStorage identity).
  - [x] 4.4 Run `npm run test --workspace=frontend` — 101 tests passing across 12 test files.

## Dev Notes

### Error Copy (from UX spec)

> "Couldn't connect — your tasks are safe, please try again" is more important than the technical cause.

No technical HTTP status or stack trace should be shown to the user.

### Registration Nudge Design

- Placed immediately below the input, above the task list
- Non-modal — does not block interactions
- Subtle: `bg-zinc-50 border-zinc-200` and small text
- Dismissed state stored in `sessionStorage` so it reappears on new browser sessions
- Threshold: 5 active (non-done) todos

### `useTodos` retryFetch Pattern

```typescript
const [fetchKey, setFetchKey] = useState(0);
const retryFetch = useCallback(() => setFetchKey((k) => k + 1), []);
// useEffect deps: [userId, fetchKey]
```
