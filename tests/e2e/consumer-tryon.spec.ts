import { test, expect } from '@playwright/test';

/**
 * Consumer Try-On critical path.
 *
 * The full generation lifecycle will use mocked generation responses
 * to avoid external AI provider cost during automated testing.
 */
test.describe('Consumer Try-On Flow', () => {
  test('opens try-on entry point', async ({ page }) => {
    await page.goto('/en/try-on');

    await expect(page).toHaveURL(/try-on/);
  });
});
