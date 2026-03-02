// frontend/src/types.ts

export interface Todo {
  id: string; // UUID
  userId: string; // UUID
  text: string;
  done: boolean;
  createdAt: string; // ISO 8601 string e.g. "2026-03-02T09:00:00.000Z"
}

export interface GuestResponse {
  userId: string; // UUID assigned by POST /guest
}
