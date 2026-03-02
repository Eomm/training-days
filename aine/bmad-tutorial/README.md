# MotivatoDo

A motivational todo app — monorepo with Fastify backend and React frontend.

## Prerequisites

- **Node.js** 22.6+ (LTS) — required for native TypeScript execution via `--experimental-strip-types`
- **Docker** — required for running PostgreSQL locally (added in Story 1.5)
- **npm** 10+

## Install

```bash
npm install
```

This installs all dependencies for both `frontend/` and `backend/` workspaces.

## Development

Start the frontend dev server:

```bash
npm run dev:frontend
```

The Vite dev server runs at <http://localhost:5173>.

Start the backend dev server:

```bash
npm run dev:backend
```

The Fastify server runs at <http://localhost:3000>. Uses Node.js native type stripping — no build step needed.

## Build

```bash
npm run build
```

Builds both frontend (Vite) and backend (TypeScript compiler).

## Tests

Run frontend tests (Vitest):

```bash
npm run test:frontend
```

Run backend tests (Node built-in test runner):

```bash
npm run test:backend
```

## Project Structure

```
motivatodo/
├── package.json          # Monorepo root — workspaces: ["frontend", "backend"]
├── tsconfig.base.json    # Shared TypeScript compiler options
├── .gitignore
├── README.md
├── frontend/             # Vite + React 19 + TypeScript + shadcn/ui
│   ├── src/
│   └── ...
└── backend/              # Fastify 5 + Drizzle ORM + TypeScript
    ├── src/
    ├── test/
    └── ...
```

## Docker Compose

Run the full stack (PostgreSQL + backend + frontend) with Docker Compose:

```bash
docker compose up -d
```

| Service    | URL                   |
| ---------- | --------------------- |
| Frontend   | http://localhost:8080 |
| Backend    | http://localhost:3000 |
| PostgreSQL | localhost:5432        |

Rebuild images after code changes:

```bash
docker compose build
```

Rebuild and restart in one command:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f            # all services
docker compose logs -f backend    # single service
```

Stop all services:

```bash
docker compose down
```

Stop and remove volumes (wipes database):

```bash
docker compose down -v
```

### Default Environment Variables

| Variable            | Default                                                   |
| ------------------- | --------------------------------------------------------- |
| `POSTGRES_DB`       | motivatodo                                                |
| `POSTGRES_USER`     | motivatodo                                                |
| `POSTGRES_PASSWORD` | motivatodo                                                |
| `POSTGRES_PORT`     | 5432                                                      |
| `DATABASE_URL`      | postgres://motivatodo:motivatodo@postgres:5432/motivatodo |
| `PORT`              | 3000                                                      |
| `CORS_ORIGIN`       | http://localhost:8080                                     |
| `VITE_API_URL`      | http://localhost:3000                                     |
| `FRONTEND_PORT`     | 8080                                                      |
| `BACKEND_PORT`      | 3000                                                      |

Override any variable by setting it in a `.env` file at the project root or inline:

```bash
FRONTEND_PORT=9090 docker compose up -d
```

## Environment Variables

Copy the example env files before running locally:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your local database credentials.
