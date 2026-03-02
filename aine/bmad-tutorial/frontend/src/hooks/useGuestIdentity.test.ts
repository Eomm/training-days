// frontend/src/hooks/useGuestIdentity.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGuestIdentity } from './useGuestIdentity.ts'

describe('useGuestIdentity', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns isLoading=false immediately when userId already in localStorage', () => {
    localStorage.setItem('motivatodo_user_id', 'existing-id')
    const { result } = renderHook(() => useGuestIdentity())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.userId).toBe('existing-id')
  })

  it('calls POST /guest and sets userId when localStorage is empty', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userId: 'new-uuid' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useGuestIdentity())
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.userId).toBe('new-uuid')
    expect(localStorage.getItem('motivatodo_user_id')).toBe('new-uuid')

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('POST')
    expect(options.body).toBe('{}')
  })

  it('does not call POST /guest when userId already present', () => {
    localStorage.setItem('motivatodo_user_id', 'existing-id')
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    renderHook(() => useGuestIdentity())
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sets isLoading=false even when POST /guest fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { result } = renderHook(() => useGuestIdentity())
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.userId).toBeNull()
  })
})
