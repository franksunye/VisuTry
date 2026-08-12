import { test, expect } from '@playwright/test';

test.describe('@critical Business market-facing narrative', () => {
  test('business route explains the catalog-to-intelligence story without fake proof', async ({ page }) => {
    const response = await page.goto('/en/business', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/AI Eyewear Shopping Experiences for Brands \| VisuTry/);
    await expect(page.getByRole('heading', { name: /Turn your eyewear catalog into an AI shopping experience/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Store for continuity\. Campaign for focus/i })).toBeVisible();
    await expect(page.getByText('Sessions and engagement')).toBeVisible();
    await expect(page.getByText(/Reference Experiences are VisuTry product demonstrations/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'See a live experience' })).toHaveAttribute('href', '/en/store/luna-optical');
    await expect(page.getByRole('link', { name: 'Open Reference Campaign' })).toHaveAttribute('href', '/en/c/akila/statement-frames');
    await expect(page.locator('body')).not.toContainText(/trusted by|customers|partners|ROAS|sales lift/i);
  });
});
