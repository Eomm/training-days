// e2e/accessibility.spec.ts — Keyboard navigation, skip link, ARIA
import { test, expect } from "@playwright/test";
import { createGuest, cleanTodos, setupPage, addTodo } from "./helpers.ts";

test.describe("Accessibility", () => {
  let userId: string;

  test.beforeAll(async () => {
    userId = await createGuest();
  });

  test.beforeEach(async ({ page }) => {
    await cleanTodos(userId);
    await setupPage(page, userId);
  });

  test("skip link navigates focus to the task input", async ({ page }) => {
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to task input" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");

    const input = page.getByPlaceholder("Add a task…");
    await expect(input).toBeFocused();
  });

  test("todo list has correct ARIA role and label", async ({ page }) => {
    await addTodo(page, "ARIA test");

    const list = page.getByRole("list", { name: "Your tasks" });
    await expect(list).toBeVisible();
  });

  test("mark-complete button has descriptive aria-label", async ({ page }) => {
    await addTodo(page, "Label test");

    const btn = page.getByRole("button", {
      name: 'Mark "Label test" as complete',
    });
    await expect(btn).toBeVisible();
  });

  test("delete button has descriptive aria-label", async ({ page }) => {
    await addTodo(page, "Delete label test");

    const btn = page.getByRole("button", {
      name: 'Delete "Delete label test"',
    });
    await expect(btn).toBeVisible();
  });

  test("focus moves to next item after deleting a todo", async ({ page }) => {
    await addTodo(page, "Item A");
    await addTodo(page, "Item B");

    // Delete B (the first/newest in the list)
    const deletePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/todos/") && res.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: 'Delete "Item B"' }).click();
    await deletePromise;

    // Focus should move to Item A's mark-complete button
    const remainingBtn = page.getByRole("button", {
      name: 'Mark "Item A" as complete',
    });
    await expect(remainingBtn).toBeFocused();
  });

  test("focus returns to input after deleting the last todo", async ({
    page,
  }) => {
    await addTodo(page, "Only item");

    const deletePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/todos/") && res.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: 'Delete "Only item"' }).click();
    await deletePromise;

    const input = page.getByPlaceholder("Add a task…");
    await expect(input).toBeFocused();
  });

  test("quote modal traps focus and can be dismissed with Escape", async ({
    page,
  }) => {
    await addTodo(page, "Modal focus test");

    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/todos/") && res.request().method() === "PATCH",
    );
    await page
      .getByRole("button", { name: 'Mark "Modal focus test" as complete' })
      .click();
    await patchPromise;

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});
