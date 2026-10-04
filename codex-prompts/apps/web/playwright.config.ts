import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${String(PORT)}`;

/**
 * Smoke tests against the production build (`pnpm build` first). The showcase is enabled for
 * the run; the API is optional (the layout renders its fallbacks without it).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm exec next start --port ${String(PORT)}`,
    url: `${BASE_URL}/ar`,
    reuseExistingServer: !process.env.CI,
    env: { ENABLE_UI_SHOWCASE: 'true' },
  },
});
