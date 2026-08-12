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

  test('configured merchant route remains reachable after hydration', async ({ page }) => {
    const response = await page.goto('/en/store/ello-sunglasses', { waitUntil: 'networkidle' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/en\/store\/ello-sunglasses$/);
    await expect(page.locator('body')).not.toContainText(/page not found|application error|internal server error/i);
    await expect(page.locator('[data-presentation-mode="PRODUCT_FIRST"]')).toBeVisible();
    await expect(page.getByText('Reference pilot · simulation')).toBeVisible();
  });

  test('campaign experience route reuses the Store shell', async ({ page }) => {
    const response = await page.goto('/en/c/ello-sunglasses/petite-fit', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/en\/c\/ello-sunglasses\/petite-fit$/);
    await expect(page.locator('body')).not.toContainText(/application error|internal server error/i);
    await expect(page.locator('[data-presentation-mode="EDITORIAL_FIRST"]')).toBeVisible();
    await expect(page.locator('[data-presentation-cta="shopping-interest"]').first()).toBeVisible();
    await expect(page.locator('header')).not.toContainText('Powered by');
    await expect(page.getByText('Powered by VisuTry')).toBeVisible();
    await expect(page.getByText('Petite Fit Reference Experience', { exact: true })).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(/Campaign experience|search engines and agents|Reference catalog · VisuTry Reference|Optional interactive experience/i);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expect(page.locator('img[alt="ello sunglasses eyewear collection"]').first()).toBeVisible();

    const productHref = await page.getByRole('link', { name: 'View product' }).first().getAttribute('href');
    expect(productHref).not.toBeNull();
    const productUrl = new URL(productHref!, 'http://localhost');
    expect(productUrl.searchParams.get('source')).toBe('visutry');
    expect(productUrl.searchParams.get('utm_source')).toBe('visutry.com');
    expect(productUrl.searchParams.get('utm_medium')).toBe('referral');
    expect(productUrl.searchParams.get('utm_campaign')).toBe('campaign-petite-fit');
    expect(productUrl.searchParams.get('utm_content')).toBe('product');

    const merchantHref = await page.getByRole('link', { name: /Visit ello sunglasses/i }).getAttribute('href');
    expect(merchantHref).not.toBeNull();
    const merchantUrl = new URL(merchantHref!, 'http://localhost');
    expect(merchantUrl.searchParams.get('surface')).toBe('campaign');
    expect(merchantUrl.searchParams.get('utm_campaign')).toBe('campaign-petite-fit');
    expect(merchantUrl.searchParams.get('utm_content')).toBe('merchant');
  });

  test('known contextual handoffs use action-first without changing the route contract', async ({ page }) => {
    const response = await page.goto('/en/c/ello-sunglasses/petite-fit?source=visutry&medium=internal&surface=face-analysis&campaign=face-analysis-fit', { waitUntil: 'networkidle' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page.locator('[data-presentation-mode="EDITORIAL_FIRST"]')).toBeVisible();
    await page.getByRole('button', { name: 'Try on your photo', exact: true }).click();
    await expect(page.locator('[data-presentation-mode="ACTION_FIRST"]')).toBeVisible();
    await expect(page.getByText('Reference pilot · simulation')).toBeVisible();
    await expect(page.getByRole('button', { name: /start with my photo/i })).toHaveCount(1);
  });

  test('presentation modes remain usable at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto('/en/store/ello-sunglasses', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-presentation-mode="PRODUCT_FIRST"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('campaign offers the same merchant Store without replacing first-touch attribution', async ({ page }) => {
    const response = await page.goto('/en/c/ello-sunglasses/petite-fit?source=visutry&medium=internal&surface=discover&campaign=discover-featured', { waitUntil: 'networkidle' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await page.getByRole('button', { name: 'Try on your photo', exact: true }).click();
    await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible();
    await page.getByRole('button', { name: /I understand.*continue/i }).click();
    const storeLink = page.getByRole('link', { name: 'Visit the full Store' });
    await expect(storeLink).toBeVisible();
    const href = await storeLink.getAttribute('href');
    expect(href).not.toBeNull();
    const storeUrl = new URL(href!, 'http://localhost');
    expect(storeUrl.pathname).toBe('/en/store/ello-sunglasses');
    expect(storeUrl.searchParams.get('source')).toBe('visutry');
    expect(storeUrl.searchParams.get('medium')).toBe('internal');
    expect(storeUrl.searchParams.get('surface')).toBe('discover');
    expect(storeUrl.searchParams.get('campaign')).toBe('discover-featured');
  });

  test('applies the merchant compare policy to the shortlist without generating AI output', async ({ page }) => {
    const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const frames = [1, 2, 3].map((index) => ({
      id: `frame-${index}`,
      name: `ello Frame ${index}`,
      imageUrl: null,
      productUrl: `https://example.com/frame-${index}`,
      price: null,
      currency: null,
      shape: 'round',
      material: null,
      color: null,
      widthClass: 'petite',
      styleTags: ['petite-fit'],
      score: 90 - index,
      reason: 'Petite-fit proportions',
    }));

    await page.route('**/api/store/merchants/ello-sunglasses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'merchant-ello',
            slug: 'ello-sunglasses',
            name: 'ello sunglasses',
            logoUrl: null,
            websiteUrl: 'https://ellosunglasses.com/',
            accentColor: '#1D4ED8',
            pilotType: 'REFERENCE',
            referenceData: true,
            activeFrameCount: 3,
            featuredFrames: frames,
            status: 'ACTIVE',
            experiencePolicy: {
              tryOnEnabled: true,
              compareEnabled: true,
              maxCompareFrames: 2,
              inquiryEnabled: false,
            },
          },
        }),
      });
    });
    await page.route('**/api/store/sessions', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { merchantId: 'merchant-ello', merchantSessionId: 'session-ello', expiresAt: new Date(Date.now() + 60_000).toISOString() } }),
      });
    });
    await page.route('**/api/store/sessions/photo', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { previewUrl: preview } }) });
    });
    await page.route('**/api/store/sessions/recommend', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { rankingVersion: 'mock', frames } }) });
    });
    await page.route('**/api/store/sessions/select-frames', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { selectedFrameIds: ['frame-1', 'frame-2'] } }) });
    });
    // Keep this policy smoke deterministic and free of MediaPipe/provider work.
    await page.route('**/mediapipe/**', (route) => route.abort());
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
    await page.route('https://storage.googleapis.com/**', (route) => route.abort());

    await page.goto('/en/store/ello-sunglasses', { waitUntil: 'networkidle' });
    await expect(page.getByText('Reference pilot · simulation')).toBeVisible();
    await page.getByRole('button', { name: 'Try on your photo', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Interactive shopping experience' })).toBeVisible();
    await page.getByRole('button', { name: /I understand.*continue/i }).click();
    await page.locator('input[type="file"]').setInputFiles({ name: 'shopper.png', mimeType: 'image/png', buffer: Buffer.from(preview.split(',')[1], 'base64') });

    const recommendationSection = page.getByRole('region', { name: 'Interactive shopping experience' }).locator('section').filter({ hasText: 'Select up to 2 to try on' });
    await expect(recommendationSection).toBeVisible();
    await expect(recommendationSection).not.toContainText(/ranking|store-rank-v1|AI edit/i);
    await expect(recommendationSection).toContainText('ello sunglasses');
    await expect(page.getByText('Select up to 2 to try on')).toBeVisible();
    const frameButtons = recommendationSection.getByRole('button');
    await frameButtons.nth(0).click();
    await frameButtons.nth(1).click();
    await expect(frameButtons.nth(2)).toBeDisabled();
    await expect(page.getByText('Selected 2 of 2')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('maximum of 2');
  });
});
