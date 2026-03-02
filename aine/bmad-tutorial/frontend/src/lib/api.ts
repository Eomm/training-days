// frontend/src/lib/api.ts
import { getUserId } from './identity.ts'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const userId = getUserId()

  const headers: Record<string, string> = {
    ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(init?.headers as Record<string, string> | undefined),
    ...(userId ? { 'X-User-Id': userId } : {}),
  }

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
