import { test, expect } from '@playwright/test';

test.describe('Production readiness smoke checks', () => {
  test('homepage is available', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('store route is available', async ({ page }) => {
    const response = await page.goto('/en/store');
    expect(response?.status()).toBeLessThan(400);
  });
});
