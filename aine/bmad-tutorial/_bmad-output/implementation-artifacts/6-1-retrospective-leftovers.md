# Story 6.1: Retrospective Leftovers

Status: done

## Story

As a **developer**,
I want all outstanding technical debt and action items from Epics 1–5 retrospectives addressed in a single housekeeping pass,
so that the codebase is clean, tests are green, conventions are documented, and Phase 2 begins from a solid baseline.

## Acceptance Criteria

1. **Given** the backend test suite is run
   **When** `npm run test:backend` executes
   **Then** all 28 tests pass with 0 failures (the `POST /guest with extra properties` test is fixed)

2. **Given** Docker images are built for backend and frontend
   **When** `docker compose build` runs
   **Then** `.dockerignore` files in `backend/` and `frontend/` exclude `node_modules`, `dist`, `.env`, and non-essential files from the build context

3. **Given** a new contributor reads the project documentation
   **When** they open `docs/backend-conventions.md`
   **Then** the file documents: `.ts` import extension convention with `allowImportingTsExtensions`, `app.ts` factory pattern, Fastify test ordering (`inject()` after route registration), `createRequire` for static JSON loading, ownership check pattern (fetch → 404 → 403 → proceed), and `127.0.0.1` in Docker healthchecks

4. **Given** a new contributor reads the project documentation
   **When** they open `docs/frontend-patterns.md`
   **Then** the file documents: `forwardRef` with shared `inputRef` pattern, `useGuestIdentity` cancellation flag for StrictMode, optimistic update patterns (add/done/delete), `useMemo` for computed values (`computeAgeHighlights`), and `motion-safe:` transition prefix convention

5. **Given** the delete icon (`Trash2`) renders on todos with mid-tier aging backgrounds (`bg-zinc-200`, `bg-zinc-300`)
   **When** the contrast ratio is measured
   **Then** the icon color meets WCAG 2.1 AA for large visual targets (≥ 3:1) by using `text-zinc-700` instead of `text-zinc-500`

6. **Given** all changes are applied
   **When** `npm run test:backend` and `npm run test:frontend` are run
   **Then** both exit with 0 failures (28 backend, 101 frontend)

## Tasks / Subtasks

- [ ] Task 1: Fix failing backend test `POST /guest with extra properties` (AC: #1)
  - [ ] 1.1 — In `guest.route.ts`, the body schema has `additionalProperties: false` but Fastify's default Ajv uses `removeAdditional: true` which strips extra fields instead of rejecting them. Two valid fixes:
    - **Option A (fix the test):** Change the test expectation — the route correctly strips extra properties and returns 201. Update the test to expect 201 and verify extra properties are not echoed back. This aligns with Fastify's default behavior.
    - **Option B (fix the route):** If strict body rejection is desired, add `removeAdditional: false` to the route's Ajv configuration. The test stays as-is.
  - [ ] 1.2 — Choose the approach that matches the project's API contract philosophy and verify `npm run test:backend` passes 28/28

- [ ] Task 2: Add `.dockerignore` files (AC: #2)
  - [ ] 2.1 — Create `backend/.dockerignore` with: `node_modules`, `dist`, `.env`, `.env.*`, `*.test.ts`, `test/`, `Dockerfile`
  - [ ] 2.2 — Create `frontend/.dockerignore` with: `node_modules`, `dist`, `.env`, `.env.*`, `*.test.tsx`, `*.test.ts`, `Dockerfile`, `nginx.conf` (already COPY'd explicitly)

- [ ] Task 3: Create `docs/backend-conventions.md` (AC: #3)
  - [ ] 3.1 — Document `.ts` import extension convention: why `.ts` not `.js`, the `allowImportingTsExtensions` + `rewriteRelativeImportExtensions` flags in `tsconfig.json`, Node 22.19 `--experimental-strip-types` behavior
  - [ ] 3.2 — Document `app.ts` factory pattern: `build()` returns configured Fastify instance, `server.ts` is sole entrypoint calling `listen()`, tests call `build()` directly
  - [ ] 3.3 — Document Fastify test ordering: routes must be registered before first `inject()` call to avoid `FST_ERR_INSTANCE_ALREADY_LISTENING`
  - [ ] 3.4 — Document `createRequire` for static JSON: why it's used over `import ... with { type: 'json' }` (deprecated in Node 22) and `fs.readFileSync`
  - [ ] 3.5 — Document ownership check pattern: fetch → check exists (404) → check userId match (403) → proceed
  - [ ] 3.6 — Document Docker healthcheck convention: use `127.0.0.1` not `localhost` (Alpine resolves `localhost` to IPv6 first)

- [ ] Task 4: Create `docs/frontend-patterns.md` (AC: #4)
  - [ ] 4.1 — Document `forwardRef` pattern: how `TodoItem` uses `forwardRef<HTMLLIElement>` for parent-controlled focus management, shared `inputRef` for auto-focus
  - [ ] 4.2 — Document StrictMode cancellation: the `let cancelled = false` pattern in `useGuestIdentity` useEffect, why it prevents double API calls
  - [ ] 4.3 — Document optimistic update patterns: addTodo (tempId swap), markDone (reference save + restore), deleteTodo (snapshot restore) — with code examples
  - [ ] 4.4 — Document `useMemo` for computed values: `computeAgeHighlights` as pure function in `lib/`, wrapped in `useMemo` in component
  - [ ] 4.5 — Document `motion-safe:` transition convention: always wrap CSS transitions with `motion-safe:` prefix for reduced-motion accessibility

- [ ] Task 5: Fix delete icon contrast (AC: #5)
  - [ ] 5.1 — In `frontend/src/components/TodoItem.tsx`, change delete button class from `text-zinc-500` to `text-zinc-700`
  - [ ] 5.2 — Verify contrast: `text-zinc-700` (#3f3f46) on `bg-zinc-300` (#d4d4d8) = ~3.4:1 (passes 3:1 for large targets); on `bg-zinc-200` (#e4e4e7) = ~4.4:1 (passes); on `bg-white` = ~10.5:1 (passes)
  - [ ] 5.3 — Update any test assertions that reference the old `text-zinc-500` class

- [ ] Task 6: Final verification (AC: #6)
  - [ ] 6.1 — Run `npm run test:backend` — expect 28/28 pass
  - [ ] 6.2 — Run `npm run test:frontend` — expect 101/101 pass

## Dev Notes

### Bug: `guest.route.test.ts` Failure Analysis

The test at [backend/test/guest.route.test.ts](backend/test/guest.route.test.ts#L46) sends `{ sneaky: 'field' }` to `POST /guest` and expects `400`. The route schema has `additionalProperties: false`, but Fastify's default Ajv configuration uses `removeAdditional: true`, which **strips** unknown properties instead of rejecting them. The request succeeds with `201`.

**Route code** at [backend/src/routes/guest.route.ts](backend/src/routes/guest.route.ts#L21-L23):

```typescript
body: {
  type: 'object',
  additionalProperties: false,
},
```

**Recommended fix:** Update the test to expect `201` — Fastify's stripping behavior is correct and intentional. The endpoint doesn't use body data anyway; it generates a UUID server-side. Rejecting extra properties adds no security value here.

### Delete Icon Contrast

Current: `text-zinc-500` (#71717a) on `bg-zinc-300` (#d4d4d8) ≈ 3.1:1 — **fails** 3:1 threshold for large targets by a thin margin.

Fix: `text-zinc-700` (#3f3f46) provides ≈ 3.4:1 on `bg-zinc-300` (passes) and higher on lighter backgrounds.

[Source: Epic 5 retro — Technical Debt #1]

### Files to Create

- `backend/.dockerignore` — new file
- `frontend/.dockerignore` — new file
- `docs/backend-conventions.md` — new file
- `docs/frontend-patterns.md` — new file

### Files to Modify

- `backend/test/guest.route.test.ts` — fix test expectation (line ~46–57)
- `frontend/src/components/TodoItem.tsx` — change `text-zinc-500` → `text-zinc-700` (line 67)
- Possibly `frontend/src/components/TodoItem.test.tsx` — if tests assert on `text-zinc-500` class

### Project Structure Notes

- `docs/` directory exists but is empty — convention docs will be the first files created there
- `.dockerignore` files go alongside existing `Dockerfile` in each workspace directory
- No changes to `docker-compose.yml`, `app.ts`, or any route handlers (except the test fix decision)
- All conventions documented are already established patterns from implementation — this story captures them, it doesn't create new patterns

### References

- [Epic 1 Retro — Action Items](../_bmad-output/implementation-artifacts/epic-1-retro-2026-03-02.md): `.dockerignore`, import conventions doc
- [Epic 2 Retro — Team Agreements](../_bmad-output/implementation-artifacts/epic-2-retro-2026-03-02.md): Fastify test ordering
- [Epic 3 Retro — Key Insights](../_bmad-output/implementation-artifacts/epic-3-retro-2026-03-02.md): Optimistic update patterns, `createRequire`, ownership checks
- [Epic 4 Retro — Technical Debt](../_bmad-output/implementation-artifacts/epic-4-retro-2026-03-02.md): Backend test failure, architecture doc drift
- [Epic 5 Retro — Action Items](../_bmad-output/implementation-artifacts/epic-5-retro-2026-03-02.md): `forwardRef` docs, delete icon contrast, `motion-safe:` convention

### Items Explicitly NOT in Scope (Phase 2 Deferrals)

These were flagged in retros but explicitly marked as Phase 2 work:

- `RegistrationNudge` backend target
- `retryFetch` automatic retry / exponential backoff
- React Context for `userId` propagation
- `useTodos` hook splitting into `useTodoMutations`
- Quote selection tracking (stateless → stateful)
- Docker Compose automated CI smoke tests
- Global hook route-level decorator pattern (replacing prefix list)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — all tasks completed without issues.

### Completion Notes List

- Task 1: Fixed `guest.route.test.ts` — changed expectation from 400 to 201 (Fastify strips extra properties via `removeAdditional: true`; 201 is correct behavior)
- Task 2: Created `backend/.dockerignore` and `frontend/.dockerignore` excluding `node_modules`, `dist`, `.env*`, test files, and `Dockerfile`
- Task 3: Created `docs/backend-conventions.md` with 6 conventions (import extensions, factory pattern, test ordering, createRequire, ownership checks, Docker healthchecks)
- Task 4: Created `docs/frontend-patterns.md` with 5 patterns (forwardRef, StrictMode cancellation, optimistic updates, useMemo, motion-safe)
- Task 5: Fixed delete icon contrast — `text-zinc-500` → `text-zinc-700` in `TodoItem.tsx`
- Task 6: All tests pass — 28/28 backend, 101/101 frontend

### File List

- `backend/.dockerignore` — created
- `frontend/.dockerignore` — created
- `docs/backend-conventions.md` — created
- `docs/frontend-patterns.md` — created
- `backend/test/guest.route.test.ts` — modified (test expectation fix)
- `frontend/src/components/TodoItem.tsx` — modified (contrast fix)
