# Story 2.3: Client-Side Identity Initialization

Status: done

## Story

As a **returning user**,
I want the app to remember my anonymous ID across browser sessions,
So that my todo list is available every time I return without any login.

## Acceptance Criteria

1. **Given** I open the app for the first time (no `motivatodo_user_id` in localStorage), **When** the app initializes, **Then** `POST /guest` is called automatically and the returned `userId` is stored as `motivatodo_user_id` in localStorage.
2. **Given** I open the app again (with `motivatodo_user_id` already in localStorage), **When** the app initializes, **Then** `POST /guest` is NOT called again — the stored ID is reused.
3. All subsequent API requests (beyond this story) include `X-User-Id: <userId>` header — the `apiFetch` wrapper handles this automatically.
4. A `useGuestIdentity` hook exported from `frontend/src/hooks/useGuestIdentity.ts` encapsulates the initialization logic and returns `{ userId, isLoading }`.
5. `App.tsx` calls `useGuestIdentity` and renders a loading state while `isLoading === true`.
6. `frontend/src/lib/identity.ts` implements `getUserId(): string | null` and `setUserId(id: string): void` using `localStorage` with key `motivatodo_user_id`.
7. `frontend/src/lib/api.ts` implements `apiFetch<T>(path, init?)` — prepends `VITE_API_URL`, attaches `X-User-Id` header from localStorage, throws on non-ok responses.
8. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Implement `frontend/src/lib/identity.ts` (AC: 1, 2, 6)
  - [x] Remove stub implementation and `@ts-ignore` comment
  - [x] `getUserId()`: return `localStorage.getItem('motivatodo_user_id')` (may be null)
  - [x] `setUserId(id)`: call `localStorage.setItem('motivatodo_user_id', id)`
  - [x] Keep the `KEY` constant as-is — it is the canonical definition of the localStorage key
  - [x] See Dev Notes for exact file content

- [x] Task 2 — Implement `frontend/src/lib/api.ts` (AC: 3, 7)
  - [x] Remove stub implementation
  - [x] `apiFetch<T>(path, init?)`:
    - [x] Read `baseUrl` from `import.meta.env.VITE_API_URL` (e.g. `http://localhost:3000`)
    - [x] Read `userId` from `getUserId()` imported from `./identity.ts`
    - [x] Build headers: spread `init?.headers`, conditionally add `'X-User-Id': userId` when userId is non-null
    - [x] Call `fetch(\`\${baseUrl}\${path}\`, { ...init, headers })`
    - [x] If `!response.ok` → throw an `Error` with message `\`HTTP \${response.status}\``
    - [x] Return `response.json() as Promise<T>`
  - [x] See Dev Notes for exact file content

- [x] Task 3 — Create `frontend/src/hooks/useGuestIdentity.ts` (AC: 1, 2, 4, 5)
  - [x] Create `frontend/src/hooks/` directory (first hook — folder doesn't exist yet)
  - [x] Import `useState`, `useEffect` from `react`
  - [x] Import `getUserId`, `setUserId` from `../lib/identity.ts`
  - [x] Import `apiFetch` from `../lib/api.ts`
  - [x] Import `GuestResponse` from `../types.ts`
  - [x] Hook signature: `export function useGuestIdentity(): { userId: string | null; isLoading: boolean }`
  - [x] Initial state: `userId = getUserId()` (reads localStorage synchronously), `isLoading = userId === null`
  - [x] `useEffect([], [])`: if `userId` is already set → do nothing (skip `POST /guest`)
  - [x] `useEffect`: call `apiFetch<GuestResponse>('/guest', { method: 'POST' })`, store returned `userId` via `setUserId`, update state
  - [x] Set `isLoading = false` in finally block — always resolves regardless of success/error
  - [x] On error: log to console, still set `isLoading = false`
  - [x] See Dev Notes for exact implementation

- [x] Task 4 — Update `frontend/src/App.tsx` to integrate identity (AC: 5)
  - [x] Import `useGuestIdentity` from `./hooks/useGuestIdentity.ts`
  - [x] Call `useGuestIdentity()` inside `RootLayout`
  - [x] While `isLoading === true`, render centred `<p>Loading…</p>`
  - [x] When `isLoading === false`, render `<Outlet />` normally
  - [x] Router setup unchanged — only `RootLayout` modified
  - [x] See Dev Notes for exact diff

- [x] Task 5 — Write tests (AC: 8)
  - [x] `frontend/src/lib/identity.test.ts` — 3 unit tests, all pass
  - [x] `frontend/src/lib/api.test.ts` — 4 unit tests, all pass
  - [x] `frontend/src/hooks/useGuestIdentity.test.ts` — 4 hook tests, all pass
  - [x] Run `npm run test --workspace=frontend` — 13/13 tests pass (4 pre-existing + 11 new)
  - [ ] Run `npm run test --workspace=frontend` — all existing tests must still pass
  - [ ] See Dev Notes for exact test patterns

## Dev Notes

### Exact: `frontend/src/lib/identity.ts`

```typescript
// frontend/src/lib/identity.ts
const KEY = "motivatodo_user_id"; // exact localStorage key — never change this string

export function getUserId(): string | null {
  return localStorage.getItem(KEY);
}

export function setUserId(id: string): void {
  localStorage.setItem(KEY, id);
}
```

### Exact: `frontend/src/lib/api.ts`

```typescript
// frontend/src/lib/api.ts
import { getUserId } from "./identity.ts";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  const userId = getUserId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
    ...(userId ? { "X-User-Id": userId } : {}),
  };

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

> **`Content-Type: application/json`** — set by default for all requests so POST/PATCH bodies are parsed correctly by Fastify. `POST /guest` has no body but the header is harmless.

> **`VITE_API_URL` fallback:** `?? 'http://localhost:3000'` ensures the hook works in Vitest (jsdom) where `import.meta.env.VITE_API_URL` is undefined unless configured in `vite.config.ts`. For tests, mock `fetch` directly and don't rely on the URL value.

### Exact: `frontend/src/hooks/useGuestIdentity.ts`

```typescript
// frontend/src/hooks/useGuestIdentity.ts
import { useState, useEffect } from "react";
import { getUserId, setUserId } from "../lib/identity.ts";
import { apiFetch } from "../lib/api.ts";
import type { GuestResponse } from "../types.ts";

export function useGuestIdentity(): {
  userId: string | null;
  isLoading: boolean;
} {
  const [userId, setUserIdState] = useState<string | null>(getUserId);
  const [isLoading, setIsLoading] = useState<boolean>(userId === null);

  useEffect(() => {
    // If identity already initialised (e.g. returning visitor), skip the POST /guest call
    if (userId !== null) return;

    let cancelled = false;

    apiFetch<GuestResponse>("/guest", { method: "POST" })
      .then((data) => {
        if (cancelled) return;
        setUserId(data.userId);
        setUserIdState(data.userId);
      })
      .catch((err) => {
        console.error("Failed to initialise guest identity:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — intentionally empty deps array

  return { userId, isLoading };
}
```

> **Cancellation flag:** React 18+ StrictMode double-invokes effects in development. The `cancelled` flag prevents state updates from the first (torn-down) invocation from landing after the second invocation has already set state.

> **`useState<string | null>(getUserId)`** — passing the function reference (not `getUserId()`) as the initial state callback means localStorage is only read once on mount (lazy initializer), not on every render.

> **`isLoading` initial value:** `userId === null` — if returning visitor (userId already in localStorage), `isLoading` starts `false` so no loading flash occurs.

### Exact: `App.tsx` Changes

Only `RootLayout` needs updating:

```tsx
import { useGuestIdentity } from "./hooks/useGuestIdentity.ts";

function RootLayout() {
  const { isLoading } = useGuestIdentity();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Outlet />
    </main>
  );
}
```

> `userId` is not used in `RootLayout` directly — future stories will access it through `apiFetch` (which reads localStorage internally) or via context. Do NOT add React context in this story — that is out of scope.

### Test Patterns

**identity.test.ts — localStorage is available in jsdom:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getUserId, setUserId } from "./identity.ts";

describe("identity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getUserId returns null when key is absent", () => {
    expect(getUserId()).toBeNull();
  });

  it("getUserId returns value after setUserId", () => {
    setUserId("abc-123");
    expect(getUserId()).toBe("abc-123");
  });

  it("setUserId writes to localStorage with correct key", () => {
    setUserId("xyz-456");
    expect(localStorage.getItem("motivatodo_user_id")).toBe("xyz-456");
  });
});
```

**api.test.ts — mock fetch:**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { apiFetch } from "./api.ts";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls fetch with correct URL and returns parsed JSON", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userId: "u1" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch<{ userId: string }>("/guest", {
      method: "POST",
    });
    expect(result).toEqual({ userId: "u1" });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("includes X-User-Id header when userId is in localStorage", async () => {
    localStorage.setItem("motivatodo_user_id", "test-user-id");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/some-route");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["X-User-Id"]).toBe(
      "test-user-id",
    );
  });

  it("does not include X-User-Id when localStorage is empty", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/some-route");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(
      (options.headers as Record<string, string>)["X-User-Id"],
    ).toBeUndefined();
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400 }),
    );
    await expect(apiFetch("/bad")).rejects.toThrow("HTTP 400");
  });
});
```

**useGuestIdentity.test.ts — renderHook:**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGuestIdentity } from "./useGuestIdentity.ts";

describe("useGuestIdentity", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns isLoading=false immediately when userId already in localStorage", () => {
    localStorage.setItem("motivatodo_user_id", "existing-id");
    const { result } = renderHook(() => useGuestIdentity());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.userId).toBe("existing-id");
  });

  it("calls POST /guest and sets userId when localStorage is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ userId: "new-uuid" }),
      }),
    );

    const { result } = renderHook(() => useGuestIdentity());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.userId).toBe("new-uuid");
    expect(localStorage.getItem("motivatodo_user_id")).toBe("new-uuid");
  });

  it("does not call POST /guest when userId already present", () => {
    localStorage.setItem("motivatodo_user_id", "existing-id");
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    renderHook(() => useGuestIdentity());
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
```

### Name: `useGuestIdentity` vs `useIdentity`

The epics spec mentions `useIdentity` while the architecture document specifies `useGuestIdentity` in `hooks/useGuestIdentity.ts`. Architecture is the source of truth — use `useGuestIdentity`. Future stories (e.g. registration in Epic 5) may introduce a broader `useIdentity` context provider.

### Testing Framework: Frontend vs Backend

Unlike the backend (Node test runner + `app.inject()`), the frontend uses:

- **Vitest** (not `node:test`) — `describe/it/expect` from `vitest`, not `node:test`
- **jsdom** environment — `localStorage`, `document`, and `window` are available globally
- **@testing-library/react** — `render`, `screen`, `renderHook`, `waitFor`, `act`
- **`vi.stubGlobal`** — Vitest's API for mocking globals like `fetch`
- Test files **co-located with source** (e.g. `hooks/useGuestIdentity.test.ts`) — frontend convention

### VITE_API_URL in Tests

Vitest runs in jsdom environment but `import.meta.env.VITE_API_URL` resolves to `undefined` unless set in `vite.config.ts` under `test.env`. This is fine — the `?? 'http://localhost:3000'` fallback in `api.ts` handles it. Tests mock `fetch` globally so the actual URL value doesn't matter for unit tests.

### Project Structure After This Story

```
frontend/src/
├── App.tsx                   ← UPDATED: useGuestIdentity + loading state in RootLayout
├── types.ts                  ← unchanged (GuestResponse already defined)
├── lib/
│   ├── api.ts                ← UPDATED: full implementation (was stub)
│   ├── identity.ts           ← UPDATED: full implementation (was stub)
│   └── utils.ts              ← unchanged
├── hooks/                    ← NEW directory
│   └── useGuestIdentity.ts   ← NEW: identity init hook
└── pages/
    ├── HomePage.tsx           ← unchanged
    └── HomePage.test.tsx      ← unchanged (must still pass)

New test files:
frontend/src/lib/identity.test.ts
frontend/src/lib/api.test.ts
frontend/src/hooks/useGuestIdentity.test.ts
```

### Scope Boundary

| Concern                                | This story | Later story        |
| -------------------------------------- | ---------- | ------------------ |
| `identity.ts` read/write               | ✅         | —                  |
| `api.ts` fetch wrapper with X-User-Id  | ✅         | —                  |
| `useGuestIdentity` hook                | ✅         | —                  |
| App loading state during identity init | ✅         | —                  |
| React Context for userId propagation   | ❌         | Story 3.x          |
| `useTodos` hook                        | ❌         | Story 3.1          |
| Registration flow / user upgrade       | ❌         | Epic 5             |
| Error toast for failed POST /guest     | ❌         | Story 5.5 or later |

### References

- Identity flow: [architecture.md](../planning-artifacts/architecture.md) — Communication Patterns — "Identity Flow"
- localStorage key: [architecture.md](../planning-artifacts/architecture.md) — "localStorage key: `motivatodo_user_id`"
- `api.ts` spec: [architecture.md](../planning-artifacts/architecture.md) — Project Structure — "`lib/api.ts` fetch wrapper — reads VITE_API_URL, attaches X-User-Id"
- Hook location: [architecture.md](../planning-artifacts/architecture.md) — Project Structure — `hooks/useGuestIdentity.ts`
- Story ACs: [epics.md](../planning-artifacts/epics.md) — Story 2.3: Client-Side Identity Initialization

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

No blockers — implementation matched Dev Notes exactly. The `console.error` output in the error-path test (`sets isLoading=false even when POST /guest fails`) is expected and intentional — the hook catches and logs the error without rethrowing.

### Completion Notes List

- All 5 tasks complete; 13/13 frontend tests pass (11 new + 2 pre-existing `HomePage` tests)
- `identity.ts` stub replaced with real `localStorage.getItem/setItem` implementation using `motivatodo_user_id` key
- `api.ts` stub replaced: prepends `VITE_API_URL`, attaches `X-User-Id` header from localStorage when present, throws on non-ok responses
- `useGuestIdentity` hook created: lazy `useState(getUserId)` initializer, cancellation-safe `useEffect` with `cancelled` flag for React 18 StrictMode compatibility, `isLoading` starts `false` for returning visitors
- `App.tsx` `RootLayout` updated: shows centred "Loading…" while identity initialises, renders `<Outlet />` once resolved
- 4 extra tests added in `useGuestIdentity.test.ts` including error-path coverage

### File List

- `frontend/src/lib/identity.ts` — UPDATED: full implementation replacing stub
- `frontend/src/lib/api.ts` — UPDATED: full implementation replacing stub
- `frontend/src/hooks/useGuestIdentity.ts` — NEW: identity init hook
- `frontend/src/App.tsx` — UPDATED: `useGuestIdentity` + loading state in `RootLayout`
- `frontend/src/lib/identity.test.ts` — NEW: 3 unit tests
- `frontend/src/lib/api.test.ts` — NEW: 4 unit tests
- `frontend/src/hooks/useGuestIdentity.test.ts` — NEW: 4 hook tests
