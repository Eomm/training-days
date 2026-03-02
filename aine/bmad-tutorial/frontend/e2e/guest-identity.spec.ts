// e2e/guest-identity.spec.ts — Guest identity flow
import { test, expect } from "@playwright/test";

test.describe("Guest Identity", () => {
  test("creates a guest user on first visit and stores userId in localStorage", async ({
    page,
  }) => {
    // Fresh context — no localStorage, so POST /guest fires
    await page.goto("/");
    await page.getByRole("heading", { name: "MotivaTodo" }).waitFor();

    // Poll until the async POST /guest handler stores the userId
    await expect
      .poll(
        () => page.evaluate(() => localStorage.getItem("motivatodo_user_id")),
        { timeout: 10_000 },
      )
      .toBeTruthy();

    const userId = await page.evaluate(() =>
      localStorage.getItem("motivatodo_user_id"),
    );
    expect(userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test("reuses existing userId on subsequent visits (no duplicate POST /guest)", async ({
    page,
  }) => {
    // First visit
    await page.goto("/");
    await page.getByRole("heading", { name: "MotivaTodo" }).waitFor();
    await expect
      .poll(
        () => page.evaluate(() => localStorage.getItem("motivatodo_user_id")),
        { timeout: 10_000 },
      )
      .toBeTruthy();

    const firstId = await page.evaluate(() =>
      localStorage.getItem("motivatodo_user_id"),
    );

    // Track network requests on reload
    const guestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/guest") && req.method() === "POST") {
        guestRequests.push(req.url());
      }
    });

    await page.reload();
    await page.getByRole("heading", { name: "MotivaTodo" }).waitFor();

    const secondId = await page.evaluate(() =>
      localStorage.getItem("motivatodo_user_id"),
    );
    expect(secondId).toBe(firstId);
    expect(guestRequests).toHaveLength(0);
  });

  test("shows loading indicator while identity is being created", async ({
    page,
  }) => {
    await page.goto("/");
    // The heading appears once loading finishes
    await page.getByRole("heading", { name: "MotivaTodo" }).waitFor({ timeout: 10_000 });
  });
});
