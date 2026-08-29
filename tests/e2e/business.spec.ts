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

  test('Merchant pricing page exposes the canonical plans, usage semantics, and safe CTAs', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    const response = await page.goto('/en/business/pricing', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/VisuTry Merchant Pricing/);
    await expect(page.getByRole('heading', { name: /Choose the right capacity for your next stage of eyewear commerce/i })).toBeVisible();
    await expect(page.locator('[data-plan-code="FREE"]')).toContainText('$0');
    await expect(page.locator('[data-plan-code="FREE"]')).toContainText('Up to 50 catalog items');
    await expect(page.locator('[data-plan-code="FREE"]')).toContainText('Generative Try-On not included');
    await expect(page.locator('[data-plan-code="LAUNCH"]')).toContainText('$199/month');
    await expect(page.locator('[data-plan-code="LAUNCH"]')).toContainText('1 active Campaign');
    await expect(page.locator('[data-plan-code="LAUNCH"]')).toContainText('1,000 AI Commerce Sessions');
    await expect(page.locator('[data-plan-code="GROWTH"]')).toContainText('$499/month');
    await expect(page.locator('[data-plan-code="GROWTH"]')).toContainText('3 active Campaigns');
    await expect(page.locator('[data-plan-code="GROWTH"]')).toContainText('5,000 AI Commerce Sessions');
    await expect(page.locator('[data-plan-code="SCALE"]')).toContainText('$999/month');
    await expect(page.locator('[data-plan-code="SCALE"]')).toContainText('10 active Campaigns');
    await expect(page.locator('[data-plan-code="SCALE"]')).toContainText('10,000 AI Commerce Sessions');
    await expect(page.locator('[data-plan-code="ENTERPRISE"]')).toContainText('$2,500+ / month');
    await expect(page.locator('[data-plan-code="ENTERPRISE"]')).toContainText('Custom catalog allowance');
    await expect(page.locator('[data-plan-code="ENTERPRISE"]')).toContainText('Contact Sales');
    await expect(page.getByRole('heading', { name: /A low-risk 30-day validation/i })).toBeVisible();
    await expect(page.locator('#pilot')).toContainText('$149 / 30 days');
    await expect(page.locator('#pilot')).toContainText('1,500 AI-assisted shoppers');
    await expect(page.locator('#pilot')).toContainText('3,500 generations');
    await expect(page.locator('#pilot')).toContainText('no automatic renewal');
    await expect(page.getByRole('heading', { name: /Clear capacity, without shutting down the Store/i })).toBeVisible();
    await expect(page.getByText(/AI Commerce Sessions measure a shopper who starts an AI-assisted journey/i)).toBeVisible();
    await expect(page.getByText(/There are no automatic overage charges and no rollover/i)).toBeVisible();
    await expect(page.getByText(/One Merchant \/ Brand has one canonical Store/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/en/merchant');
    await expect(page.getByRole('link', { name: 'Start 30-Day Pilot' })).toHaveAttribute('href', '/en/business/pilot?plan=founding_pilot');
    await expect(page.getByRole('link', { name: 'Choose Launch' })).toHaveAttribute('href', '/en/business/pilot?plan=launch');
    await expect(page.getByRole('link', { name: 'Choose Growth' })).toHaveAttribute('href', '/en/business/pilot?plan=growth');
    await expect(page.getByRole('link', { name: 'Choose Scale' })).toHaveAttribute('href', '/en/business/pilot?plan=scale');
    await expect(page.getByRole('link', { name: 'Contact Sales' }).first()).toHaveAttribute('href', '/en/business/pilot?plan=enterprise');
    await expect(page.locator('body')).not.toContainText(/price_(?:live|test|[A-Za-z0-9]+)/i);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('Merchant pricing comparison remains usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/business/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('table[aria-label="Merchant plan comparison"]')).toBeVisible();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(390);
  });

  for (const locale of ['de', 'ja', 'fr']) {
    test(`${locale} pricing route canonicalizes to the English merchant pricing page`, async ({ page }) => {
      const response = await page.goto(`/${locale}/business/pricing`, { waitUntil: 'domcontentloaded' });

      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(400);
      await expect(page).toHaveURL('/en/business/pricing');
      await expect(page.getByRole('heading', { name: /Choose the right capacity for your next stage of eyewear commerce/i })).toBeVisible();
    });
  }
});
