import { test, expect } from '@playwright/test';

test.describe('@critical Business market-facing narrative', () => {
  test('business route explains the catalog-to-intelligence story without fake proof', async ({ page }) => {
    const response = await page.goto('/en/business', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/AI Commerce for Eyewear Brands & Agencies \| VisuTry/);
    await expect(page.getByRole('heading', { name: /Turn your eyewear catalog into a personalized AI shopping experience/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Store for continuity\. Campaigns for focus/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /One workspace to operate Store, Campaigns, and the signals around them/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /See what shoppers actually do before the product click/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start a Pilot' }).first()).toHaveAttribute('href', '/en/business/pilot');
    await expect(page.getByRole('link', { name: 'Create Merchant Workspace' }).first()).toHaveAttribute('href', '/en/merchant');
    await expect(page.getByRole('link', { name: 'Explore Store' }).first()).toHaveAttribute('href', '/en/business/store');
    await expect(page.locator('a[href="/admin/store"]')).toHaveCount(0);
    await expect(page.getByAltText(/VisuTry Commerce Intelligence visual with shopper engagement and intent signals/i)).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/trusted by|our customers|our partners|ROAS|sales lift/i);
  });

  test('public Merchant CTA preserves the anonymous authentication continuation', async ({ page }) => {
    await page.goto('/en/business', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Create Merchant Workspace' }).first().click();
    await expect(page).toHaveURL(/\/en\/auth\/signin/);
    expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe('/en/merchant');
    await expect(page.getByRole('button', { name: /create merchant account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /already have an account/i })).toBeVisible();
  });

  for (const locale of ['de', 'ja', 'fr']) {
    test(`${locale} business route canonicalizes to the English v1 site`, async ({ page }) => {
      const response = await page.goto(`/${locale}/business`, { waitUntil: 'domcontentloaded' });

      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(400);
      await expect(page).toHaveURL('/en/business');
      await expect(page).toHaveTitle(/AI Commerce for Eyewear Brands & Agencies \| VisuTry/);
      await expect(page.getByRole('heading', { name: /Turn your eyewear catalog into a personalized AI shopping experience/i })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Start a Pilot' }).first()).toHaveAttribute('href', '/en/business/pilot');
      await expect(page.locator('a[href="/admin/store"]')).toHaveCount(0);
    });
  }

  test('Pilot route captures a durable merchant request instead of forcing email', async ({ page }) => {
    const response = await page.goto('/en/business/pilot', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page.getByRole('link', { name: 'Request Pilot Review' })).toHaveAttribute('href', '#pilot-request');
    await expect(page.getByRole('heading', { name: 'Tell us what you want to test.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request Pilot review' })).toBeVisible();
    await expect(page.getByLabel('Work email')).toHaveAttribute('type', 'email');
    await expect(page.locator('a[href^="mailto:"]').filter({ hasText: 'Request Pilot Review' })).toHaveCount(0);
  });
});
