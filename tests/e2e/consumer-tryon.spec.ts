import { test, expect } from '@playwright/test';

test.describe('@critical Consumer Try-On Flow', () => {
  test('try-on entry point renders without an application error', async ({ page }) => {
    const response = await page.goto('/en/try-on', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/try-on/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
  });
});
