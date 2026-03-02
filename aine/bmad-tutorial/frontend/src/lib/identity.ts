// frontend/src/lib/identity.ts
// Real implementation in Story 2.3

export const MOTIVATODO_USER_ID_KEY = "motivatodo_user_id"; // exact localStorage key — never change this string

export function getUserId(): string | null {
  throw new Error("getUserId not implemented yet — Story 2.3");
}

export function setUserId(_id: string): void {
  throw new Error("setUserId not implemented yet — Story 2.3");
}
