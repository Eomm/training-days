// frontend/src/lib/identity.ts
const KEY = 'motivatodo_user_id' // exact localStorage key — never change this string

export function getUserId(): string | null {
  return localStorage.getItem(KEY)
}

export function setUserId(id: string): void {
  localStorage.setItem(KEY, id)
}
