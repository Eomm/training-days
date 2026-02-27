---
stepsCompleted:
  [
    step-01-init,
    step-02-context,
    step-03-starter,
    step-04-decisions,
    step-05-patterns,
    step-06-structure,
    step-07-validation,
    step-08-complete,
  ]
inputDocuments: ["_bmad-output/planning-artifacts/prd.md"]
workflowType: "architecture"
status: "complete"
completedAt: "2026-02-27"
project_name: "MotivaTodo"
user_name: "Nearformer"
date: "2026-02-27"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
27 FRs across 5 capability areas: Task Management (FR1–FR6), Task List Display (FR7–FR11),
Identity & Session Management (FR12–FR16), Backend API (FR17–FR21), Application Experience (FR22–FR27).
Core loop: anonymous user creation → CRUD todos → visual aging + motivational quote on completion.

**Non-Functional Requirements:**
17 NFRs across Performance, Security, Scalability, Accessibility, Reliability.
Critical drivers for architecture:

- NFR1–NFR4: < 400ms load, < 200ms API p95, < 50ms perceived UI response (requires optimistic updates)
- NFR5–NFR8: HTTPS only, cryptographically random IDs, no PII, strict per-user data isolation
- NFR9–NFR10: Stateless backend, horizontally scalable
- NFR11–NFR14: WCAG 2.1 AA across all UI states including highlight graduation tiers
- NFR15–NFR17: 99.5% uptime target, graceful degradation, durable writes

**Scale & Complexity:**

- Primary domain: Full-stack web (SPA + REST API)
- Complexity level: Low
- Estimated architectural components: 4 (SPA frontend, REST API backend, relational data store, static quotes asset)

### REST API Surface

| Method   | Endpoint     | Purpose                                                                                                                                          |
| -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST`   | `/guest`     | Create anonymous user. Returns `{ userId: "<uuid>" }`. Backend stores `id`, `created_at`, `type: "guest"`. Client stores userId in localStorage. |
| `GET`    | `/todos`     | Retrieve all todos for requesting user (userId via header)                                                                                       |
| `POST`   | `/todos`     | Create new todo for requesting user                                                                                                              |
| `PATCH`  | `/todos/:id` | Update todo (mark done, edit text) — ownership validated                                                                                         |
| `DELETE` | `/todos/:id` | Delete todo — ownership validated                                                                                                                |

**Identity flow:** On first load, client checks localStorage for userId. If absent, calls `POST /guest`, stores returned UUID. All subsequent requests send userId (e.g., `X-User-Id` header). Backend validates userId exists and owns the resource on every CRUD operation.

### Static Assets

**Motivational quotes:** Stored as a static JSON file (e.g., `quotes.json`) bundled with the backend or served as a static frontend asset. Minimum 100 quotes. Selected randomly on todo completion — no DB involvement.

### Technical Constraints & Dependencies

- Online-only — no offline mode, no service worker
- No authentication in MVP (no passwords, no sessions, no JWT) — userId IS the credential
- UX spec not available — UX intent derived from PRD user journeys and FRs
- No external API dependencies at MVP (quotes are local)

### Cross-Cutting Concerns Identified

1. **Optimistic UI updates** — Frontend must apply state changes locally before API confirmation; rollback on failure. Affects every mutation (add, complete, delete).
2. **Anonymous identity lifecycle** — `POST /guest` is the single entry point; localStorage is the persistence layer for the client. Design must handle localStorage-cleared edge case gracefully (re-issue guest ID, data unrecoverable — expected behavior).
3. **Visual aging algorithm** — Client-side computation over the current todo list's age distribution. Stateful: recalculates on every list render. Must handle edge cases: single item, all items same age, empty list.
4. **Per-user data isolation** — Every backend endpoint must verify the requesting userId owns the target resource. No cross-user data leakage (NFR8).
5. **Backend security posture** — Rate limiting (especially `POST /guest`), input sanitization on todo text, strict CORS policy, security headers (helmet-style), no stack traces in production error responses, UUID non-enumerability enforced at data layer.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web: SPA frontend (React 19 + Vite 7) + REST API backend (Fastify 5) + relational database (PostgreSQL 18).
Both services are TypeScript. Deployed via Docker Compose (3 containers: frontend, backend, postgres).

### Repository Structure

Monorepo — two sub-projects in one repository:

```
motivatodo/
├── frontend/          # Vite 7 + React 19 + shadcn
├── backend/           # Fastify 5 + Drizzle ORM
├── docker-compose.yml # Orchestrates all 3 containers
└── README.md
```

### Frontend — Vite 7 + React 19 + TypeScript + shadcn/ui

**Initialization Commands:**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npx shadcn@latest init
```

**Architectural Decisions Provided:**

| Concern           | Decision                                                                           |
| ----------------- | ---------------------------------------------------------------------------------- |
| Language          | TypeScript (strict mode)                                                           |
| Build tooling     | Vite 7.3.1 — HMR, Rollup production build, < 400ms dev start                       |
| UI framework      | React 19.2.4 — concurrent features, server actions ready                           |
| Component library | shadcn/ui 3.8.5 — Radix UI primitives + Tailwind CSS, fully accessible             |
| Styling           | Tailwind CSS (bundled with shadcn) — utility-first, no runtime overhead            |
| Code organization | `src/components/`, `src/hooks/`, `src/lib/`, `src/pages/`                          |
| State management  | React built-in (useState, useReducer, Context) — sufficient for low-complexity SPA |
| HTTP client       | Native `fetch` API with custom hooks — no extra dependency for simple CRUD         |

**Key frontend patterns for MotivaTodo:**

- Optimistic updates via local state mutation before `await fetch(...)` — rollback on error
- userId read from localStorage on app mount; if absent, call `POST /guest` and store result
- Visual aging algorithm runs in a `useMemo` hook over the sorted todo list on every render

### Backend — Fastify 5 + TypeScript + Drizzle ORM

**Initialization Commands:**

```bash
mkdir backend && cd backend
npm init -y
npm install fastify@5 @fastify/cors @fastify/helmet @fastify/rate-limit drizzle-orm postgres
npm install -D typescript @types/node tsx drizzle-kit
npx tsc --init
```

**Architectural Decisions Provided:**

| Concern             | Decision                                                                     |
| ------------------- | ---------------------------------------------------------------------------- |
| Language            | TypeScript (strict mode)                                                     |
| Runtime             | Node.js LTS                                                                  |
| Framework           | Fastify 5.7.4 — schema-based validation, Pino logging, plugin architecture   |
| Request validation  | JSON Schema via Fastify's built-in validation (TypeBox or plain JSON Schema) |
| ORM / query builder | Drizzle ORM 0.45.1 — TypeScript-first, zero-dependency, ~7.4kb               |
| Migrations          | Drizzle Kit (`drizzle-kit generate`, `drizzle-kit migrate`)                  |
| Security plugins    | `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`                    |
| Code organization   | `src/routes/`, `src/plugins/`, `src/db/schema.ts`, `src/db/migrations/`      |

**Key backend patterns for MotivaTodo:**

- Every route (except `POST /guest`) validates `X-User-Id` header — preHandler hook checks userId exists in DB
- `POST /guest` is the only unauthenticated endpoint
- Rate limiting on `POST /guest` (e.g., 10 requests/minute per IP) to prevent UUID farming
- `quotes.json` loaded into memory at startup; random selection on todo completion response (no DB query)

### Database Schema (Drizzle)

```typescript
// src/db/schema.ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  type: text("type").notNull().default("guest"), // 'guest' | 'registered'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### Docker Setup

**`backend/Dockerfile`** — multi-stage: compile TS → run Node
**`frontend/Dockerfile`** — multi-stage: Vite build → serve with nginx
**`docker-compose.yml`**:

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_DB: motivatodo
      POSTGRES_USER: motivatodo
      POSTGRES_PASSWORD: motivatodo
    ports: ["5432:5432"]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://motivatodo:motivatodo@postgres:5432/motivatodo
    ports: ["3000:3000"]
    depends_on: [postgres]

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:3000
    ports: ["8080:80"]
    depends_on: [backend]
```

> **Note on PostgreSQL 18:** If `postgres:18` is not yet available as a stable Docker image at initialization time, use `postgres:17` as a direct drop-in — no schema changes required.

**Note:** Project initialization using the above commands should be the first implementation story (Story 1 of Epic 1).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Frontend routing: React Router v7
- API error format: Simple `{ statusCode, error, message }`
- Testing strategy: Node built-in test runner (backend), Vitest (frontend)
- Environment config: `--env-file` (backend), `VITE_*` (frontend)

**Important Decisions (Shape Architecture):**

- API documentation: @fastify/swagger + @fastify/swagger-ui (auto-generated from route schemas)

**Deferred Decisions (Post-MVP):**

- Authentication/registration flow
- Cross-device session management

### Frontend Architecture

| Concern             | Decision                                       | Rationale                                                   |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Client-side routing | React Router v7                                | De-facto standard, low complexity, 1-2 routes in MVP        |
| State management    | React built-in (useState, useReducer, Context) | Sufficient for low-complexity SPA — no Redux/Zustand needed |
| Testing             | Vitest + React Testing Library                 | Fast, Vite-native, excellent TS support                     |
| Environment config  | Vite `VITE_*` env vars                         | Built-in to Vite, zero config                               |

### API & Communication Patterns

| Concern           | Decision                                                     | Rationale                                                                        |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Error format      | `{ statusCode: number, error: string, message: string }`     | Simple, readable, maps directly to HTTP status codes                             |
| API documentation | @fastify/swagger + @fastify/swagger-ui                       | Free with schema-driven Fastify routes — schemas already required for validation |
| Rate limiting     | @fastify/rate-limit on all routes; stricter on `POST /guest` | Prevent UUID farming and general abuse                                           |
| CORS              | @fastify/cors (origin: frontend URL only)                    | Restrict cross-origin access to known frontend                                   |
| Security headers  | @fastify/helmet                                              | Covers CSP, HSTS, X-Frame-Options etc. out of the box                            |

### Backend Architecture

| Concern            | Decision                                                     | Rationale                                                                |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Testing            | Node built-in `--test` runner                                | Zero dependency, Node LTS native, no vitest/jest overhead on backend     |
| Environment config | Node `--env-file` flag                                       | Native since Node 20.6, no dotenv dependency needed                      |
| Logging            | Pino (Fastify built-in)                                      | Structured JSON logs, production-ready, zero config                      |
| Migrations         | Drizzle Kit (`drizzle-kit generate` / `drizzle-kit migrate`) | Consistent with Drizzle ORM choice, TypeScript schema as source of truth |

### Infrastructure & Deployment

| Concern            | Decision                                                                   | Rationale                                                |
| ------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| Local dev          | Docker Compose (3 services: postgres, backend, frontend)                   | Single command to run full stack                         |
| Frontend container | nginx alpine serving Vite build output                                     | Minimal image, production-appropriate static serving     |
| Backend container  | Node LTS alpine, multi-stage TS build                                      | Lean production image, no devDependencies in final image |
| Secrets            | Docker Compose `environment:` for local; external secrets manager post-MVP | Sufficient for MVP scope                                 |

### Decision Impact Analysis

**Implementation Sequence:**

1. Initialize monorepo structure (`frontend/`, `backend/`, `docker-compose.yml`)
2. Backend scaffold: Fastify 5 + TypeScript + Drizzle + security plugins + Swagger
3. Database: schema.ts → `drizzle-kit generate` → migration
4. Backend routes: `POST /guest` → todos CRUD (with ownership validation hook)
5. Frontend scaffold: Vite 7 + React 19 + shadcn + React Router v7
6. Frontend identity flow: localStorage userId check → `POST /guest` on first load
7. Frontend todo CRUD with optimistic updates
8. Visual aging algorithm (`useMemo` over sorted list)
9. Motivational quote display on todo completion
10. Dockerfiles + Compose integration and smoke test

**Cross-Component Dependencies:**

- Frontend userId (localStorage) → all backend CRUD routes (`X-User-Id` header)
- `quotes.json` → loaded at backend startup; returned in `PATCH /todos/:id` done response
- Drizzle schema → migration → Postgres container must be healthy before backend starts (`depends_on: postgres`)
- Vite `VITE_API_URL` → must point to backend container hostname in Docker; `localhost:3000` in local dev

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

6 areas where AI agents could make different choices that break compatibility.

### Naming Patterns

**Database Naming Conventions (Drizzle / PostgreSQL):**

- Tables: `snake_case` plural — `users`, `todos`
- Columns: `snake_case` — `user_id`, `created_at`, `done`
- Primary keys: always `id` (UUID)
- Foreign keys: `{table_singular}_id` — `user_id`

**API Naming Conventions:**

- Endpoints: `kebab-case` plural nouns — `/todos`, `/todos/:id`
- Route params: `:id` (never `{id}`)
- Request/response JSON fields: `camelCase` — `userId`, `createdAt`, `isDone`
- Headers: `X-User-Id` (exact casing — all agents must use this exact string)
- HTTP methods map strictly: GET=read, POST=create, PATCH=partial update, DELETE=delete
- `GET /health` → `200 OK` with `{ status: "ok" }` — unauthenticated, no rate limiting, used by Docker Compose `healthcheck:`

**Code Naming Conventions:**

- React components: `PascalCase` files and exports — `TodoItem.tsx`, `export function TodoItem`
- Hooks: `camelCase` prefixed with `use` — `useTodos.ts`, `useGuestIdentity.ts`
- Utility functions: `camelCase` — `computeAgeHighlight`, `selectRandomQuote`
- Backend route files: `kebab-case` — `todos.route.ts`, `guest.route.ts`
- Backend plugin files: `kebab-case` — `auth.plugin.ts`, `rate-limit.plugin.ts`
- Environment variables: `SCREAMING_SNAKE_CASE` — `DATABASE_URL`, `VITE_API_URL`

### Structure Patterns

**Project Organization:**

```
frontend/src/
  components/     # Reusable UI components (TodoItem, QuoteModal)
  hooks/          # Custom React hooks (useTodos, useGuestIdentity, useAgeHighlight)
  lib/            # Pure utilities, no React (computeAgeHighlight, api.ts)
  pages/          # Route-level components (HomePage)
  assets/         # Static assets
  main.tsx        # Entry point
  App.tsx         # Router setup

backend/src/
  routes/         # Fastify route definitions (todos.route.ts, guest.route.ts, health.route.ts)
  plugins/        # Fastify plugins registered via fastify-plugin (db.plugin.ts, auth.plugin.ts)
  db/
    schema.ts     # Drizzle table definitions — single source of truth
    migrations/   # Generated by drizzle-kit — never hand-edited
    index.ts      # DB connection export
  data/
    quotes.json   # Motivational quotes array — loaded at startup
  app.ts          # Fastify app factory (exported for testing)
  server.ts       # Entry point — calls app.ts, calls listen()
```

**Test File Location:**

- Backend: co-located `*.test.ts` next to source file — `todos.route.test.ts`
- Frontend: co-located `*.test.tsx` next to component — `TodoItem.test.tsx`

### Format Patterns

**API Response Format — Success:**

- Return the resource directly (no wrapper object)
- `GET /todos` → `Todo[]`
- `POST /todos` → `Todo`
- `PATCH /todos/:id` → `Todo` (with `quote` field appended when marking done)
- `DELETE /todos/:id` → `204 No Content` (empty body)
- `POST /guest` → `{ userId: string }`
- `GET /health` → `{ status: "ok" }`

**API Response Format — Error:**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Human-readable description"
}
```

- `statusCode` matches the HTTP status code exactly
- `error` is the standard HTTP reason phrase
- `message` is a human-readable description safe to show in UI

**Shared TypeScript types** (duplicated in both frontend and backend — no shared package in MVP):

```typescript
interface Todo {
  id: string; // UUID
  userId: string; // UUID
  text: string;
  done: boolean;
  createdAt: string; // ISO 8601 string
}
```

- All dates: ISO 8601 strings in API (`createdAt: "2026-02-27T09:00:00.000Z"`)
- All IDs: UUID strings (never numbers)

### Communication Patterns

**Identity Flow (strictly ordered — all agents must follow):**

1. App mounts → read `userId` from `localStorage.getItem('motivatodo_user_id')`
2. If absent → `POST /guest` → store `userId` in `localStorage.setItem('motivatodo_user_id', id)`
3. All subsequent API calls → include `X-User-Id: {userId}` header

**localStorage key:** `motivatodo_user_id` — exact string, all agents must use this key.

**Optimistic Update Pattern (all mutations):**

1. Apply change to local state immediately
2. Fire API call (do not await before updating UI)
3. On API error → rollback local state to previous value + show error toast
4. On API success → update local state with server response (source of truth)

### Process Patterns

**Error Handling:**

- Backend: never return stack traces — Fastify's `setErrorHandler` strips them in production
- Backend: all validation errors → 400; auth/ownership failures → 403; not found → 404; server errors → 500
- Frontend: API errors displayed as non-blocking toast notifications (shadcn `Sonner` or similar)
- Frontend: network failures trigger optimistic update rollback + toast

**Loading States:**

- Local loading state per mutation (not global) — `const [isAdding, setIsAdding] = useState(false)`
- Initial todo list fetch: show skeleton loader (shadcn `Skeleton`)
- Optimistic mutations: no spinner — immediate UI update (spinner would contradict < 50ms feel)

**Backend Auth Hook Pattern:**
All routes except `POST /guest` and `GET /health` must register `validateUserIdHook` as a `preHandler`:

- Reads `X-User-Id` header
- Queries DB to verify userId exists
- Returns `403` if not found — never `401` (no login concept in MVP)

**Docker Compose Healthcheck:**

```yaml
backend:
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
    interval: 10s
    timeout: 5s
    retries: 5

frontend:
  depends_on:
    backend:
      condition: service_healthy
```

### Enforcement Guidelines

**All AI Agents MUST:**

- Use `camelCase` for all JSON fields in API requests and responses
- Use `snake_case` for all database column names in Drizzle schema
- Use `X-User-Id` (exact casing) as the user identity header
- Use `motivatodo_user_id` (exact string) as the localStorage key
- Never return stack traces or internal errors from the backend
- Co-locate test files with source files
- Use `app.ts` factory pattern for backend — never call `listen()` in test files
- Return `204` with empty body for DELETE operations
- Apply `validateUserIdHook` to every route except `POST /guest` and `GET /health`
- Implement `GET /health` as an unauthenticated route returning `{ status: "ok" }`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
motivatodo/
├── README.md
├── docker-compose.yml
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── vite.config.ts
│   ├── .env.example               # VITE_API_URL=http://localhost:3000
│   ├── .env.local                 # Local dev values (gitignored)
│   ├── .gitignore
│   ├── index.html
│   ├── Dockerfile
│   ├── nginx.conf                 # nginx config for production container
│   │
│   └── src/
│       ├── main.tsx               # React root mount
│       ├── App.tsx                # React Router setup, identity init
│       ├── types.ts               # Shared TS interfaces: Todo, GuestResponse
│       │
│       ├── lib/
│       │   ├── api.ts             # fetch wrapper — reads VITE_API_URL, attaches X-User-Id
│       │   ├── identity.ts        # localStorage read/write for motivatodo_user_id
│       │   └── computeAgeHighlight.ts   # Visual aging algorithm (pure function)
│       │
│       ├── hooks/
│       │   ├── useGuestIdentity.ts      # FR12–16: init userId on mount, call POST /guest if absent
│       │   ├── useTodos.ts              # FR1–4, FR17–20: CRUD operations with optimistic updates
│       │   └── useAgeHighlight.ts       # FR8–10: useMemo over todo list age distribution
│       │
│       ├── components/
│       │   ├── TodoInput.tsx            # FR1: add todo input + submit
│       │   ├── TodoList.tsx             # FR2, FR7, FR11: sorted list, empty state
│       │   ├── TodoItem.tsx             # FR3, FR4, FR8–10: item row, done/delete, highlight
│       │   ├── QuoteModal.tsx           # FR5–6: motivational quote on completion
│       │   ├── ErrorToast.tsx           # NFR16: non-blocking error display
│       │   └── SkeletonList.tsx         # Loading state for initial fetch
│       │
│       ├── pages/
│       │   └── HomePage.tsx            # FR22–24: main page, composes all components
│       │
│       └── assets/
│           └── (static images, icons)
│
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example               # DATABASE_URL=, PORT=3000, CORS_ORIGIN=
    ├── .env                       # Local dev values (gitignored)
    ├── .gitignore
    ├── Dockerfile
    ├── drizzle.config.ts          # Drizzle Kit config
    │
    └── src/
        ├── server.ts              # Entry point — loads --env-file, calls app(), calls listen()
        ├── app.ts                 # Fastify app factory — registers plugins and routes
        ├── types.ts               # Shared TS interfaces: Todo, User (mirrors frontend/types.ts)
        │
        ├── plugins/
        │   ├── db.plugin.ts       # Drizzle + postgres connection, registered via @fastify/plugin
        │   ├── auth.plugin.ts     # validateUserIdHook — preHandler for all protected routes
        │   ├── cors.plugin.ts     # @fastify/cors — origin: CORS_ORIGIN env var
        │   ├── helmet.plugin.ts   # @fastify/helmet — security headers
        │   └── rateLimit.plugin.ts  # @fastify/rate-limit — global + stricter on POST /guest
        │
        ├── routes/
        │   ├── health.route.ts    # GET /health → { status: "ok" } — unauthenticated
        │   ├── guest.route.ts     # POST /guest → creates user, returns { userId }
        │   └── todos.route.ts     # GET/POST/PATCH/DELETE /todos — all protected by auth plugin
        │
        ├── db/
        │   ├── schema.ts          # Drizzle table definitions: users, todos
        │   ├── index.ts           # DB client export (used by db.plugin.ts)
        │   └── migrations/        # Generated by drizzle-kit — never hand-edited
        │
        └── data/
            └── quotes.json        # Array of 100+ motivational quote strings
```

### Requirements to Structure Mapping

| FR Category            | FR Range  | Frontend                                                                       | Backend                                                      |
| ---------------------- | --------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Task Management        | FR1–FR6   | `TodoInput.tsx`, `useTodos.ts`, `QuoteModal.tsx`                               | `todos.route.ts`, `data/quotes.json`                         |
| Task List Display      | FR7–FR11  | `TodoList.tsx`, `TodoItem.tsx`, `useAgeHighlight.ts`, `computeAgeHighlight.ts` | `todos.route.ts` (GET, sort by createdAt DESC)               |
| Identity & Session     | FR12–FR16 | `useGuestIdentity.ts`, `lib/identity.ts`, `App.tsx`                            | `guest.route.ts`, `db/schema.ts` (users table)               |
| Backend API            | FR17–FR21 | `lib/api.ts`                                                                   | `todos.route.ts`, `guest.route.ts`, `plugins/auth.plugin.ts` |
| Application Experience | FR22–FR27 | `HomePage.tsx`, shadcn components, `SkeletonList.tsx`, `ErrorToast.tsx`        | `plugins/helmet.plugin.ts` (NFR5)                            |

### Architectural Boundaries

**Identity Boundary:**

- `POST /guest` is the only route outside the auth boundary
- `GET /health` is the only route outside rate limiting
- All other routes: `X-User-Id` header → `validateUserIdHook` → owns resource check

**Data Boundary:**

- Backend is single source of truth — frontend state is a cache
- Optimistic update: local state updated first, then reconciled with server response
- On `PATCH /todos/:id` with `done: true`, backend appends `quote: string` to the Todo response

**Container Boundary:**

- `postgres` container: internal port 5432; backend connects via `DATABASE_URL`
- `backend` container: port 3000; `/health` used by Compose healthcheck
- `frontend` container: nginx on port 80; `VITE_API_URL` baked in at build time

### Data Flow

**Add todo:**

```
User action (add todo)
  → TodoInput optimistically adds to local state
  → lib/api.ts: POST /todos { text } + X-User-Id header
  → Fastify: validateUserIdHook → todos.route.ts handler
  → Drizzle: INSERT INTO todos → returns new Todo row
  → Response: Todo object
  → useTodos: reconcile local state with server response
```

**Mark done:**

```
User action (mark done)
  → TodoItem optimistically marks done locally
  → lib/api.ts: PATCH /todos/:id { done: true } + X-User-Id header
  → Fastify: validateUserIdHook → todos.route.ts handler
  → Drizzle: UPDATE todos SET done=true → returns updated Todo
  → selectRandomQuote() from in-memory quotes.json
  → Response: Todo + { quote: string }
  → QuoteModal displayed with returned quote
```

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are mutually compatible. React 19 + Vite 7 + shadcn, Fastify 5 + Drizzle ORM + postgres driver, and Node `--test` + Vitest form a consistent, conflict-free stack. `camelCase` JSON ↔ `snake_case` DB column mapping is handled by Drizzle schema definitions. Docker Compose healthcheck uses `wget` available in Node alpine images.

### Requirements Coverage ✅

All 27 FRs and 17 NFRs are architecturally supported. Zero uncovered requirements.
See Requirements to Structure Mapping table in Project Structure section.

### Implementation Readiness ✅

- All critical decisions documented with verified versions
- Naming conventions cover database, API, and code layers
- All potential agent conflict points addressed (6 identified, 6 resolved)
- Every file in the project tree maps to a specific FR, NFR, or cross-cutting concern

### Gap Analysis

**Critical gaps:** None

**Implementation-level details for stories:**

- `quotes.json`: format is `string[]`, minimum 100 entries
- `nginx.conf`: static file server, no proxy needed (frontend/backend on separate ports)
- `drizzle.config.ts`: `dialect: "postgresql"`, `schema: "./src/db/schema.ts"`, `out: "./src/db/migrations/"`, credentials from env

### Architecture Completeness Checklist

- [x] Project context analyzed — 27 FRs, 17 NFRs, 4 architectural components
- [x] Stack decisions documented with verified npm versions
- [x] REST API surface fully specified (5 endpoints + healthcheck)
- [x] Database schema defined (2 tables: `users`, `todos`)
- [x] Identity flow strictly specified (POST /guest + localStorage)
- [x] Optimistic update pattern defined for all mutations
- [x] Security posture: rate limiting, CORS, helmet, ownership validation
- [x] Naming conventions: DB (snake_case), API (camelCase JSON), code (PascalCase components, camelCase hooks)
- [x] Test strategy: co-located files, Node `--test` (backend), Vitest (frontend)
- [x] Docker Compose: 3 services with healthcheck and startup order
- [x] Complete project tree with all files mapped to requirements

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Key strengths:**

- Zero-dependency identity model is architecturally clean — single entry point (`POST /guest`), single storage key (`motivatodo_user_id`)
- Visual aging algorithm is pure frontend computation — no backend changes needed for UX iteration
- Fastify's schema-driven validation means Swagger docs are free — no extra work
- Drizzle schema as single source of truth eliminates DB/code drift

**Deferred to post-MVP:**

- User registration/login (claims existing anonymous ID — no migration needed)
- Cross-device sync (follows automatically from registration)
