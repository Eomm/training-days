// frontend/src/hooks/useGuestIdentity.ts
import { useState, useEffect } from 'react'
import { getUserId, setUserId } from '../lib/identity.ts'
import { apiFetch } from '../lib/api.ts'
import type { GuestResponse } from '../types.ts'

export function useGuestIdentity(): { userId: string | null; isLoading: boolean } {
  const [userId, setUserIdState] = useState<string | null>(getUserId)
  const [isLoading, setIsLoading] = useState<boolean>(userId === null)

  useEffect(() => {
    // If identity already initialised (returning visitor), skip the POST /guest call
    if (userId !== null) return

    let cancelled = false

    apiFetch<GuestResponse>('/guest', { method: 'POST', body: JSON.stringify({}) })
      .then((data) => {
        if (cancelled) return
        setUserId(data.userId)
        setUserIdState(data.userId)
      })
      .catch((err) => {
        console.error('Failed to initialise guest identity:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount — intentionally empty deps array

  return { userId, isLoading }
}
