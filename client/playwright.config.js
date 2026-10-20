import { defineConfig } from '@playwright/test';

// Browser tests run against the full stack (Express serving the built client + MongoDB).
// CHROMIUM_PATH lets you point at a system Chromium when Playwright's own browsers can't be downloaded.
const executablePath = process.env.CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4000',
    viewport: { width: 1280, height: 800 },
    launchOptions: { executablePath, args: executablePath ? ['--no-sandbox'] : [] },
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run build && npm --prefix ../server start', url: 'http://localhost:4000/api/health', reuseExistingServer: true, timeout: 180_000 },
});
