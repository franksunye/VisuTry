import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localBaseUrl = 'http://127.0.0.1:3001';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: externalBaseUrl || localBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev:test',
        url: localBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
