# Test Automation Summary

**Generated**: 2026-03-02
**Framework**: Playwright (Chromium)
**Runner**: `npm run test:e2e --workspace=frontend`

## Generated Tests

### E2E Tests

| File                             | Tests | Description                                                                     |
| -------------------------------- | ----- | ------------------------------------------------------------------------------- |
| `e2e/guest-identity.spec.ts`     | 3     | Guest identity creation, reuse across visits, loading state                     |
| `e2e/todo-crud.spec.ts`          | 9     | Add (button + Enter), empty state, mark done + quote, delete, persist, ordering |
| `e2e/registration-nudge.spec.ts` | 3     | Nudge threshold (5+ todos), dismissal, session persistence                      |
| `e2e/visual-aging.spec.ts`       | 2     | Aging background classes (grace window), staleness prompt                       |
| `e2e/accessibility.spec.ts`      | 7     | Skip link, ARIA roles/labels, focus management on delete, modal Escape          |

**Total: 24 E2E tests — all passing**

## Coverage

### UI Features: 11/11 covered

- [x] Guest identity auto-creation (POST /guest)
- [x] Identity reuse across visits (localStorage)
- [x] Empty state ("Nothing here yet")
- [x] Add todo (button click)
- [x] Add todo (Enter key)
- [x] Mark todo as done + motivational quote modal
- [x] Delete todo (optimistic removal)
- [x] Todo persistence across reloads
- [x] Newest-first ordering
- [x] Registration nudge at 5+ active todos (show/dismiss/session memory)
- [x] Visual aging backgrounds + staleness prompt

### Accessibility: 7/7 covered

- [x] Skip-to-content link
- [x] ARIA role="list" + aria-label on todo list
- [x] Descriptive aria-labels on mark-complete buttons
- [x] Descriptive aria-labels on delete buttons
- [x] Focus moves to next item after delete
- [x] Focus returns to input after deleting last item
- [x] Modal focus trap + Escape to dismiss

### API Endpoints (exercised E2E): 5/5

- [x] `GET /health` (Playwright webServer health check)
- [x] `POST /guest` (guest identity creation)
- [x] `GET /todos` (list todos)
- [x] `POST /todos` (create todo)
- [x] `PATCH /todos/:id` (mark done)
- [x] `DELETE /todos/:id` (delete todo)

## Infrastructure

- **Shared identity per file**: `beforeAll` creates one guest via API; `beforeEach` cleans todos and injects userId via `addInitScript` — avoids POST /guest rate limiting
- **DOM stability**: `waitForResponse` ensures optimistic UI has settled before assertions
- **Rate limit bypass**: backend `RATE_LIMIT_MAX` env var set to 10000 in Playwright webServer config
- **Prerequisites**: PostgreSQL running via `docker compose up -d postgres`

## Running the Tests

```bash
# Start PostgreSQL
docker compose up -d postgres

# Push DB schema (first time)
DATABASE_URL="postgres://motivatodo:motivatodo@localhost:5432/motivatodo" npm run db:push --workspace=backend

# Run E2E tests (auto-starts frontend + backend dev servers)
npm run test:e2e --workspace=frontend
```

## Next Steps

- Add CI pipeline job for E2E tests (requires Docker for PostgreSQL)
- Consider adding error-state tests (mock API failures via route interception)
- Add more edge cases as features evolve
