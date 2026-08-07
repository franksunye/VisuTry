import { test, expect } from '@playwright/test';

test.describe('@critical Consumer Face Analysis Flow', () => {
  test('face analysis entry point renders without an application error', async ({ page }) => {
    const response = await page.goto('/en/face-analysis', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/face-analysis/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
  });
});
