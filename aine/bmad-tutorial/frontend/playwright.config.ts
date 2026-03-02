import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // serial — avoids rate-limit on POST /guest
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "../backend",
      port: 3000,
      reuseExistingServer: true,
      timeout: 30_000,
      env: {
        DATABASE_URL: "postgres://motivatodo:motivatodo@localhost:5432/motivatodo",
        PORT: "3000",
        CORS_ORIGIN: "http://localhost:5173",
        LOG_LEVEL: "warn",
        RATE_LIMIT_MAX: "10000",
      },
    },
    {
      command: "npm run dev",
      port: 5173,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
