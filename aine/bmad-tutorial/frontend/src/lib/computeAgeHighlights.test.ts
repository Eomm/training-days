// frontend/src/lib/computeAgeHighlights.test.ts
import { describe, it, expect } from 'vitest'
import { computeAgeHighlights, getAgingClass } from './computeAgeHighlights.ts'

describe('computeAgeHighlights', () => {
  it('returns empty Map for empty array', () => {
    const result = computeAgeHighlights([])
    expect(result.size).toBe(0)
  })

  it('returns intensity 0 and not stale for single item', () => {
    const result = computeAgeHighlights([
      { id: 'a', createdAt: '2026-03-01T10:00:00.000Z' },
    ])
    expect(result.get('a')).toEqual({ intensity: 0, isStale: false })
  })

  it('gives all items intensity 0 when list has 2 items (within grace period)', () => {
    const result = computeAgeHighlights([
      { id: 'new', createdAt: '2026-03-02T10:00:00.000Z' },
      { id: 'old', createdAt: '2026-03-01T10:00:00.000Z' },
    ])
    expect(result.get('new')).toEqual({ intensity: 0, isStale: false })
    expect(result.get('old')).toEqual({ intensity: 0, isStale: false })
  })

  it('gives all items intensity 0 when list has exactly 5 items (grace boundary)', () => {
    const items = [
      { id: 'a', createdAt: '2026-03-05T10:00:00.000Z' },
      { id: 'b', createdAt: '2026-03-04T10:00:00.000Z' },
      { id: 'c', createdAt: '2026-03-03T10:00:00.000Z' },
      { id: 'd', createdAt: '2026-03-02T10:00:00.000Z' },
      { id: 'e', createdAt: '2026-03-01T10:00:00.000Z' },
    ]
    const result = computeAgeHighlights(items)
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(result.get(id)).toEqual({ intensity: 0, isStale: false })
    }
  })

  it('marks the 6th item as stale in a 6-item list (single aging item)', () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `item-${i}`,
      createdAt: new Date(2026, 2, 6 - i).toISOString(),
    }))
    const result = computeAgeHighlights(items)
    // First 5 in grace period
    for (let i = 0; i < 5; i++) {
      expect(result.get(`item-${i}`)).toEqual({ intensity: 0, isStale: false })
    }
    // Single aging item → rank 1.0 → stale with intensity 50
    expect(result.get('item-5')).toEqual({ intensity: 50, isStale: true })
  })

  it('ages items beyond the grace window in a 10-item list', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      createdAt: new Date(2026, 2, 10 - i).toISOString(), // item-0 newest, item-9 oldest
    }))
    const result = computeAgeHighlights(items)

    // Grace window: items 0–4 → intensity 0
    for (let i = 0; i < 5; i++) {
      expect(result.get(`item-${i}`)).toEqual({ intensity: 0, isStale: false })
    }
    // Aging group: items 5–9 (agingCount=5)
    // Ranks: 0/4=0%, 1/4=25%, 2/4=50%, 3/4=75%, 4/4=100%
    expect(result.get('item-5')).toEqual({ intensity: 0, isStale: false })
    expect(result.get('item-6')).toEqual({ intensity: 25, isStale: false })
    expect(result.get('item-7')).toEqual({ intensity: 50, isStale: false })
    expect(result.get('item-8')).toEqual({ intensity: 75, isStale: false })
    // item-9: rank 1.0 ≥ 0.8 → stale
    expect(result.get('item-9')).toEqual({ intensity: 50, isStale: true })
  })

  it('marks multiple items stale in a 15-item list', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: `item-${i}`,
      createdAt: new Date(2026, 2, 15 - i).toISOString(),
    }))
    const result = computeAgeHighlights(items)

    // Grace window: items 0–4
    for (let i = 0; i < 5; i++) {
      expect(result.get(`item-${i}`)?.isStale).toBe(false)
      expect(result.get(`item-${i}`)?.intensity).toBe(0)
    }
    // Aging group: items 5–14 (agingCount=10)
    // Ranks: 0/9, 1/9, 2/9, ..., 8/9≈0.889, 9/9=1.0
    // Items 13 (rank 8/9≈0.889) and 14 (rank 1.0) are stale
    expect(result.get('item-12')?.isStale).toBe(false) // rank 7/9≈0.778
    expect(result.get('item-13')?.isStale).toBe(true)
    expect(result.get('item-13')?.intensity).toBe(50)
    expect(result.get('item-14')?.isStale).toBe(true)
    expect(result.get('item-14')?.intensity).toBe(50)
  })

  it('produces same result regardless of input order', () => {
    const items = [
      { id: 'b', createdAt: '2026-03-01T10:00:00.000Z' },
      { id: 'a', createdAt: '2026-03-02T10:00:00.000Z' },
      { id: 'c', createdAt: '2026-02-28T10:00:00.000Z' },
    ]
    const resultUnsorted = computeAgeHighlights(items)

    const sorted = [
      { id: 'a', createdAt: '2026-03-02T10:00:00.000Z' },
      { id: 'b', createdAt: '2026-03-01T10:00:00.000Z' },
      { id: 'c', createdAt: '2026-02-28T10:00:00.000Z' },
    ]
    const resultSorted = computeAgeHighlights(sorted)

    expect(resultUnsorted.get('a')).toEqual(resultSorted.get('a'))
    expect(resultUnsorted.get('b')).toEqual(resultSorted.get('b'))
    expect(resultUnsorted.get('c')).toEqual(resultSorted.get('c'))
  })

  it('is relative and list-aware — same item behaves differently in different list sizes', () => {
    const oldItem = { id: 'old', createdAt: '2026-02-25T10:00:00.000Z' }
    const newItem = { id: 'new', createdAt: '2026-03-02T10:00:00.000Z' }

    // In a 2-item list: both in grace period
    const small = computeAgeHighlights([newItem, oldItem])
    expect(small.get('old')).toEqual({ intensity: 0, isStale: false })

    // In a 7-item list: old is in the aging group
    const large = computeAgeHighlights([
      newItem,
      { id: 'mid1', createdAt: '2026-03-01T10:00:00.000Z' },
      { id: 'mid2', createdAt: '2026-02-28T10:00:00.000Z' },
      { id: 'mid3', createdAt: '2026-02-27T10:00:00.000Z' },
      { id: 'mid4', createdAt: '2026-02-26T10:00:00.000Z' },
      { id: 'mid5', createdAt: '2026-02-26T06:00:00.000Z' },
      oldItem,
    ])
    // old is at index 6, agingCount=2, rank = 1/1 = 1.0 → stale
    expect(large.get('old')?.isStale).toBe(true)
  })

  it('handles items with same createdAt', () => {
    const ts = '2026-03-01T10:00:00.000Z'
    const result = computeAgeHighlights([
      { id: 'a', createdAt: ts },
      { id: 'b', createdAt: ts },
      { id: 'c', createdAt: ts },
    ])
    // All 3 items within grace period
    const values = [...result.values()]
    expect(values.every(v => v.intensity === 0 && !v.isStale)).toBe(true)
  })
})

describe('getAgingClass', () => {
  it('returns bg-white for intensity 0', () => {
    expect(getAgingClass(0)).toBe('bg-white')
  })

  it('returns bg-zinc-100 for intensity 1', () => {
    expect(getAgingClass(1)).toBe('bg-zinc-100')
  })

  it('returns bg-zinc-100 for intensity 25', () => {
    expect(getAgingClass(25)).toBe('bg-zinc-100')
  })

  it('returns bg-zinc-200 for intensity 26', () => {
    expect(getAgingClass(26)).toBe('bg-zinc-200')
  })

  it('returns bg-zinc-200 for intensity 50', () => {
    expect(getAgingClass(50)).toBe('bg-zinc-200')
  })

  it('returns bg-zinc-300 for intensity 51', () => {
    expect(getAgingClass(51)).toBe('bg-zinc-300')
  })

  it('returns bg-zinc-300 for intensity 75', () => {
    expect(getAgingClass(75)).toBe('bg-zinc-300')
  })

  it('returns bg-zinc-400 for intensity 76', () => {
    expect(getAgingClass(76)).toBe('bg-zinc-400')
  })

  it('returns bg-zinc-400 for intensity 100', () => {
    expect(getAgingClass(100)).toBe('bg-zinc-400')
  })
})
