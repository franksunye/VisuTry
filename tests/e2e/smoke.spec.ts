import { test, expect } from '@playwright/test';

const routes = [
  ['homepage', '/', '/en'],
  ['face shape detector', '/en/face-shape-detector', '/en/face-shape-detector'],
  ['face analysis', '/en/face-analysis', '/en/face-analysis'],
  ['try-on', '/en/try-on/glasses', '/en/try-on/glasses'],
  ['compare', '/en/try-on/glasses/compare', '/en/try-on/glasses/compare'],
  ['store', '/en/store', '/en/store'],
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('@smoke Production readiness routes', () => {
  for (const [name, path, expectedPath] of routes) {
    test(`${name} is available`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response, `${path} should return an HTTP response`).not.toBeNull();
      expect(response!.status(), `${path} should not return an error status`).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(expectedPath)}(?:[?#].*)?$`));
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
    });
  }
});
