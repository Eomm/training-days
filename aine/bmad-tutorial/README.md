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

## Environment Variables

Copy the example env files before running locally:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your local database credentials.
