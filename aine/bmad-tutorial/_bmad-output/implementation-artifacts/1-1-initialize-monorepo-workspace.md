# Story 1.1: Initialize Monorepo Workspace

Status: done

## Story

As a **developer**,
I want a working monorepo with root-level tooling configured,
so that frontend and backend can be developed and run as a unified project.

## Acceptance Criteria

1. **Given** the repository is cloned, **When** I run `npm install` at the root, **Then** all workspace dependencies for both `frontend/` and `backend/` are installed.
2. Root `package.json` defines `workspaces: ["frontend", "backend"]`.
3. A shared `tsconfig.base.json` at root provides common TypeScript compiler options (strict mode).
4. `README.md` at root documents how to install, run, and test the project.

## Tasks / Subtasks

- [x] Task 1 — Create root workspace configuration (AC: 1, 2)
  - [x] Create `package.json` at root with `"workspaces": ["frontend", "backend"]`, `"private": true`, and convenience scripts (`install`, `dev`, `build`, `test`)
  - [x] Create `tsconfig.base.json` at root (see Dev Notes for exact content)
  - [x] Create `.gitignore` at root (node_modules, dist, .env)

- [x] Task 2 — Initialize frontend workspace (AC: 1)
  - [x] Run `npm create vite@latest frontend -- --template react-ts` from repo root
  - [x] `cd frontend && npx shadcn@latest init` — use default settings (New York style, zinc base color, CSS variables)
  - [x] Confirm `frontend/package.json` is present and Vite + React 19 + TypeScript are listed as dependencies
  - [x] Create `frontend/.env.example` with content: `VITE_API_URL=http://localhost:3000`
  - [x] Verify `npm run dev` inside `frontend/` starts the Vite dev server without errors

- [x] Task 3 — Initialize backend workspace (AC: 1)
  - [x] Run from repo root: `mkdir backend && cd backend && npm init -y`
  - [x] Install production deps: `npm install fastify@5 @fastify/cors @fastify/helmet @fastify/rate-limit @fastify/env drizzle-orm postgres`
  - [x] Install dev deps: `npm install -D typescript @types/node drizzle-kit`
  - [x] Run `npx tsc --init` inside `backend/` — then update `tsconfig.json` to extend `../tsconfig.base.json`
  - [x] Create `backend/.env.example` with content:
    ```
    DATABASE_URL=postgres://motivatodo:motivatodo@localhost:5432/motivatodo
    PORT=3000
    CORS_ORIGIN=http://localhost:5173
    ```
  - [x] Create stub `backend/src/server.ts` (empty entrypoint — will be implemented in Story 1.2)
  - [x] Verify `node --test` in `backend/` runs with zero test files found (no errors)

- [x] Task 4 — Create root README.md (AC: 4)
  - [x] Document: prerequisites (Node LTS, Docker), install (`npm install`), dev start instructions for frontend and backend, test commands for both workspaces

- [x] Task 5 — Smoke-test workspace linking
  - [x] Run `npm install` from root and confirm both `frontend/node_modules` and `backend/node_modules` are populated (or correctly symlinked via workspace hoisting)
  - [x] Run `npm run test --workspace=frontend` and `npm run test --workspace=backend` — both should exit cleanly (no test files yet is OK)

## Dev Notes

### Root `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "erasableSyntaxOnly": true
  }
}
```

> **Note:** `frontend/tsconfig.json` extends this but overrides `module`/`moduleResolution` to `bundler` (Vite requirement). `backend/tsconfig.json` extends this and keeps `NodeNext`.

> **`erasableSyntaxOnly`:** Required for Node.js native TypeScript execution (`--experimental-strip-types`). It disallows TypeScript syntax that cannot be stripped without transformation — specifically `enum`, `namespace`, and constructor parameter properties. Use `const` object literals instead of `enum`, plain class properties instead of constructor parameter properties.

> **Backend dev execution:** Use Node.js native type stripping — no `tsx` or `ts-node` dependency needed. The backend `dev` script should be: `node --experimental-strip-types --watch src/server.ts`. This requires Node.js 22.6+ (LTS). The `--watch` flag restarts on file changes.

### Root `package.json` scaffold

```json
{
  "name": "motivatodo",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:backend": "npm run dev --workspace=backend",
    "test:frontend": "npm run test --workspace=frontend",
    "test:backend": "npm run test --workspace=backend",
    "build": "npm run build --workspace=frontend && npm run build --workspace=backend"
  }
}
```

### Exact Versions in Play (CRITICAL — do NOT deviate)

| Package      | Version             | Notes                                                    |
| ------------ | ------------------- | -------------------------------------------------------- |
| Vite         | 7.3.1               | Frontend build tool                                      |
| React        | 19.2.4              | UI framework                                             |
| shadcn/ui    | 3.8.5               | Component library, Radix UI primitives                   |
| Tailwind CSS | bundled with shadcn | Utility-first styling                                    |
| React Router | v7                  | Client-side routing (installed in Story 1.3)             |
| Fastify      | 5.7.4               | Backend framework                                        |
| Drizzle ORM  | 0.45.1              | TypeScript-first ORM                                     |
| postgres     | driver for Drizzle  | Raw postgres driver                                      |
| TypeScript   | latest LTS          | Strict mode in both workspaces                           |
| Node.js      | 22.6+ (LTS)         | Runtime; 22.6+ required for `--experimental-strip-types` |

> **Warning:** `npm create vite@latest` will install the latest Vite version. After scaffolding, pin `"vite": "7.3.1"` in `frontend/package.json` and run `npm install` again to lock the version.

### Project Structure Being Created by This Story

```
motivatodo/                      ← repo root
├── package.json                 ← workspaces: ["frontend", "backend"]
├── tsconfig.base.json           ← shared TS compiler options
├── .gitignore
├── README.md
│
├── frontend/                    ← created by `npm create vite@latest`
│   ├── package.json
│   ├── tsconfig.json            ← extends ../tsconfig.base.json, overrides for Vite
│   ├── tsconfig.app.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env.example             ← VITE_API_URL=http://localhost:3000
│   └── src/
│       ├── main.tsx
│       └── App.tsx              ← Vite default (will be replaced in Story 1.3)
│
└── backend/                     ← created by mkdir + npm init
    ├── package.json
    ├── tsconfig.json            ← extends ../tsconfig.base.json
    ├── .env.example             ← DATABASE_URL, PORT, CORS_ORIGIN
    ├── src/
    │   └── server.ts            ← empty stub (fully implemented in Story 1.2)
    └── test/                    ← all backend tests live here (not co-located)
```

> **Scope boundary:** This story creates the skeleton. Story 1.2 implements the full Fastify backend. Story 1.3 implements the full React frontend shell. Story 1.4 adds DB connection and Drizzle config. Story 1.5 adds Docker Compose.

### Naming & Convention Rules (All Stories Must Follow)

- React components: `PascalCase` files — `TodoItem.tsx`
- Hooks: `camelCase` with `use` prefix — `useTodos.ts`
- Backend route files: `kebab-case` — `todos.route.ts`
- Backend plugin files: `kebab-case` — `auth.plugin.ts`
- DB columns: `snake_case` — `user_id`, `created_at`
- API JSON fields: `camelCase` — `userId`, `createdAt`
- Header key: `X-User-Id` (exact casing — every agent must use this exact string)
- localStorage key: `motivatodo_user_id` (exact string)
- Environment vars: `SCREAMING_SNAKE_CASE` — `DATABASE_URL`, `VITE_API_URL`

### shadcn Init Notes

When running `npx shadcn@latest init`, accept all defaults unless prompted for:

- Style: **New York**
- Base color: **zinc**
- CSS variables: **yes**

These settings align with the visual aging zinc-palette design (Stories 4.1+) — the `bg-zinc-100` through `bg-zinc-400` tiers require zinc as the base color.

### Testing Framework Setup

- **Backend:** Node built-in `--test` runner. No Jest/Vitest on backend. Test files live under `backend/test/` — **not** co-located with source. Import source via `../src/`.
- **Frontend:** Vitest + React Testing Library. Test files co-located: `*.test.tsx`.

Neither testing framework needs explicit setup in this story — the scaffolding from `npm create vite@latest` pre-configures Vitest for the frontend, and `node --test` requires no configuration for the backend. Verify both run cleanly.

### Project Structure Notes

- **Monorepo root has no `src/`** — it only contains workspace config, shared TS config, README, and docker-compose.yml (added in Story 1.5)
- **No shared package** between frontend and backend in MVP — TypeScript interfaces (e.g., `Todo`) are duplicated in both `frontend/src/types.ts` and `backend/src/types.ts`
- **npm workspaces hoisting:** Dependencies may be hoisted to root `node_modules`. This is expected behavior. Each workspace should still declare its own deps in its own `package.json`.

### References

- Monorepo structure and exact initialization commands: [architecture.md](../planning-artifacts/architecture.md#starter-template-evaluation)
- Framework versions table: [architecture.md](../planning-artifacts/architecture.md#frontend--vite-7--react-19--typescript--shadcnui)
- Naming conventions: [architecture.md](../planning-artifacts/architecture.md#naming-patterns)
- Complete project directory structure: [architecture.md](../planning-artifacts/architecture.md#complete-project-directory-structure)
- Story scope: [epics.md](../planning-artifacts/epics.md#story-11-initialize-monorepo-workspace)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

- shadcn init required Tailwind CSS v4 to be installed first (`tailwindcss @tailwindcss/vite`) and the `@` import alias configured in both `tsconfig.json` and `tsconfig.app.json` before `shadcn init -y --base-color zinc` succeeded.
- Backend `package.json` scripts needed manual update after `npm install --workspace=backend` ran.
- Frontend `vitest run` exits with code 1 on no test files by default — fixed with `--passWithNoTests` flag.
- npm workspaces hoists dependencies to root `node_modules` — this is expected.

### Completion Notes List

- All 5 tasks completed.
- shadcn/ui initialized with New York style + zinc base color + CSS variables.
- Both `npm run test:frontend` and `npm run test:backend` exit with code 0.
- Frontend uses Tailwind CSS v4 with `@tailwindcss/vite` plugin.
- Backend dev script uses `node --experimental-strip-types --watch` (no tsx/ts-node needed).

### File List

- `package.json` (root)
- `tsconfig.base.json` (root)
- `.gitignore` (root)
- `README.md` (root)
- `frontend/` (Vite scaffold via `npm create vite@latest`)
- `frontend/tsconfig.json` (path alias added)
- `frontend/tsconfig.app.json` (extends base, bundler mode overrides)
- `frontend/vite.config.ts` (Tailwind + path alias)
- `frontend/src/index.css` (Tailwind v4 import + shadcn CSS vars)
- `frontend/src/lib/utils.ts` (created by shadcn)
- `frontend/components.json` (shadcn config)
- `frontend/.env.example`
- `backend/package.json`
- `backend/tsconfig.json` (extends base)
- `backend/.env.example`
- `backend/src/server.ts` (stub)
- `backend/test/README.md`
