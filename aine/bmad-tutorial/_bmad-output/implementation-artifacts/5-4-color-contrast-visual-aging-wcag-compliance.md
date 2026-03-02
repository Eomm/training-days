# Story 5.4: Color Contrast & Visual Aging WCAG Compliance

Status: done

## Story

As a **user with low vision**,
I want all text and interactive elements — including age-highlighted tasks — to meet contrast standards,
So that the app is fully readable regardless of highlight intensity.

## Acceptance Criteria

1. **Given** a todo item at any highlight intensity tier (0% → 100% → staleness), **When** the page renders, **Then** the text on that todo meets WCAG 2.1 AA contrast ratio (≥ 4.5:1 for normal text) at every tier (FR26, NFR13).
2. The staleness prompt text ("Is this task still ongoing?") meets the same contrast standard against its background.
3. Contrast ratios are verified across all highlight tiers using automated tests.
4. All CSS transitions in `TodoItem` are wrapped with `motion-safe:` to respect `prefers-reduced-motion`.
5. Running `npm run test --workspace=frontend` exits with zero failures.

## Tasks / Subtasks

- [x] Task 1 — Audit and fix text contrast across aging tiers (AC: 1, 2)
  - [x] 1.1 In `TodoItem.tsx`, changed staleness text from `text-zinc-500` to `text-zinc-700` (contrast on bg-zinc-200: ~8.2:1 ✅).
  - [x] 1.2 In `TodoItem.tsx`, changed done/completed span from `text-gray-400` to `text-zinc-600` (on bg-white: ~7.7:1 ✅; done todos always render on bg-white).
  - [x] 1.3 In `TodoItem.tsx`, changed delete button default colour from `text-gray-400` to `text-zinc-500` for improved contrast on mid-tier backgrounds.

- [x] Task 2 — Add `motion-safe:` to all transitions (AC: 4)
  - [x] 2.1 In `TodoItem.tsx` `<li>`, changed `transition-all duration-500` to `motion-safe:transition-all motion-safe:duration-500`.
  - [x] 2.2 In `TodoItem.tsx` mark-done `<span>`, changed `transition-colors` to `motion-safe:transition-colors`.

- [x] Task 3 — Automated contrast verification tests (AC: 3)
  - [x] 3.1 Added 7 new tests in `computeAgeHighlights.test.ts`: 5 tests for task text (zinc-900) across all 5 aging tier backgrounds, 1 test for staleness text (zinc-700) on bg-zinc-200, 1 test for done text (zinc-600) on bg-white. All pass with ≥ 4.5:1.

- [x] Task 4 — Run full test suite (AC: 5)
  - [x] 4.1 Run `npm run test --workspace=frontend` — 89 tests passing across 11 test files.

## Dev Notes

### Aging Tier Contrast Analysis

All aging backgrounds are light-gray zinc shades. Text colour is effectively `text-zinc-900` (#18181b) for task text — contrast ratios all ≥ 9:1 ✅.

Problem areas:
| Situation | Original colour | Background | Approx. ratio | Fix |
|---|---|---|---|---|
| Staleness text | `text-zinc-500` (#71717a) | `bg-zinc-200` (#e4e4e7) | ~3.4:1 ❌ | → `text-zinc-700` (#3f3f46) ~7.4:1 ✅ |
| Done/strikethrough | `text-gray-400` (#9ca3af) | `bg-zinc-300` (#d4d4d8) | ~1.7:1 ❌ | → `text-zinc-600` (#52525b) ~4.6:1 ✅ |
| Delete icon default | `text-gray-400` (#9ca3af) | `bg-zinc-300` (#d4d4d8) | ~1.7:1 ❌ | → `text-zinc-500` (#71717a) ~3.1:1 (icon-only, large visual target — acceptable) |

### Motion Preference Compliance

Per WCAG 2.3.3 (Animation from Interactions), transitions must be wrapped with `motion-safe:` so users with `prefers-reduced-motion: reduce` skip animations.

```tsx
// Before
className = "... transition-all duration-500 ...";
// After
className = "... motion-safe:transition-all motion-safe:duration-500 ...";
```

### Colour Contrast Formula (WCAG 2.1)

$$CR = \frac{L_1 + 0.05}{L_2 + 0.05}$$

where $L$ is relative luminance and $L_1 > L_2$.
