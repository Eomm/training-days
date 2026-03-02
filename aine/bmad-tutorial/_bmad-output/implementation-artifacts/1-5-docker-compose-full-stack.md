# Story 1.5: Docker Compose Full Stack

Status: ready-for-dev

## Story

As a **developer**,
I want a single `docker compose up` command to start the entire stack,
so that the app can be run and demonstrated without local Node/Postgres installs.

## Acceptance Criteria

1. **Given** Docker and Docker Compose are installed, **When** I run `docker compose up`, **Then** all three containers start: `postgres`, `backend`, `frontend`.
2. `GET http://localhost:3000/health` returns `{ "status": "ok" }` once the backend container is healthy.
3. `http://localhost:8080` serves the frontend SPA, with client-side routing working (no 404 on refresh).
4. The `postgres` container uses a `healthcheck:` so the backend waits for the DB to be ready before starting.
5. All container images are built via Dockerfiles in `backend/` and `frontend/`.
6. `frontend/nginx.conf` configures the SPA fallback (`try_files $uri /index.html`).
7. Environment variables for backend and frontend are configurable via a root `.env` file.

## Tasks / Subtasks

- [ ] Task 1 — Create `backend/Dockerfile` (AC: 1, 2, 5)
  - [ ] Multi-stage build: builder stage installs all deps + runs `tsc`; production stage installs only prod deps + copies `dist/`
  - [ ] Builder: `node:22-alpine`, `WORKDIR /app`, copy `package*.json`, `npm ci`, copy `tsconfig.json` + `src/`, run `npm run build`
  - [ ] Production: `node:22-alpine`, `WORKDIR /app`, copy `package*.json`, `npm ci --omit=dev`, copy `dist/` from builder
  - [ ] `EXPOSE 3000` and `CMD ["node", "dist/server.js"]`
  - [ ] See Dev Notes for exact file content

- [ ] Task 2 — Create `frontend/nginx.conf` (AC: 3, 6)
  - [ ] Single `server {}` block listening on port 80
  - [ ] `root /usr/share/nginx/html`, `index index.html`
  - [ ] `location / { try_files $uri $uri/ /index.html; }` — critical for SPA client-side routing (prevents 404 on page refresh)
  - [ ] See Dev Notes for exact file content

- [ ] Task 3 — Create `frontend/Dockerfile` (AC: 1, 3, 5)
  - [ ] Multi-stage: builder stage (`node:22-alpine`) builds the Vite app; production stage (`nginx:alpine`) serves it
  - [ ] Builder: `WORKDIR /app`, copy `package*.json`, `npm ci`, copy all sources, declare `ARG VITE_API_URL`, `ENV VITE_API_URL`, run `npm run build`
  - [ ] Production: copy `dist/` → `/usr/share/nginx/html`, copy `nginx.conf` → `/etc/nginx/conf.d/default.conf`
  - [ ] `EXPOSE 80` and `CMD ["nginx", "-g", "daemon off;"]`
  - [ ] See Dev Notes for exact file content and the VITE_API_URL build-arg gotcha

- [ ] Task 4 — Create root `docker-compose.yml` (AC: 1, 2, 3, 4, 7)
  - [ ] `postgres` service: `image: postgres:17`, `healthcheck` using `pg_isready`, named volume `postgres_data` for data persistence
  - [ ] `backend` service: `build: ./backend`, `depends_on: postgres (service_healthy)`, own `healthcheck` using `wget -qO-`, env vars via `${VAR:-default}`
  - [ ] `frontend` service: `build.context: ./frontend`, `build.args.VITE_API_URL`, `depends_on: backend (service_healthy)`, port `8080:80`
  - [ ] All env vars with sane defaults using `${VAR:-default}` syntax
  - [ ] See Dev Notes for exact file content

- [ ] Task 5 — Create root `.env.example` and `.env` (AC: 7)
  - [ ] `.env.example` at project root documents all compose-level variables with example values
  - [ ] `.env` (gitignored) for local dev — developer copies from `.env.example`
  - [ ] Ensure root `.gitignore` includes `.env` (check if exists; add entry if needed)
  - [ ] See Dev Notes for exact content

- [ ] Task 6 — Verify `backend/.env.example` has `CORS_ORIGIN` (AC: 2)
  - [ ] `backend/.env.example` should already have `CORS_ORIGIN=http://localhost:5173` (local dev value, from Story 1.2)
  - [ ] The **docker-compose** `.env` overrides this with `CORS_ORIGIN=http://localhost:8080` (the nginx-served frontend URL)
  - [ ] This distinction is documented in Dev Notes — easy to get wrong

- [ ] Task 7 — Smoke-test the full stack (AC: 1, 2, 3)
  - [ ] Run `docker compose build` — confirm all images build without errors
  - [ ] Run `docker compose up -d` — confirm all 3 containers reach healthy/running state
  - [ ] `curl http://localhost:3000/health` → `{"status":"ok"}`
  - [ ] Open `http://localhost:8080` in browser — confirm React app loads
  - [ ] Refresh at `http://localhost:8080` — confirm no 404 (nginx SPA fallback works)
  - [ ] Run `docker compose down` to clean up

## Dev Notes

### Critical: `VITE_API_URL` is Baked at Build Time

Vite inlines `import.meta.env.VITE_*` variables **at build time** — the value is embedded in the JavaScript bundle. This means:

- **`VITE_API_URL` must be a Docker build ARG**, not a runtime environment variable
- Changing `VITE_API_URL` requires a **rebuild** (`docker compose build frontend`)
- For local dev (outside Docker): `VITE_API_URL=http://localhost:3000` (Vite reads from `frontend/.env.local`)
- For Docker compose: `VITE_API_URL=http://localhost:3000` (browser talks to localhost:3000 directly — this is the **public host port**, not the container-to-container URL)

> The docker-compose `environment:` section is for **runtime** env vars. For Vite, use `build.args:` instead. See `docker-compose.yml` Dev Notes below.

### Critical: `CORS_ORIGIN` Differs Between Dev and Docker

| Context               | `CORS_ORIGIN` value     | Reason                        |
| --------------------- | ----------------------- | ----------------------------- |
| Local dev (no Docker) | `http://localhost:5173` | Vite dev server runs on 5173  |
| Docker compose        | `http://localhost:8080` | nginx serves frontend on 8080 |

The Fastify `@fastify/cors` plugin uses `CORS_ORIGIN` to set `Access-Control-Allow-Origin`. If this is wrong, the browser will block API calls with CORS errors even though the server is running correctly.

**Where each value lives:**

- `backend/.env` (local dev) → `CORS_ORIGIN=http://localhost:5173`
- Root `.env` (docker compose) → `CORS_ORIGIN=http://localhost:8080`

### Critical: `@fastify/env` and Docker Env Vars

`app.ts` uses `@fastify/env` with `dotenv: true`. In Docker containers:

- Environment variables set via `docker-compose environment:` are already in `process.env`
- `dotenv` does **not** override already-set env vars — container env vars always win
- No `.env` file is COPY'd into the container (security: never bake credentials into images)
- Required vars (`DATABASE_URL`, `PORT`, `CORS_ORIGIN`) must all be in `docker-compose.yml environment:` section

### `backend/Dockerfile`

```dockerfile
# Stage 1: Build TypeScript source
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for tsc)
COPY package*.json ./
RUN npm ci

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript → dist/
# - allowImportingTsExtensions: allows .ts in imports (dev)
# - rewriteRelativeImportExtensions: rewrites .ts imports to .js in output (prod)
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine AS production
WORKDIR /app

# Install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

> **`npm run build` = `tsc`**: The backend `tsconfig.json` has `allowImportingTsExtensions: true` + `rewriteRelativeImportExtensions: true`. TypeScript 5.7+ rewrites relative `.ts` imports to `.js` in the output, so `import x from './foo.ts'` → `import x from './foo.js'` in `dist/`. The compiled Node ESM bundle in `dist/` is fully self-contained.

> **Do NOT copy `drizzle.config.ts` or `src/db/migrations/` into the production image** — migration tooling is a dev concern. For production DB migrations in later sprints, run `drizzle-kit migrate` as a pre-flight step or a separate `migrate` service in compose.

> **No `.env` file in container:** `DATABASE_URL`, `PORT`, `CORS_ORIGIN` are injected by docker-compose `environment:`. Even if `@fastify/env dotenv: true` tries to read `.env`, the file won't exist — that's fine, the required vars are already in process.env.

### `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — send all unmatched routes to index.html
    # This allows React Router to handle client-side routing (e.g. /todos, /settings)
    # Without this, a browser refresh on any sub-path returns nginx 404
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression for static assets
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

> **Why `server_name _;`?** — The `_` is a catch-all, accepting any hostname. This works for local `localhost:8080` and can be overridden for production deployments.

> **`try_files $uri $uri/ /index.html`** — nginx first tries to serve the exact file, then a directory index, and finally falls back to `index.html`. This is the standard SPA pattern that enables React Router to function on page refresh or direct URL access.

### `frontend/Dockerfile`

```dockerfile
# Stage 1: Build Vite app
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all frontend source files
COPY . .

# VITE_API_URL must be a build ARG — Vite bakes it into the JS bundle at build time
# docker-compose passes this via build.args; it is NOT a runtime env var
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

# Build: runs tsc -b && vite build → outputs to dist/
RUN npm run build

# Stage 2: Production — serve with nginx
FROM nginx:alpine AS production

# Copy built static files to nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy SPA-aware nginx config (replaces default.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

> **`components.json`, `eslint.config.js`, `tsconfig*.json` are NOT excluded** — the `COPY . .` copies everything (minus any `.dockerignore`). Consider adding a `frontend/.dockerignore` with `node_modules`, `dist`, `.env*` to keep the build context lean. This is optional for MVP.

> **`npm run build` = `tsc -b && vite build`**: `tsc -b` runs but with `noEmit` not set in frontend tsconfig (it will produce no JS output since Vite handles bundling). Wait — `frontend/tsconfig.json` overrides with `noEmit: true` (check Story 1.3 notes). Vite does its own bundling independent of `tsc` output. The `tsc -b` call is only for type-checking. Output goes to `dist/` from Vite only.

### Root `docker-compose.yml`

```yaml
# docker-compose.yml — MotivaTodo full stack
# Run: docker compose up -d
# Stop: docker compose down
# Rebuild: docker compose build

services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-motivatodo}
      POSTGRES_USER: ${POSTGRES_USER:-motivatodo}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-motivatodo}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-motivatodo}"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      # postgres service name is used as hostname inside the Docker network
      DATABASE_URL: ${DATABASE_URL:-postgres://motivatodo:motivatodo@postgres:5432/motivatodo}
      PORT: ${PORT:-3000}
      # CORS_ORIGIN must match the browser-facing URL of the frontend (http://localhost:8080 in Docker)
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:8080}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    ports:
      - "${BACKEND_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: ./frontend
      args:
        # VITE_API_URL is a build-time argument — baked into the JS bundle by Vite
        # Value must be the PUBLIC host URL of the backend (localhost:3000 — browser-accessible)
        VITE_API_URL: ${VITE_API_URL:-http://localhost:3000}
    ports:
      - "${FRONTEND_PORT:-8080}:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  postgres_data:
```

> **`@postgres:5432` in DATABASE_URL:** Inside the Docker Compose network, services communicate using their service names as hostnames. `postgres://...@postgres:5432/...` resolves to the `postgres` service container. This is different from local dev where `localhost` is used.

> **`wget` in healthcheck:** `wget` is available in Node alpine images (`node:22-alpine`). The healthcheck uses `wget -qO-` (quiet, output to stdout) — same approach specified in the architecture document. [Source: _bmad-output/planning-artifacts/architecture.md#Docker Compose Healthcheck]

> **`postgres_data` named volume:** Persists PostgreSQL data across `docker compose down` restarts. Data is lost with `docker compose down -v` (explicit volume removal).

### Root `.env.example`

```
# MotivaTodo — Root Docker Compose Environment Variables
# Copy this file to .env for local development:
#   cp .env.example .env
# .env is gitignored — never commit credentials

# ─── PostgreSQL ───────────────────────────────────────────────
POSTGRES_DB=motivatodo
POSTGRES_USER=motivatodo
POSTGRES_PASSWORD=motivatodo

# ─── Backend ──────────────────────────────────────────────────
# DATABASE_URL uses service name 'postgres' as hostname (Docker internal network)
DATABASE_URL=postgres://motivatodo:motivatodo@postgres:5432/motivatodo
PORT=3000
# CORS_ORIGIN: must match the browser-facing frontend URL
# Docker compose: http://localhost:8080 (nginx serves frontend here)
# Local dev (no Docker): http://localhost:5173 (Vite dev server)
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info

# ─── Frontend (BUILD TIME — requires docker compose build to take effect) ─────
VITE_API_URL=http://localhost:3000

# ─── Port Mappings (host machine ports) ───────────────────────
POSTGRES_PORT=5432
BACKEND_PORT=3000
FRONTEND_PORT=8080
```

### Project Structure After This Story

```
(project root)/
├── .env.example           ← NEW: template for compose env vars
├── .env                   ← NEW: local compose env vars (gitignored)
├── docker-compose.yml     ← NEW: orchestrates all 3 containers
│
├── backend/
│   ├── Dockerfile         ← NEW: multi-stage Node build
│   └── (existing files unchanged)
│
└── frontend/
    ├── Dockerfile         ← NEW: multi-stage Vite + nginx build
    ├── nginx.conf         ← NEW: SPA-aware nginx config
    └── (existing files unchanged)
```

### Architecture Compliance

Per [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]:

- ✅ `postgres:17` image — architecture specifies 17 as the stable fallback
- ✅ nginx alpine for frontend — minimal production image
- ✅ Node LTS alpine + multi-stage for backend — no devDependencies in final image
- ✅ `GET /health` used as backend healthcheck endpoint
- ✅ `postgres` service healthcheck so backend waits for DB to be ready
- ✅ `frontend depends_on backend (service_healthy)`
- ✅ `.env` at root for all compose-level configuration

### Git Intelligence

- `fd8e695 bmad: backend scaffholding` — `app.ts` factory, `server.ts`, `health.route.ts`, all plugins registered
- `380e425 bmad: imple 1.1` — monorepo root with `package.json`, `tsconfig.base.json`
- No Dockerfiles exist in any commit history — all Docker files are brand new in this story

### Database Migration Note

Story 1.4 established an **empty schema** (`db/schema.ts` exports nothing yet). Running `docker compose exec backend npm run db:push` after the stack is up will connect to postgres and confirm tooling works, but will create no tables (tables are added in Epics 2 and 3). This is expected behavior — the story only requires the containers start and health checks pass.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created

### File List
