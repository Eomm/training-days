# Story 1.3: Frontend Application Skeleton

Status: done

## Story

As a **developer**,
I want a running frontend shell with React Router, shadcn/ui, and Tailwind configured,
so that the frontend is ready to receive pages and components.

## Acceptance Criteria

1. **Given** the frontend dependencies are installed, **When** I run `vite dev`, **Then** the app loads in the browser without errors.
2. React Router v7 is configured with a root layout and a placeholder index route (`HomePage`).
3. shadcn/ui and Tailwind CSS are configured and a sample shadcn component renders correctly on the page.
4. `VITE_API_URL` is the only required env variable, documented in `.env.example`.
5. Running `vitest` executes frontend tests with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Install React Router v7 (AC: 2)
  - [x] `npm install react-router@7 --workspace=frontend`
  - [x] Confirm no peer-dep conflicts with React 19.2.4

- [x] Task 2 — Add a shadcn `Button` component to verify shadcn works (AC: 3)
  - [x] `cd frontend && npx shadcn@latest add button`
  - [x] This generates `frontend/src/components/ui/Button.tsx` (or `button.tsx`) — do **not** hand-write it
  - [x] Verify the component file exists and imports compile cleanly

- [x] Task 3 — Create `frontend/src/types.ts` (AC: 1)
  - [x] Define shared TypeScript interfaces used across the whole frontend (see Dev Notes for exact shapes)
  - [x] Export `Todo`, `GuestResponse` — these are consumed by hooks and components in later stories

- [x] Task 4 — Wire React Router in `App.tsx` (AC: 1, 2)
  - [x] Replace Vite default `App.tsx` entirely
  - [x] Set up `BrowserRouter` (or `createBrowserRouter`) with a root layout and index route pointing to `HomePage`
  - [x] Root layout wraps children in a `<main>` container — no nav bar needed in this story
  - [x] `HomePage` is a placeholder (`<h1>MotivaTodo</h1>` + shadcn `<Button>` to verify shadcn renders)

- [x] Task 5 — Create `frontend/src/pages/HomePage.tsx` (AC: 1, 2, 3)
  - [x] Placeholder page: renders an `<h1>MotivaTodo</h1>` and a shadcn `<Button variant="default">Add Task</Button>`
  - [x] This confirms React Router route, shadcn import, and Tailwind styles all work end-to-end
  - [x] Full implementation (todo list, input, etc.) happens in Stories 3+

- [x] Task 6 — Create `frontend/src/lib/` stubs (AC: 1)
  - [x] Create `frontend/src/lib/api.ts` — stub only: exports a typed `apiFetch` function that throws `'not implemented'`; real implementation in Story 2.3
  - [x] Create `frontend/src/lib/identity.ts` — stub only: exports `getUserId` and `setUserId` that throw `'not implemented'`; real implementation in Story 2.3
  - [x] These stubs establish file locations so later stories import from the correct paths

- [x] Task 7 — Confirm env variable setup (AC: 4)
  - [x] `frontend/.env.example` contains exactly: `VITE_API_URL=http://localhost:3000`
  - [x] `frontend/.env.local` (gitignored) contains the same for local dev — document in README
  - [x] Reference `VITE_API_URL` in `api.ts` stub as `import.meta.env.VITE_API_URL` to confirm Vite env wiring works

- [x] Task 8 — Write smoke tests (AC: 5)
  - [x] Create `frontend/src/pages/HomePage.test.tsx`
  - [x] Test 1: `<HomePage />` renders without throwing
  - [x] Test 2: page contains `MotivaTodo` heading text
  - [x] Use Vitest + React Testing Library (`render`, `screen`)
  - [x] Confirm `npm run test --workspace=frontend` exits with zero failures

- [x] Task 9 — Update `frontend/package.json` scripts
  - [x] `"dev": "vite"` — confirm present (Vite scaffold adds this)
  - [x] `"build": "tsc -b && vite build"`
  - [x] `"test": "vitest run"`
  - [x] `"test:watch": "vitest"`

## Dev Notes

### CRITICAL: `tsconfig.json` Override for Vite

`frontend/tsconfig.json` **must** extend `../tsconfig.base.json` but override `module` and `moduleResolution` because Vite uses its own bundler (not NodeNext):

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src"]
}
```

> `erasableSyntaxOnly` is inherited from `tsconfig.base.json` — do not remove it. It applies to frontend too (no `enum`, no constructor parameter properties).

### React Router v7 Setup

Use `createBrowserRouter` (data router API — not `<BrowserRouter>`) as this is the current v7 pattern:

```tsx
// frontend/src/App.tsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { HomePage } from "./pages/HomePage.js";

function RootLayout() {
  return (
    <main className="min-h-screen bg-white">
      <Outlet />
    </main>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// frontend/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

> **Import extension:** With `moduleResolution: bundler` in Vite, extensions in imports are **optional** (unlike NodeNext). However, use `.js` consistently for local imports to match the backend convention and avoid confusion.

### `frontend/src/types.ts` — Shared Interfaces

Define now so all future stories import from this single location:

```typescript
// frontend/src/types.ts

export interface Todo {
  id: string; // UUID
  userId: string; // UUID
  text: string;
  done: boolean;
  createdAt: string; // ISO 8601 string e.g. "2026-03-02T09:00:00.000Z"
}

export interface GuestResponse {
  userId: string; // UUID assigned by POST /guest
}
```

> These interfaces are duplicated in `backend/src/types.ts` (no shared package in MVP). Both must stay in sync.

### `frontend/src/lib/api.ts` — Stub

```typescript
// frontend/src/lib/api.ts
// Real implementation in Story 2.3 — stub establishes the file path and signature

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  throw new Error("apiFetch not implemented yet — Story 2.3");
}
```

### `frontend/src/lib/identity.ts` — Stub

```typescript
// frontend/src/lib/identity.ts
// Real implementation in Story 2.3

const KEY = "motivatodo_user_id"; // exact localStorage key — never change this string

export function getUserId(): string | null {
  throw new Error("getUserId not implemented yet — Story 2.3");
}

export function setUserId(id: string): void {
  throw new Error("setUserId not implemented yet — Story 2.3");
}
```

> **`motivatodo_user_id`** is the exact localStorage key mandated by the architecture. The constant is defined here so every story imports it from this file — never hardcode the string elsewhere.

### `HomePage` Placeholder

```tsx
// frontend/src/pages/HomePage.tsx
import { Button } from "../components/ui/button.js";

export function HomePage() {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-bold">MotivaTodo</h1>
      <Button variant="default">Add Task</Button>
    </div>
  );
}
```

> The `Button` import path (`components/ui/button`) is generated by shadcn — verify the exact casing after running `npx shadcn@latest add button`. It may be `button.tsx` (lowercase) or `Button.tsx` depending on shadcn version.

### HomePage Smoke Test

```tsx
// frontend/src/pages/HomePage.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage.js";

describe("HomePage", () => {
  it("renders without throwing", () => {
    render(<HomePage />);
  });

  it("displays the MotivaTodo heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /motivatodo/i })).toBeDefined();
  });
});
```

> Tests are **co-located** with source files (`*.test.tsx` next to `*.tsx`) — this is the frontend convention. Only the backend uses a separate `test/` directory.

### Vitest Config — Verify Setup

`vite.config.ts` should include a `test` block (added by `npm create vite@latest` if `--template react-ts` was used, or add manually):

```typescript
// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
  },
});
```

Create `frontend/src/test-setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

Install testing deps if not already present:

```
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom --workspace=frontend
```

### Exact Versions Reminder

| Package      | Version                      |
| ------------ | ---------------------------- |
| React        | 19.2.4                       |
| Vite         | 7.3.1                        |
| shadcn/ui    | 3.8.5                        |
| React Router | v7 (latest `react-router@7`) |
| Tailwind CSS | bundled with shadcn          |

> After `npm create vite@latest`, pin `"vite": "7.3.1"` in `frontend/package.json` if the scaffolder pulled a newer version.

### Project Structure After This Story

```
frontend/src/
├── main.tsx                  ← REPLACE: mounts App with StrictMode
├── App.tsx                   ← REPLACE: createBrowserRouter setup
├── index.css                 ← Tailwind directives (generated by shadcn init)
├── types.ts                  ← NEW: Todo, GuestResponse interfaces
├── test-setup.ts             ← NEW: @testing-library/jest-dom import
│
├── components/
│   └── ui/
│       └── button.tsx        ← GENERATED by shadcn — do not hand-write
│
├── lib/
│   ├── api.ts                ← NEW stub (real impl Story 2.3)
│   └── identity.ts           ← NEW stub (real impl Story 2.3)
│
└── pages/
    ├── HomePage.tsx          ← NEW: placeholder page
    └── HomePage.test.tsx     ← NEW: smoke tests
```

### Scope Boundary

| Concern                             | This story | Later story |
| ----------------------------------- | ---------- | ----------- |
| React Router + root layout          | ✅         | —           |
| shadcn + Tailwind configured        | ✅         | —           |
| `types.ts` interfaces               | ✅         | —           |
| `api.ts` and `identity.ts` stubs    | ✅         | —           |
| `useGuestIdentity` hook             | ❌         | Story 2.3   |
| `useTodos` hook                     | ❌         | Story 3.1   |
| `TodoInput`, `TodoList`, `TodoItem` | ❌         | Story 3.2+  |
| `useAgeHighlight` / visual aging    | ❌         | Story 4.1   |
| Mobile layout / WCAG                | ❌         | Story 5.1+  |
| `nginx.conf` and `Dockerfile`       | ❌         | Story 1.5   |

### Architecture Compliance Checklist

- [ ] `tsconfig.json` extends `../tsconfig.base.json` and overrides `module`/`moduleResolution` to `bundler`
- [ ] `erasableSyntaxOnly: true` inherited — no `enum` or constructor parameter properties used
- [ ] shadcn init used **zinc** base color and **New York** style (required for Story 4.1 visual aging tiers)
- [ ] React Router uses `createBrowserRouter` (data router API, not legacy `<BrowserRouter>`)
- [ ] `VITE_API_URL` accessed via `import.meta.env.VITE_API_URL` (not `process.env`)
- [ ] `motivatodo_user_id` localStorage key constant defined in `identity.ts` — never hardcoded elsewhere
- [ ] Frontend test files co-located with source (`*.test.tsx` next to `*.tsx`)
- [ ] shadcn `Button` component generated via CLI — not hand-written

### References

- Frontend initialization commands: [architecture.md](../planning-artifacts/architecture.md#frontend--vite-7--react-19--typescript--shadcnui)
- Code organization: [architecture.md](../planning-artifacts/architecture.md#structure-patterns) — `src/components/`, `src/hooks/`, `src/lib/`, `src/pages/`
- `Todo` / `GuestResponse` interface shapes: [architecture.md](../planning-artifacts/architecture.md#format-patterns)
- `motivatodo_user_id` localStorage key: [architecture.md](../planning-artifacts/architecture.md#communication-patterns)
- Testing: Vitest + React Testing Library, co-located `*.test.tsx`: [architecture.md](../planning-artifacts/architecture.md#frontend-architecture)
- Story scope: [epics.md](../planning-artifacts/epics.md#story-13-frontend-application-skeleton)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

- shadcn Button generated as `button.tsx` (lowercase) — import path confirmed as `../components/ui/button.js`
- `tsconfig.app.json` already correctly extends `../tsconfig.base.json` with `module: ESNext` / `moduleResolution: bundler` overrides — no changes needed
- `.env.example` already existed with correct content
- `vite.config.ts` updated to add `test` block (jsdom, globals, setupFiles)
- Installed: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`

### Completion Notes List

- All 9 tasks complete; 2/2 tests pass (`vitest run`)
- `App.tsx` replaced entirely with `createBrowserRouter` data-router API pattern
- `main.tsx` updated to use named `App` export
- `apiFetch` stub references `import.meta.env.VITE_API_URL` to confirm Vite env wiring

### File List

- `frontend/src/App.tsx` — REPLACED: createBrowserRouter router setup
- `frontend/src/main.tsx` — UPDATED: named App import
- `frontend/src/types.ts` — NEW: Todo, GuestResponse interfaces
- `frontend/src/pages/HomePage.tsx` — NEW: placeholder page
- `frontend/src/pages/HomePage.test.tsx` — NEW: smoke tests
- `frontend/src/lib/api.ts` — NEW: apiFetch stub
- `frontend/src/lib/identity.ts` — NEW: getUserId/setUserId stubs
- `frontend/src/test-setup.ts` — NEW: @testing-library/jest-dom setup
- `frontend/src/components/ui/button.tsx` — GENERATED by shadcn CLI
- `frontend/vite.config.ts` — UPDATED: added test block
- `frontend/package.json` — UPDATED: test/test:watch scripts, added testing deps
- `frontend/.env.example` — VERIFIED: VITE_API_URL=http://localhost:3000
- `frontend/.env.local` — NEW: VITE_API_URL=http://localhost:3000
