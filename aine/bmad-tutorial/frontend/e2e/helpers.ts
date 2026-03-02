// e2e/helpers.ts — shared utilities for E2E tests
import { type Page, expect } from "@playwright/test";

const API_URL = "http://localhost:3000";

/**
 * Create a guest user via direct API call (bypasses the browser).
 * Call once in beforeAll to share across tests in a file.
 */
export async function createGuest(): Promise<string> {
  const res = await fetch(`${API_URL}/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`createGuest failed: ${res.status}`);
  const data = (await res.json()) as { userId: string };
  return data.userId;
}

/**
 * Delete all todos for a user via the API.
 */
export async function cleanTodos(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/todos`, {
    headers: { "X-User-Id": userId },
  });
  if (!res.ok) return;
  const todos = (await res.json()) as { id: string }[];
  for (const todo of todos) {
    await fetch(`${API_URL}/todos/${todo.id}`, {
      method: "DELETE",
      headers: { "X-User-Id": userId },
    });
  }
}

/**
 * Inject a userId into localStorage before the app loads, then navigate.
 * The app will skip POST /guest because it sees an existing identity.
 * Waits for the initial GET /todos to complete before returning.
 */
export async function setupPage(page: Page, userId: string): Promise<void> {
  await page.addInitScript((uid: string) => {
    localStorage.setItem("motivatodo_user_id", uid);
    sessionStorage.removeItem("nudge-dismissed");
  }, userId);

  // Listen for the initial GET /todos that the app fires on mount
  const todosLoaded = page.waitForResponse(
    (res) =>
      res.url().includes("/todos") &&
      res.request().method() === "GET" &&
      res.status() === 200,
  );
  await page.goto("/");
  await page.getByRole("heading", { name: "MotivaTodo" }).waitFor();
  await todosLoaded;
}

/**
 * Add a todo via the UI and wait for the POST /todos API response to settle.
 * This avoids DOM-detachment issues caused by optimistic → confirmed swap.
 */
export async function addTodo(page: Page, text: string): Promise<void> {
  const input = page.getByPlaceholder("Add a task…");
  await input.fill(text);

  // Start listening BEFORE clicking
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/todos") && res.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Add" }).click();
  await responsePromise;

  // DOM is now stable with the server-confirmed item
  await expect(page.getByText(text, { exact: false })).toBeVisible({
    timeout: 5_000,
  });
}

/**
 * Seed N todos directly via the API (faster than UI for bulk creation).
 */
export async function seedTodos(
  userId: string,
  count: number,
  prefix = "Seeded task",
): Promise<void> {
  for (let i = 1; i <= count; i++) {
    const res = await fetch(`${API_URL}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
      },
      body: JSON.stringify({ text: `${prefix} ${i}` }),
    });
    if (!res.ok) throw new Error(`seedTodos failed: ${res.status}`);
  }
}
