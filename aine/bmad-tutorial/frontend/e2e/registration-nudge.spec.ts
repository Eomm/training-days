// e2e/registration-nudge.spec.ts — Registration nudge appears at 5+ active todos
import { test, expect } from "@playwright/test";
import { createGuest, cleanTodos, setupPage, addTodo } from "./helpers.ts";

test.describe("Registration Nudge", () => {
  let userId: string;

  test.beforeAll(async () => {
    userId = await createGuest();
  });

  test.beforeEach(async ({ page }) => {
    await cleanTodos(userId);
    await setupPage(page, userId);
  });

  test("does not show nudge with fewer than 5 active todos", async ({
    page,
  }) => {
    await addTodo(page, "Task 1");
    await addTodo(page, "Task 2");
    await addTodo(page, "Task 3");
    await addTodo(page, "Task 4");

    await expect(
      page.getByText("Register to keep your tasks forever"),
    ).not.toBeVisible();
  });

  test("shows nudge when 5 or more active todos exist", async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      await addTodo(page, `Nudge task ${i}`);
    }

    await expect(
      page.getByText("Register to keep your tasks forever"),
    ).toBeVisible();
  });

  test("dismisses nudge and remembers for the session", async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      await addTodo(page, `Dismiss task ${i}`);
    }

    const nudge = page.getByText("Register to keep your tasks forever");
    await expect(nudge).toBeVisible();

    // Dismiss it
    await page
      .getByRole("button", { name: "Dismiss registration prompt" })
      .click();
    await expect(nudge).not.toBeVisible();

    // Reload — should stay dismissed (sessionStorage)
    await page.reload();
    await page.getByRole("heading", { name: "MotivaTodo" }).waitFor();
    await expect(nudge).not.toBeVisible();
  });
});
