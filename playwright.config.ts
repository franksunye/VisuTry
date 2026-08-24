import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localBaseUrl = 'http://127.0.0.1:3001';
const isLocalRevenueBaseUrl = (() => {
  if (!externalBaseUrl) return true
  try {
    const baseUrl = new URL(externalBaseUrl)
    return baseUrl.protocol === 'http:'
      && ['127.0.0.1', 'localhost'].includes(baseUrl.hostname)
      && ['3001', '3002'].includes(baseUrl.port)
  } catch {
    return false
  }
})()
const revenueCriticalProjects = isLocalRevenueBaseUrl
  ? [
      {
        name: 'face-analysis-paywall-desktop',
        testMatch: /consumer-face-analysis-paywall\.spec\.ts/,
        use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      },
      {
        name: 'face-analysis-paywall-mobile',
        testMatch: /consumer-face-analysis-paywall\.spec\.ts/,
        use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true },
      },
    ]
  : [];

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
      testIgnore: /consumer-face-analysis-paywall\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    ...revenueCriticalProjects,
  ],
});
