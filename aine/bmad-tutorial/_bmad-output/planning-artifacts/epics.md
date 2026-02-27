---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# MotivaTodo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for MotivaTodo, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1:** A user can add a new todo item with a single text input action
- **FR2:** A user can view their full list of todo items
- **FR3:** A user can mark a todo item as done
- **FR4:** A user can delete a todo item permanently
- **FR5:** Marking a todo as done immediately presents the user with a motivational quote
- **FR6:** The motivational quote library contains sufficient variety to avoid repetition in normal usage
- **FR7:** The todo list is sorted by insertion date, descending (newest first)
- **FR8:** Each todo item displays a visual highlight intensity proportional to its relative age within the current list
- **FR9:** Highlight graduation is relative and list-aware — intensity increases progressively across the age distribution from no highlight (newest) to peak urgency, then decreases for tasks crossing the staleness threshold
- **FR10:** Todo items crossing the staleness threshold display reduced highlight intensity and a contextual prompt: _"Is this task still ongoing?"_
- **FR11:** An empty todo list displays a clear affordance to add the first item
- **FR12:** On the first API request from a new client, the backend assigns a temporary anonymous user ID with no user action required
- **FR13:** The client persists the anonymous user ID across browser sessions so the todo list is available on return visits
- **FR14:** All todo data is stored server-side and associated with the user's anonymous or registered ID
- **FR15:** After a user adds a meaningful number of tasks, the app displays a non-intrusive prompt to register
- **FR16:** The application is fully functional without any login, registration, or configuration step
- **FR17:** The system exposes an endpoint to retrieve all todos for a given user
- **FR18:** The system exposes an endpoint to create a new todo for a given user
- **FR19:** The system exposes an endpoint to update an existing todo
- **FR20:** The system exposes an endpoint to delete a todo for a given user
- **FR21:** When a request arrives with no existing user identity, the system creates an anonymous user record and returns the assigned user ID

### Application Experience

- **FR22:** The application is interactive within 400ms of initial load
- **FR23:** The application layout supports one-handed mobile interaction
- **FR24:** The application layout is fully functional on desktop
- **FR25:** All interactive elements are operable via keyboard navigation
- **FR26:** All interactive elements meet color contrast requirements, including all visual aging highlight tiers
- **FR27:** All interactive elements are compatible with screen readers

### NonFunctional Requirements

- **NFR1:** Initial application load (cold start) completes within 400ms on a standard broadband connection
- **NFR2:** The application reaches interactive state within 400ms of load
- **NFR3:** All CRUD API operations respond within 200ms at p95 under normal load
- **NFR4:** Task add, complete, and delete interactions provide perceived UI feedback within 50ms via optimistic updates
- **NFR5:** All API communication is over HTTPS — no unencrypted data in transit
- **NFR6:** Anonymous user IDs are cryptographically random and non-enumerable
- **NFR7:** No PII is collected or stored in MVP — tasks contain only user-entered text; no name, email, or device ID stored without registration
- **NFR8:** Each user can access only their own todo data — no cross-user data leakage
- **NFR9:** The backend architecture supports horizontal scaling without re-architecture
- **NFR10:** A 10x increase in concurrent users produces less than 20% degradation in API response times
- **NFR11:** Zero critical WCAG 2.1 violations
- **NFR12:** All interactive elements are keyboard-navigable with visible focus indicators
- **NFR13:** All color contrast ratios meet WCAG 2.1 AA, including all tiers of the age-based highlight graduation
- **NFR14:** All interactive elements carry appropriate labels for screen reader compatibility
- **NFR15:** Backend API targets 99.5% monthly uptime
- **NFR16:** When the backend is unavailable, the app displays a clear, non-technical error state
- **NFR17:** Data confirmed by a successful API response is durable — no task data lost after write confirmation

### Additional Requirements

**From Architecture — Starter Template & Project Setup:**

- Monorepo structure: `frontend/` and `backend/` as separate packages under a root workspace
- Frontend: React 19.2.4 + Vite 7.3.1 + TypeScript + shadcn 3.8.5 + Tailwind CSS + React Router v7
- Backend: Fastify 5.7.4 + TypeScript + Drizzle ORM 0.45.1
- Backend plugins: `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui`
- Database: PostgreSQL (postgres:17 Docker image) with Drizzle schema
- Deployment: Docker Compose with 3 containers (postgres, backend, frontend/nginx)
- Testing: Node `--test` with co-located `*.test.ts` (backend), Vitest + React Testing Library with co-located `*.test.tsx` (frontend)
- Environment: `--env-file` flag (backend), `VITE_*` variables (frontend)

**From Architecture — Identity & API Patterns:**

- Dedicated `POST /guest` endpoint returns `{ userId: string }` (UUID)
- `GET /health` → `{ status: "ok" }` with Docker Compose healthcheck integration
- `X-User-Id` header (exact casing) carries the anonymous user ID on all requests except `POST /guest` and `GET /health`
- `validateUserIdHook` Fastify hook enforces header presence on all protected routes
- `motivatodo_user_id` (exact key) in localStorage stores the anonymous user ID
- `app.ts` factory pattern — never call `listen()` inside `app.ts`; use `server.ts` entrypoint

**From Architecture — Data & API Conventions:**

- Database column naming: `snake_case`
- JSON field naming: `camelCase`
- API endpoint naming: `kebab-case`
- React component naming: `PascalCase`; hook naming: `camelCase` with `use` prefix
- Error response format: `{ statusCode: number, error: string, message: string }`
- Swagger UI available at `/documentation`
- `quotes.json` static file loaded at backend startup for motivational quotes

**From Architecture — Optimistic Updates:**

- All mutations (add, complete, delete) use optimistic update pattern: UI updates immediately, reverts only on API error

### FR Coverage Map

| FR   | Epic   | Summary                                            |
| ---- | ------ | -------------------------------------------------- |
| FR1  | Epic 3 | Add todo — single input action                     |
| FR2  | Epic 3 | View full todo list                                |
| FR3  | Epic 3 | Mark todo as done                                  |
| FR4  | Epic 3 | Delete todo                                        |
| FR5  | Epic 3 | Motivational quote on completion                   |
| FR6  | Epic 3 | Quote library variety                              |
| FR7  | Epic 3 | Sort by insertion date DESC                        |
| FR8  | Epic 4 | Visual highlight by relative age                   |
| FR9  | Epic 4 | Graduated, list-aware highlight scale              |
| FR10 | Epic 4 | Staleness threshold + contextual prompt            |
| FR11 | Epic 4 | Empty state affordance                             |
| FR12 | Epic 2 | Backend assigns anonymous user ID on first request |
| FR13 | Epic 2 | Client persists user ID across sessions            |
| FR14 | Epic 2 | Todos stored server-side, bound to user ID         |
| FR15 | Epic 5 | Non-intrusive registration nudge                   |
| FR16 | Epic 2 | Fully functional without login                     |
| FR17 | Epic 3 | `GET /todos` endpoint                              |
| FR18 | Epic 3 | `POST /todos` endpoint                             |
| FR19 | Epic 3 | `PATCH /todos/:id` endpoint                        |
| FR20 | Epic 3 | `DELETE /todos/:id` endpoint                       |
| FR21 | Epic 2 | Create anonymous user + return ID                  |
| FR22 | Epic 5 | Interactive within 400ms                           |
| FR23 | Epic 5 | Mobile one-handed layout                           |
| FR24 | Epic 5 | Desktop fully functional                           |
| FR25 | Epic 5 | Keyboard navigable                                 |
| FR26 | Epic 5 | Color contrast (all aging tiers)                   |
| FR27 | Epic 5 | Screen reader compatible                           |

## Epic List

### Epic 1: Working Application Foundation

Developers can run the full application stack locally and in Docker — frontend, backend, and database connected and healthy, with API documentation and health checks available. Every subsequent epic builds on this working skeleton.
**FRs covered:** _(none directly — enables all epics)_
**Additional reqs covered:** Monorepo setup, Docker Compose (3 containers: postgres, backend, frontend/nginx), `GET /health` → `{ status: "ok" }`, Swagger UI at `/documentation`, `app.ts` factory pattern, env config (`--env-file` / `VITE_*`), dev tooling (Node `--test`, Vitest)

### Epic 2: Anonymous Identity & Frictionless First Visit

Users land on the app with zero friction — no login, no signup. A persistent anonymous identity is silently assigned by the backend and survives browser close/reopen. The todo list loads on arrival.
**FRs covered:** FR12, FR13, FR14, FR16, FR21
**Additional reqs covered:** `POST /guest` endpoint returns `{ userId: string }` (UUID), `X-User-Id` header (exact casing), `validateUserIdHook` on all protected routes, `motivatodo_user_id` localStorage key

### Epic 3: Core Task Operations

Users can add, view, complete, and delete todo items with immediate UI feedback and a motivational quote on completion. The full CRUD cycle is operational.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR17, FR18, FR19, FR20
**Additional reqs covered:** Optimistic updates for all mutations (add/complete/delete), `quotes.json` loaded at backend startup, `GET /todos`, `POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id` endpoints

### Epic 4: Visual Task Aging & Passive Prioritization

The task list becomes self-organizing — older tasks are progressively highlighted using a relative, list-aware graduated scale. Tasks crossing the staleness threshold show reduced highlight and a contextual prompt. Empty state is fully handled.
**FRs covered:** FR8, FR9, FR10, FR11
**Additional reqs covered:** Relative age algorithm (list-aware), staleness threshold logic, visual aging CSS tiers, WCAG AA contrast across all highlight tiers

### Epic 5: Accessible & Responsive Experience

The application meets all performance, accessibility, and responsive design standards. It works on one-handed mobile and desktop, is fully keyboard-navigable, screen-reader-compatible, WCAG 2.1 AA compliant, and includes a non-intrusive registration nudge.
**FRs covered:** FR15, FR22, FR23, FR24, FR25, FR26, FR27
**Additional reqs covered:** Mobile-first layout, touch targets ≥ 44×44px, keyboard focus indicators, ARIA labels, registration nudge after ~5 tasks, all NFR1–NFR17 acceptance criteria verified (performance, security, scalability, accessibility, reliability)

---

## Epic 1: Working Application Foundation

Developers can run the full application stack locally and in Docker — frontend, backend, and database connected and healthy, with API documentation and health checks available. Every subsequent epic builds on this working skeleton.

### Story 1.1: Initialize Monorepo Workspace

As a **developer**,
I want a working monorepo with root-level tooling configured,
So that frontend and backend can be developed and run as a unified project.

**Acceptance Criteria:**

**Given** the repository is cloned
**When** I run the root-level install command
**Then** all workspace dependencies for both `frontend/` and `backend/` are installed

**And** a `package.json` at root defines `workspaces: ["frontend", "backend"]`

**And** a shared `tsconfig.base.json` at root provides common TypeScript compiler options

**And** `README.md` at root documents how to install, run, and test the project

---

### Story 1.2: Backend Application Skeleton

As a **developer**,
I want a running Fastify backend with health check, Swagger docs, and all security plugins registered,
So that the backend is ready to receive routes and is observable from day one.

**Acceptance Criteria:**

**Given** the backend dependencies are installed
**When** I start the backend with `node --env-file .env dist/server.js`
**Then** the server starts without errors and logs the listening port

**And** `GET /health` returns `200 OK` with body `{ "status": "ok" }`

**And** `GET /documentation` serves the Swagger UI

**And** `app.ts` exports a factory function that creates and configures the Fastify instance without calling `listen()`

**And** `server.ts` is the sole entrypoint that calls `app()` then `listen()`

**And** `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui` are all registered

**And** a `.env.example` documents all required environment variables

**And** running `node --test` executes backend tests with zero failures

---

### Story 1.3: Frontend Application Skeleton

As a **developer**,
I want a running frontend shell with React Router, shadcn/ui, and Tailwind configured,
So that the frontend is ready to receive pages and components.

**Acceptance Criteria:**

**Given** the frontend dependencies are installed
**When** I run `vite dev`
**Then** the app loads in the browser without errors

**And** React Router v7 is configured with a root layout and a placeholder index route

**And** shadcn/ui and Tailwind CSS are configured and a sample shadcn component renders correctly

**And** `VITE_API_URL` is the only required env variable, documented in `.env.example`

**And** running `vitest` executes frontend tests with zero failures

---

### Story 1.4: Database Connection & Migration Tooling

As a **developer**,
I want a PostgreSQL database connection via Drizzle ORM with migration tooling ready,
So that subsequent epics can define and migrate their schemas.

**Acceptance Criteria:**

**Given** a running PostgreSQL instance (local or Docker)
**When** I run `drizzle-kit push`
**Then** the command connects to the database successfully

**And** `drizzle.config.ts` is present and configured for the postgres connection

**And** `backend/src/db/index.ts` exports the Drizzle `db` instance

**And** `backend/src/db/schema.ts` is the single source of truth for all table definitions (starts empty)

**And** `DATABASE_URL` is configurable via env variable

---

### Story 1.5: Docker Compose Full Stack

As a **developer**,
I want a single `docker compose up` command to start the entire stack,
So that the app can be run and demonstrated without local Node/Postgres installs.

**Acceptance Criteria:**

**Given** Docker and Docker Compose are installed
**When** I run `docker compose up`
**Then** all three containers start: `postgres`, `backend`, `frontend`

**And** `GET http://localhost:3000/health` returns `{ "status": "ok" }` once the backend container is healthy

**And** `http://localhost:8080` serves the frontend SPA, with client-side routing working (no 404 on refresh)

**And** the `postgres` container uses `healthcheck:` so the backend waits for the DB before starting

**And** all container images are built via Dockerfiles in `backend/` and `frontend/`

**And** `nginx.conf` in `frontend/` configures the SPA fallback (`try_files $uri /index.html`)

**And** environment variables for backend and frontend are configurable via a root `.env` file

---

## Epic 2: Anonymous Identity & Frictionless First Visit

Users land on the app with zero friction — no login, no signup. A persistent anonymous identity is silently assigned by the backend and survives browser close/reopen. The todo list loads on arrival.

### Story 2.1: Guest Identity Endpoint

As a **new user**,
I want the backend to silently assign me a unique anonymous ID on my first visit,
So that my data is persisted from the very first interaction with no action required from me.

**Acceptance Criteria:**

**Given** no `X-User-Id` header is present
**When** `POST /guest` is called
**Then** a new anonymous user record is created in the database with a cryptographically random UUID as `id`

**And** the response is `201 Created` with body `{ "userId": "<uuid>" }`

**And** the `users` table is created in the DB schema with at minimum `id` (uuid, primary key) and `created_at` columns

**And** calling `POST /guest` a second time creates a second independent user (no deduplication)

**And** the endpoint is documented in Swagger

**And** the endpoint does NOT require the `X-User-Id` header (it is exempt from `validateUserIdHook`)

---

### Story 2.2: User Identity Hook & Header Enforcement

As a **developer**,
I want all protected API routes to enforce the presence of the `X-User-Id` header,
So that every request is associated with a known user and cross-user data leakage is prevented.

**Acceptance Criteria:**

**Given** a request to any route other than `POST /guest` and `GET /health`
**When** the `X-User-Id` header is missing or empty
**Then** the response is `400 Bad Request` with body `{ "statusCode": 400, "error": "Bad Request", "message": "Missing X-User-Id header" }`

**And** `validateUserIdHook` is implemented as a Fastify `onRequest` hook

**And** `POST /guest` and `GET /health` are explicitly exempt from the hook

**And** the hook is tested: requests with a valid header pass, requests without fail

---

### Story 2.3: Client-Side Identity Initialization

As a **returning user**,
I want the app to remember my anonymous ID across browser sessions,
So that my todo list is available every time I return without any login.

**Acceptance Criteria:**

**Given** I open the app for the first time (no `motivatodo_user_id` in localStorage)
**When** the app initializes
**Then** `POST /guest` is called automatically and the returned `userId` is stored as `motivatodo_user_id` in localStorage

**And** all subsequent API requests include `X-User-Id: <userId>` header

**Given** I open the app again (with `motivatodo_user_id` already in localStorage)
**When** the app initializes
**Then** `POST /guest` is NOT called again — the stored ID is reused

**And** a `useIdentity` hook encapsulates this initialization logic

**And** the app renders a loading state while identity initialization is in progress

---

## Epic 3: Core Task Operations

Users can add, view, complete, and delete todo items with immediate UI feedback and a motivational quote on completion. The full CRUD cycle is operational.

### Story 3.1: Todo Data Schema & List Endpoint

As a **user**,
I want my todo list to load when I open the app,
So that I can immediately see everything I need to do.

**Acceptance Criteria:**

**Given** a valid `X-User-Id` header
**When** `GET /todos` is called
**Then** the response is `200 OK` with an array of todo objects for that user, sorted by `created_at` descending (newest first)

**And** each todo object contains: `id`, `userId`, `text`, `done`, `createdAt`

**And** the `todos` table is added to the DB schema with columns: `id` (uuid, pk), `user_id` (uuid, FK → users), `text` (text, not null), `done` (boolean, default false), `created_at` (timestamp, default now)

**And** only todos belonging to the requesting user are returned (no cross-user leakage)

**And** an empty list `[]` is returned when the user has no todos (not a 404)

**And** the endpoint is documented in Swagger

---

### Story 3.2: Add Todo

As a **user**,
I want to add a new todo item with a single input action,
So that I can capture a task in under 10 seconds.

**Acceptance Criteria:**

**Given** a valid `X-User-Id` header and a non-empty `text` field in the request body
**When** `POST /todos` is called with `{ "text": "..." }`
**Then** a new todo is created in the database and the response is `201 Created` with the created todo object

**And** the new todo appears at the top of the list in the UI immediately (optimistic update — UI updates before API response)

**And** if the API call fails, the optimistic addition is reverted and an error state is shown

**And** the input field is cleared and focused after a successful submission

**And** submitting an empty or whitespace-only input is blocked — no API call is made

**And** the endpoint is documented in Swagger

---

### Story 3.3: Mark Todo as Done & Motivational Quote

As a **user**,
I want to mark a todo as done and see a motivational quote,
So that completing tasks feels rewarding and reinforces the habit loop.

**Acceptance Criteria:**

**Given** a valid `X-User-Id` header
**When** `PATCH /todos/:id` is called with `{ "done": true }`
**Then** the todo's `done` field is set to `true` and the response is `200 OK` with body `{ "todo": {...}, "quote": "..." }`

**And** the todo is marked visually as complete in the UI immediately (optimistic update)

**And** a motivational quote from the response is displayed to the user immediately after marking done

**And** the quote is selected randomly from `quotes.json` loaded at backend startup

**And** `quotes.json` contains at least 20 unique quotes to ensure variety (FR6)

**And** if the API call fails, the optimistic completion is reverted

**And** patching a todo that belongs to a different user returns `403 Forbidden`

**And** the endpoint is documented in Swagger

---

### Story 3.4: Delete Todo

As a **user**,
I want to delete a todo item permanently,
So that I can remove tasks that are no longer relevant.

**Acceptance Criteria:**

**Given** a valid `X-User-Id` header
**When** `DELETE /todos/:id` is called
**Then** the todo is removed from the database and the response is `204 No Content`

**And** the todo disappears from the UI immediately (optimistic update)

**And** if the API call fails, the optimistic deletion is reverted and the item reappears

**And** deleting a todo that belongs to a different user returns `403 Forbidden`

**And** deleting a non-existent todo returns `404 Not Found`

**And** the endpoint is documented in Swagger

---

## Epic 4: Visual Task Aging & Passive Prioritization

The task list becomes self-organizing — older tasks are progressively highlighted using a relative, list-aware graduated scale. Tasks crossing the staleness threshold show reduced highlight and a contextual prompt. Empty state is fully handled.

### Story 4.1: Visual Age Highlighting Algorithm

As a **user**,
I want older tasks to become progressively more highlighted,
So that I can see at a glance which tasks have been waiting longest without any manual sorting.

**Acceptance Criteria:**

**Given** a list of todos with varying `createdAt` timestamps
**When** the todo list renders
**Then** each todo receives a highlight intensity value derived from its relative position in the age distribution of the current list (FR8, FR9)

**And** the newest todo has no highlight (0% intensity)

**And** highlight intensity increases progressively from newest to oldest across all todos in the list

**And** the algorithm is relative and list-aware: a task that is "old" in a list of 3 tasks may be less highlighted than a task of equal age in a list of 20 tasks

**And** the highlighting logic is encapsulated in a pure function (e.g. `computeAgeHighlights(todos)`) that is independently unit-tested

**And** the highlight intensity is expressed as a value from 0–100 passed as a prop or CSS custom property to each todo item

**And** the 0–100 intensity value is mapped to the zinc palette tiers defined in the UX design spec as follows:

| Intensity | Tailwind class | Visual state         |
| --------- | -------------- | -------------------- |
| 0         | `bg-white`     | Fresh — no highlight |
| 1–25      | `bg-zinc-100`  | Aging                |
| 26–50     | `bg-zinc-200`  | Noticeably aging     |
| 51–75     | `bg-zinc-300`  | Urgent               |
| 76–100    | `bg-zinc-400`  | Peak urgency         |

> **Implementation note (resolves IR warning W1):** The algorithm must be **relative and list-aware** (FR9) — intensity is derived from each todo's proportional rank in the current list's age distribution, not from absolute day thresholds. The zinc tier table above is the _visual mapping_ of that computed intensity, not an independent threshold system. A single-item list will always have its one task at 0% (no highlight). A list of 5 items will spread evenly across the scale.

---

### Story 4.2: Staleness Threshold & Contextual Prompt

As a **user**,
I want tasks that may be abandoned to signal their staleness with a reduced highlight and a prompt,
So that I can distinguish urgently pending tasks from potentially forgotten ones.

**Acceptance Criteria:**

**Given** a todo that has crossed the staleness threshold (based on its relative age position)
**When** the todo list renders
**Then** that todo displays reduced highlight intensity (backing off from peak, per FR10)

**And** the todo displays the contextual prompt: _"Is this task still ongoing?"_

**Given** a todo that has NOT crossed the staleness threshold
**When** the todo list renders
**Then** no staleness prompt is shown

**And** the staleness threshold logic is part of `computeAgeHighlights` and is unit-tested with both stale and non-stale cases

---

### Story 4.3: Empty State

As a **new user**,
I want to see a clear invitation to add my first task when my list is empty,
So that the purpose of the app is immediately obvious with no confusion.

**Acceptance Criteria:**

**Given** the user has no todos
**When** the todo list renders
**Then** an empty state UI is displayed with a clear affordance to add the first item (FR11)

**And** the empty state does not show the todo list container — it replaces it entirely

**And** the add-todo input field remains visible and accessible when the empty state is shown

---

## Epic 5: Accessible & Responsive Experience

The application meets all performance, accessibility, and responsive design standards. It works on one-handed mobile and desktop, is fully keyboard-navigable, screen-reader-compatible, WCAG 2.1 AA compliant, and includes a non-intrusive registration nudge.

### Story 5.1: Mobile-First Responsive Layout

As a **mobile user**,
I want the app to be fully usable with one hand on a phone,
So that I can capture tasks quickly in real-world time-constrained scenarios.

**Acceptance Criteria:**

**Given** the app is opened on a mobile viewport (320px–768px width)
**When** the page loads
**Then** the todo input and list are fully visible without horizontal scrolling

**And** all interactive elements (input, add button, complete button, delete button) have touch targets of at least 44×44px (FR23)

**And** the add-todo input field is always visible without scrolling, anchored near the top or bottom of the viewport

**Given** the app is opened on a desktop viewport (> 768px)
**When** the page loads
**Then** the layout is fully functional with a comfortable reading width (FR24)

---

### Story 5.2: Keyboard Navigation & Focus Management

As a **keyboard user**,
I want to fully operate the app without a mouse,
So that the app is accessible to users who rely on keyboard navigation.

**Acceptance Criteria:**

**Given** the app is loaded
**When** I press Tab
**Then** focus moves through all interactive elements in a logical order

**And** all interactive elements display a clearly visible focus indicator when focused (FR25, NFR12)

**And** I can add a todo by typing in the input and pressing Enter without clicking

**And** I can mark a todo as done using the keyboard (Enter or Space on the complete control)

**And** I can delete a todo using the keyboard (Enter or Space on the delete control)

**And** after submitting a new todo, focus returns to the input field

---

### Story 5.3: Screen Reader & ARIA Accessibility

As a **screen reader user**,
I want all interactive elements to be properly labelled and announced,
So that I can use the app independently with assistive technology.

**Acceptance Criteria:**

**Given** the app is used with a screen reader
**When** I navigate to a todo item
**Then** the todo text, completion status, and available actions (complete, delete) are all announced correctly (FR27, NFR14)

**And** the motivational quote is announced when it appears after marking a todo done

**And** the staleness prompt ("Is this task still ongoing?") is announced for stale todos

**And** the empty state is announced when there are no todos

**And** all icon-only buttons carry accessible labels (e.g. `aria-label="Delete todo"`)

**And** zero critical WCAG 2.1 violations are detected by an automated audit tool (NFR11)

---

### Story 5.4: Color Contrast & Visual Aging WCAG Compliance

As a **user with low vision**,
I want all text and interactive elements — including age-highlighted tasks — to meet contrast standards,
So that the app is fully readable regardless of highlight intensity.

**Acceptance Criteria:**

**Given** a todo item at any highlight intensity tier (0% → 100% → staleness)
**When** the page renders
**Then** the text on that todo meets WCAG 2.1 AA contrast ratio (≥ 4.5:1 for normal text) at every tier (FR26, NFR13)

**And** the staleness prompt text meets the same contrast standard against its background

**And** contrast ratios are verified across all highlight tiers using a colour contrast tool or automated test

---

### Story 5.5: Error State & Registration Nudge

As a **user**,
I want to see a clear error message when the backend is unavailable, and a gentle prompt to register after I've added several tasks,
So that I trust the app handles problems gracefully and know how to make my data permanent.

**Acceptance Criteria:**

**Given** the backend API is unreachable
**When** the app attempts to load todos or perform any mutation
**Then** a clear, non-technical error message is displayed (NFR16, e.g. "Something went wrong. Please try again.")

**And** the error state does not crash the app or show a blank screen

**Given** a user has added 5 or more todos
**When** the todo list renders
**Then** a non-intrusive prompt to register is displayed (FR15), e.g. a dismissible banner or subtle callout

**And** the prompt does not block or interrupt the core todo workflow

**And** dismissing the prompt removes it for the current session

**Given** the app is loaded on a standard broadband connection (cold start)
**When** the page finishes loading
**Then** the app is interactive within 400ms (FR22, NFR1, NFR2)

**And** a Lighthouse performance audit or equivalent confirms the performance budget is met
