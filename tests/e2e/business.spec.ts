import { test, expect } from '@playwright/test';

test.describe('@critical Business market-facing narrative', () => {
  test('business route explains the catalog-to-intelligence story without fake proof', async ({ page }) => {
    const response = await page.goto('/en/business', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/AI Commerce for Eyewear Brands & Agencies \| VisuTry/);
    await expect(page.getByRole('heading', { name: /Be discovered\. Help shoppers decide\. Turn intent into action\./i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Store for continuity\. Campaigns for focus/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /One workspace to operate the experiences around your catalog/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Know whether the journey is creating meaningful intent/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start 30-Day Pilot' }).first()).toHaveAttribute('href', '/en/business/pilot');
    await expect(page.getByRole('link', { name: 'Merchant Sign In' }).first()).toHaveAttribute('href', '/en/merchant');
    await expect(page.getByRole('link', { name: 'Explore Store' }).first()).toHaveAttribute('href', '/en/business/store');
    await expect(page.locator('a[href="/admin/store"]')).toHaveCount(0);
    await expect(page.getByAltText(/VisuTry Commerce Intelligence visual with shopper engagement and intent signals/i)).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/trusted by|our customers|our partners|ROAS|sales lift/i);
  });

  test('core Business pages have distinct information roles under the same Merchant narrative', async ({ page }) => {
    const expectations = [
      ['/en/business/platform', /The system behind every VisuTry decision experience/i, /Platform architecture/i],
      ['/en/business/store', /An always-on decision experience for your eyewear catalog/i, /When to use Store/i],
      ['/en/business/campaigns', /Focused decision experiences for campaign traffic/i, /When to use Campaigns/i],
      ['/en/business/commerce-intelligence', /See where the decision journey gains — or loses — momentum/i, /Questions it answers/i],
    ] as const

    for (const [route, hero, section] of expectations) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response).not.toBeNull()
      expect(response!.status()).toBeLessThan(400)
      await expect(page.getByRole('heading', { name: hero })).toBeVisible()
      await expect(page.getByText(section)).toBeVisible()
      await expect(page.getByRole('link', { name: 'Start 30-Day Pilot' }).first()).toHaveAttribute('href', '/en/business/pilot')
    }
  })

  test('core Business pages preserve the visual hierarchy without mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    for (const route of [
      '/en/business',
      '/en/business/platform',
      '/en/business/store',
      '/en/business/campaigns',
      '/en/business/commerce-intelligence',
    ]) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response).not.toBeNull()
      expect(response!.status()).toBeLessThan(400)
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(documentWidth).toBeLessThanOrEqual(390)
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('public Merchant CTA preserves the anonymous authentication continuation', async ({ page }) => {
    await page.goto('/en/business', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click();
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
      await expect(page.getByRole('heading', { name: /Be discovered\. Help shoppers decide\. Turn intent into action\./i })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Start 30-Day Pilot' }).first()).toHaveAttribute('href', '/en/business/pilot');
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
    await expect(page).toHaveTitle(/VisuTry Eyewear AI Commerce Pricing/);
    await expect(page.getByRole('heading', { name: /Simple pricing for the full eyewear decision journey/i })).toBeVisible();
    await expect(page.getByText(/not individual renders/i)).toBeVisible();
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
    await expect(page.locator('#pilot')).toContainText('From $149 / 30 days');
    await expect(page.locator('#pilot')).toContainText('Typical pilot includes');
    await expect(page.locator('#pilot')).toContainText('8–50 real frames');
    await expect(page.locator('#pilot')).toContainText('Virtual Try-On + Compare');
    await expect(page.locator('#pilot')).toContainText('Scope confirmed before billing');
    await expect(page.locator('#pilot')).toContainText(/deployment configurations may vary in scope and pricing/i);
    await expect(page.locator('#pilot')).not.toContainText('1,500');
    await expect(page.locator('#pilot')).not.toContainText('3,500');
    await expect(page.getByRole('heading', { name: /One shopper journey, one session/i })).toBeVisible();
    await expect(page.getByText(/A shopper enters a Store or Campaign, starts Recommendation/i)).toBeVisible();
    await expect(page.getByText(/There are no automatic overage charges and no rollover/i)).toBeVisible();
    await expect(page.getByText('One Merchant / Brand has one canonical Store.', { exact: true })).toBeVisible();
    const sessionsTooltipButton = page.getByRole('button', { name: 'AI Commerce Sessions explanation' });
    await expect(sessionsTooltipButton).toBeVisible();
    await page.waitForLoadState('networkidle');
    await sessionsTooltipButton.click();
    await expect(page.getByRole('tooltip')).toContainText(/1 AI Commerce Session/i);
    await expect(page.getByRole('link', { name: 'Start Free' }).first()).toHaveAttribute('href', '/en/merchant?commercialIntent=FREE');
    await expect(page.getByRole('link', { name: 'Request Pilot Review' })).toHaveAttribute('href', '/en/business/pilot');
    await expect(page.getByRole('heading', { name: /One journey from discovery to a confident decision/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Reference Experience' })).toHaveAttribute('href', '/en/c/akila/statement-frames');
    await expect(page.getByRole('link', { name: 'Choose Launch' })).toHaveAttribute('href', '/en/merchant?commercialIntent=LAUNCH');
    await expect(page.getByRole('link', { name: 'Choose Growth' })).toHaveAttribute('href', '/en/merchant?commercialIntent=GROWTH');
    await expect(page.getByRole('link', { name: 'Choose Scale' })).toHaveAttribute('href', '/en/merchant?commercialIntent=SCALE');
    await expect(page.getByRole('link', { name: 'Contact Sales' }).first()).toHaveAttribute('href', '/en/business/pilot?plan=enterprise');
    await expect(page.locator('body')).not.toContainText(/price_(?:live|test|[A-Za-z0-9]+)/i);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('Pilot page presents one configurable Founding Pilot offer from $149', async ({ page }) => {
    const response = await page.goto('/en/business/pilot', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Start a VisuTry Founding Merchant Pilot/);
    await expect(page.getByRole('heading', { name: 'From $149 / 30 days.' })).toBeVisible();
    await expect(page.getByText(/Final scope and pilot fee are confirmed based on your deployment configuration/i)).toBeVisible();
    await expect(page.getByText(/Hosted, Campaign, in-store, and other deployment configurations may vary in scope and pricing/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Request Pilot Review' })).toHaveAttribute('href', '#pilot-request');
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
      await expect(page.getByRole('heading', { name: /Simple pricing for the full eyewear decision journey/i })).toBeVisible();
    });
  }
});
