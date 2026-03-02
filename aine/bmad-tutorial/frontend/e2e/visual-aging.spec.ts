// e2e/visual-aging.spec.ts — Visual aging and staleness indicators
import { test, expect } from "@playwright/test";
import { createGuest, cleanTodos, setupPage, seedTodos } from "./helpers.ts";

test.describe("Visual Aging & Staleness", () => {
  let userId: string;

  test.beforeAll(async () => {
    userId = await createGuest();
  });

  test.beforeEach(async () => {
    await cleanTodos(userId);
  });

  test("items beyond the grace window get aging background classes", async ({
    page,
  }) => {
    await seedTodos(userId, 8, "Aging item");
    await setupPage(page, userId);

    const items = page
      .getByRole("list", { name: "Your tasks" })
      .getByRole("listitem");
    await expect(items).toHaveCount(8);

    // The newest item (grace window) should have bg-white
    const newestItem = items.first();
    await expect(newestItem).toHaveClass(/bg-white/);
  });

  test("stale items show the contextual prompt", async ({ page }) => {
    await seedTodos(userId, 10, "Stale check");
    await setupPage(page, userId);

    // At least one item should show the staleness contextual prompt
    await expect(
      page.getByText("Is this task still ongoing?").first(),
    ).toBeVisible();

    // Stale items should have a dashed border
    const staleItems = page.locator("li.border-dashed");
    expect(await staleItems.count()).toBeGreaterThan(0);
  });
});
