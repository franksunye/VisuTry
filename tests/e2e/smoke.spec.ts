import { test, expect } from '@playwright/test';

const routes = [
  ['homepage', '/'],
  ['face analysis', '/en/face-analysis'],
  ['try-on', '/en/try-on'],
  ['store', '/en/store'],
] as const;

test.describe('@smoke Production readiness routes', () => {
  for (const [name, path] of routes) {
    test(`${name} is available`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response, `${path} should return an HTTP response`).not.toBeNull();
      expect(response!.status(), `${path} should not return an error status`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
