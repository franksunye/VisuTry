import { test, expect } from '@playwright/test';

test.describe('@critical Store Pilot Flow', () => {
  test('merchant Store entry point renders without an application error', async ({ page }) => {
    const response = await page.goto('/en/store', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/store/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
  });
});
