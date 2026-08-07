import { test, expect } from '@playwright/test';

test.describe('@critical Consumer Try-On Flow', () => {
  test('canonical glasses try-on entry point renders without an application error', async ({ page }) => {
    const response = await page.goto('/en/try-on/glasses', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/en\/try-on\/glasses(?:[?#].*)?$/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
  });

  test('compare entry point renders without an application error', async ({ page }) => {
    const response = await page.goto('/en/try-on/glasses/compare', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/en\/try-on\/glasses\/compare(?:[?#].*)?$/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
  });
});
