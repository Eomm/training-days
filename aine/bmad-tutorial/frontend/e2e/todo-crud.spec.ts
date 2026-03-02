// e2e/todo-crud.spec.ts — Add, list, mark done, delete todos
import { test, expect } from "@playwright/test";
import { createGuest, cleanTodos, setupPage, addTodo } from "./helpers.ts";

test.describe("Todo CRUD", () => {
  let userId: string;

  test.beforeAll(async () => {
    userId = await createGuest();
  });

  test.beforeEach(async ({ page }) => {
    await cleanTodos(userId);
    await setupPage(page, userId);
  });

  test("shows empty state when no todos exist", async ({ page }) => {
    await expect(
      page.getByText("Nothing here yet. Add your first task above."),
    ).toBeVisible();
  });

  test("adds a todo via input + Add button", async ({ page }) => {
    await addTodo(page, "Buy groceries");

    const list = page.getByRole("list", { name: "Your tasks" });
    await expect(list.getByText("Buy groceries")).toBeVisible();

    await expect(
      page.getByText("Nothing here yet. Add your first task above."),
    ).not.toBeVisible();
  });

  test("adds a todo by pressing Enter", async ({ page }) => {
    const input = page.getByPlaceholder("Add a task…");
    await input.fill("Do laundry");

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/todos") && res.request().method() === "POST",
    );
    await input.press("Enter");
    await responsePromise;

    await expect(page.getByText("Do laundry")).toBeVisible();
  });

  test("clears input and refocuses after adding", async ({ page }) => {
    const input = page.getByPlaceholder("Add a task…");
    await input.fill("Clean desk");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
  });

  test("does not add empty or whitespace-only todo", async ({ page }) => {
    const input = page.getByPlaceholder("Add a task…");
    await input.fill("   ");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(
      page.getByText("Nothing here yet. Add your first task above."),
    ).toBeVisible();
  });

  test("marks a todo as done and shows motivational quote", async ({
    page,
  }) => {
    await addTodo(page, "Read a book");

    // Click the "Mark as complete" button and wait for the PATCH response
    const patchPromise = page.waitForResponse(
      (res) => res.url().includes("/todos/") && res.request().method() === "PATCH",
    );
    await page
      .getByRole("button", { name: 'Mark "Read a book" as complete' })
      .click();
    await patchPromise;

    // Quote modal should appear (after fade-out animation completes)
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText("Task Complete! 🎉")).toBeVisible();

    const quoteText = dialog.locator("p.italic");
    await expect(quoteText).toBeVisible();

    // Dismiss the modal
    await dialog.getByRole("button", { name: "Keep going!" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("deletes a todo", async ({ page }) => {
    await addTodo(page, "Temporary task");

    await expect(page.getByText("Temporary task")).toBeVisible();

    const deletePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/todos/") && res.request().method() === "DELETE",
    );
    await page
      .getByRole("button", { name: 'Delete "Temporary task"' })
      .click();
    await deletePromise;

    await expect(page.getByText("Temporary task")).not.toBeVisible();

    await expect(
      page.getByText("Nothing here yet. Add your first task above."),
    ).toBeVisible();
  });

  test("persists todos across page reloads", async ({ page }) => {
    await addTodo(page, "Persistent task");

    await page.reload();
    await page.getByRole("heading", { name: "MotivaTodo" }).waitFor();

    await expect(page.getByText("Persistent task")).toBeVisible();
  });

  test("displays multiple todos in newest-first order", async ({ page }) => {
    await addTodo(page, "First task");
    await addTodo(page, "Second task");
    await addTodo(page, "Third task");

    const items = page
      .getByRole("list", { name: "Your tasks" })
      .getByRole("listitem");
    await expect(items).toHaveCount(3);

    const texts = await items.allTextContents();
    expect(texts[0]).toContain("Third task");
    expect(texts[1]).toContain("Second task");
    expect(texts[2]).toContain("First task");
  });
});
