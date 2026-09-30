const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/local-sales-demo-capture.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 8 * 60 * 1000,
  reporter: 'line',
  outputDir: '.local/sales-demo/.playwright-output',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [{ name: 'local-sales-demo-chromium', use: { browserName: 'chromium' } }],
})
