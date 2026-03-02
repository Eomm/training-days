// frontend/src/lib/api.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiFetch } from './api.ts'

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls fetch with correct URL and returns parsed JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userId: 'u1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await apiFetch<{ userId: string }>('/guest', { method: 'POST' })
    expect(result).toEqual({ userId: 'u1' })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('includes X-User-Id header when userId is in localStorage', async () => {
    localStorage.setItem('motivatodo_user_id', 'test-user-id')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await apiFetch('/some-route')
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['X-User-Id']).toBe('test-user-id')
  })

  it('does not include X-User-Id when localStorage is empty', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await apiFetch('/some-route')
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['X-User-Id']).toBeUndefined()
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }))
    await expect(apiFetch('/bad')).rejects.toThrow('HTTP 400')
  })

  it('returns undefined for 204 No Content without calling json()', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', mockFetch)
    const result = await apiFetch<void>('/todos/some-id', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })
})
