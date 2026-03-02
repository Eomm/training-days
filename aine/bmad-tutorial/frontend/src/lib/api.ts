// frontend/src/lib/api.ts
// Real implementation in Story 2.3 — stub establishes the file path and signature

export async function apiFetch<T>(
  path: string,
  _init?: RequestInit,
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL;
  throw new Error(`apiFetch not implemented yet — Story 2.3 (baseUrl: ${baseUrl}, path: ${path})`);
}
