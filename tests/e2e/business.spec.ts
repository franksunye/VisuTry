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
    await expect(page.getByRole('heading', { name: /Plans that scale with shopper engagement/i })).toBeVisible();
    await expect(page.getByText('No surprise usage billing.')).toBeVisible();
    await expect(page.locator('[data-primary-plan="true"]')).toHaveCount(3);
    await expect(page.locator('[data-plan-code="LAUNCH"][data-primary-plan="true"]')).toContainText('$199/month');
    await expect(page.locator('[data-plan-code="LAUNCH"][data-primary-plan="true"]')).toContainText('1,000');
    await expect(page.locator('[data-plan-code="LAUNCH"][data-primary-plan="true"]')).toContainText('100');
    await expect(page.locator('[data-plan-code="LAUNCH"][data-primary-plan="true"]')).toContainText('1');
    await expect(page.locator('[data-plan-code="GROWTH"][data-primary-plan="true"]')).toContainText('$499/month');
    await expect(page.locator('[data-plan-code="GROWTH"][data-primary-plan="true"]')).toContainText('5,000');
    await expect(page.locator('[data-plan-code="GROWTH"][data-primary-plan="true"]')).toContainText('500');
    await expect(page.locator('[data-plan-code="SCALE"][data-primary-plan="true"]')).toContainText('$999/month');
    await expect(page.locator('[data-plan-code="SCALE"][data-primary-plan="true"]')).toContainText('10,000');
    await expect(page.locator('[data-plan-code="SCALE"][data-primary-plan="true"]')).toContainText('2,000');
    await expect(page.locator('[data-plan-code="FREE"][data-free-entry="true"]')).toContainText('$0');
    await expect(page.locator('[data-plan-code="FREE"][data-free-entry="true"]')).toContainText('50 products');
    await expect(page.locator('[data-plan-code="FREE"][data-free-entry="true"]')).not.toContainText('Generative Try-On');
    await expect(page.locator('[data-plan-code="ENTERPRISE"][id="enterprise"]')).toContainText('$2,500+ / month');
    await expect(page.locator('[data-plan-code="ENTERPRISE"][id="enterprise"]')).toContainText('Contact Sales');
    await expect(page.getByRole('heading', { name: /Validate before choosing a monthly plan/i })).toBeVisible();
    await expect(page.locator('#pilot')).toContainText('$149 / 30 days');
    await expect(page.locator('#pilot')).toContainText('AI-assisted shoppers');
    await expect(page.locator('#pilot')).toContainText('1,500');
    await expect(page.locator('#pilot')).toContainText('3,500');
    await expect(page.locator('#pilot')).toContainText('No auto-renew');
    await expect(page.getByRole('heading', { name: /One shopper journey, one session/i })).toBeVisible();
    await expect(page.getByText(/A shopper enters a Store or Campaign, starts Recommendation/i)).toBeVisible();
    await expect(page.getByText(/There are no automatic overage charges and no rollover/i)).toBeVisible();
    await expect(page.getByText('One Merchant / Brand has one canonical Store.', { exact: true })).toBeVisible();
    const sessionsTooltipButton = page.getByRole('button', { name: 'AI Commerce Sessions explanation' });
    await expect(sessionsTooltipButton).toBeVisible();
    await page.waitForLoadState('networkidle');
    await sessionsTooltipButton.click();
    await expect(page.getByRole('tooltip')).toContainText(/1 AI Commerce Session/i);
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
      await expect(page.getByRole('heading', { name: /Plans that scale with shopper engagement/i })).toBeVisible();
    });
  }
});
