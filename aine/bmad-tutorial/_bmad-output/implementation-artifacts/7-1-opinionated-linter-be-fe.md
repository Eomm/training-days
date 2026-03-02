# Story 7.1: Opinionated & Simple Linter on Backend and Frontend

Status: done

## Story

As a **developer**,
I want a consistent, opinionated linting setup across both backend and frontend packages,
so that code quality and style are enforced automatically and uniformly across the entire monorepo.

## Acceptance Criteria

1. **Given** the backend package
   **When** I run `npm run lint --workspace=backend`
   **Then** ESLint runs against all `*.ts` files in `src/` and `test/` using `@eslint/js` recommended + `typescript-eslint` recommended rules

2. **Given** the backend ESLint configuration
   **When** inspecting the config file
   **Then** it targets `**/*.ts` files, uses `globals.node` for the language environment, ignores `dist/`, and extends `js.configs.recommended` and `tseslint.configs.recommended`

3. **Given** the frontend ESLint configuration already exists
   **When** inspecting the config
   **Then** it remains as-is (already has `@eslint/js` recommended + `typescript-eslint` recommended + React hooks + React Refresh)

4. **Given** the root `package.json`
   **When** I run `npm run lint`
   **Then** ESLint runs in both `frontend` and `backend` workspaces

5. **Given** either package has lint violations
   **When** the lint script runs
   **Then** it exits with a non-zero code and reports the violations clearly

## Tasks / Subtasks

- [ ] Task 1: Add ESLint to the backend (AC: #1, #2)
  - [ ] 1.1 Install `eslint`, `@eslint/js`, `typescript-eslint`, and `globals` as devDependencies in `backend/`
  - [ ] 1.2 Create `backend/eslint.config.js` using flat config (same style as frontend)
  - [ ] 1.3 Add `"lint": "eslint ."` script to `backend/package.json`
- [ ] Task 2: Add root-level lint script (AC: #4)
  - [ ] 2.1 Add `"lint": "npm run lint --workspace=frontend && npm run lint --workspace=backend"` to root `package.json`
- [ ] Task 3: Verify and fix any existing lint violations (AC: #5)
  - [ ] 3.1 Run `npm run lint` from root and fix any reported issues in backend code

## Dev Notes

### Current State

- **Frontend** — ESLint is already fully configured:
  - Config: [frontend/eslint.config.js](frontend/eslint.config.js) (flat config format)
  - Dependencies: `eslint@^9.39.1`, `@eslint/js@^9.39.1`, `typescript-eslint@^8.48.0`, `globals@^16.5.0`, `eslint-plugin-react-hooks@^7.0.1`, `eslint-plugin-react-refresh@^0.4.24`
  - Script: `"lint": "eslint ."`
  - **No changes needed** to the frontend ESLint setup.

- **Backend** — No linting at all:
  - No `eslint.config.js`
  - No ESLint devDependencies
  - No `lint` script

- **Root** — No lint script exists in root [package.json](package.json).

### Backend ESLint Config Target

Use ESLint 9 flat config format (same as frontend). The backend config should be simpler — no React plugins, just TypeScript + Node.js:

```javascript
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
]);
```

### Key Differences from Frontend Config

| Aspect        | Frontend                       | Backend        |
| ------------- | ------------------------------ | -------------- |
| File glob     | `**/*.{ts,tsx}`                | `**/*.ts`      |
| Globals       | `globals.browser`              | `globals.node` |
| Extra plugins | `react-hooks`, `react-refresh` | None           |
| Ignored dirs  | `dist`                         | `dist`         |

### Dependency Versions

Match the frontend's existing ESLint ecosystem versions for consistency:

- `eslint`: `^9.39.1`
- `@eslint/js`: `^9.39.1`
- `typescript-eslint`: `^8.48.0`
- `globals`: `^16.5.0`

### Project Structure Notes

- Backend uses Node 22.19 with `--experimental-strip-types` — ESLint config file should be `.js` (ESM via `"type": "module"` in package.json)
- Backend TypeScript config uses `allowImportingTsExtensions` and `rewriteRelativeImportExtensions` — ESLint should not flag `.ts` import extensions
- All paths follow existing monorepo conventions: `frontend/eslint.config.js` already exists, `backend/eslint.config.js` is the new file

### References

- [Source: frontend/eslint.config.js] — existing flat config to mirror for backend
- [Source: frontend/package.json] — ESLint dependency versions to match
- [Source: backend/package.json] — current scripts and devDependencies (no ESLint)
- [Source: package.json] — root workspace scripts (needs `lint` added)
- [Source: docs/backend-conventions.md] — `.ts` import extensions convention

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
