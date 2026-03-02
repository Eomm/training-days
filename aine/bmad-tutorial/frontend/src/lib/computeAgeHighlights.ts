// frontend/src/lib/computeAgeHighlights.ts

interface AgingInput {
  id: string
  createdAt: string
}

export interface AgeHighlight {
  intensity: number  // 0–100
  isStale: boolean   // true if staleness threshold crossed
}

const STALENESS_THRESHOLD = 0.8 // 80th percentile rank
const GRACE_COUNT = 5 // first 5 newest items always get intensity 0

/**
 * Computes a relative, list-aware aging intensity (0–100) for each todo
 * based on its position in the age distribution of the current list.
 *
 * - Empty list → empty Map
 * - N ≤ 5 → all items get intensity 0, never stale (grace period)
 * - N > 5 → the 5 newest items get intensity 0; items beyond the
 *   grace window are ranked among themselves (0–100) with staleness
 *   applied at the 80th percentile of that aging group.
 *
 * The algorithm is relative: intensity depends on rank within the current
 * list, not on absolute age thresholds.
 *
 * Staleness: aging-group items past the 80th percentile rank get reduced
 * intensity (clamped to 50 → bg-zinc-200) and isStale: true, per FR9/FR10.
 */
export function computeAgeHighlights(todos: AgingInput[]): Map<string, AgeHighlight> {
  if (todos.length === 0) return new Map()

  // Sort by createdAt descending (newest first)
  const sorted = [...todos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const n = sorted.length
  const agingCount = n - GRACE_COUNT

  return new Map(
    sorted.map((todo, i) => {
      if (i < GRACE_COUNT) {
        return [todo.id, { intensity: 0, isStale: false }]
      }
      const rank = agingCount <= 1 ? 1.0 : (i - GRACE_COUNT) / (agingCount - 1)
      const isStale = rank >= STALENESS_THRESHOLD
      const intensity = isStale ? 50 : Math.round(rank * 100)
      return [todo.id, { intensity, isStale }]
    }),
  )
}

/**
 * Maps a 0–100 intensity value to the corresponding Tailwind background class
 * from the zinc palette aging tiers.
 */
export function getAgingClass(intensity: number): string {
  if (intensity === 0) return 'bg-white'
  if (intensity <= 25) return 'bg-zinc-100'
  if (intensity <= 50) return 'bg-zinc-200'
  if (intensity <= 75) return 'bg-zinc-300'
  return 'bg-zinc-400'
}
