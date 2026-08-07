import { test, expect } from '@playwright/test';

const routes = [
  ['homepage', '/'],
  ['face shape detector', '/en/face-shape-detector'],
  ['face analysis', '/en/face-analysis'],
  ['try-on', '/en/try-on/glasses'],
  ['compare', '/en/try-on/glasses/compare'],
  ['store', '/en/store'],
] as const;

test.describe('@smoke Production readiness routes', () => {
  for (const [name, path] of routes) {
    test(`${name} is available`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response, `${path} should return an HTTP response`).not.toBeNull();
      expect(response!.status(), `${path} should not return an error status`).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[?#].*)?$`));
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
