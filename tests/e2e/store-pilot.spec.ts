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
    const response = await page.goto('/en/store/ello-sunglasses', { waitUntil: 'domcontentloaded' });

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
    await expect(page.getByRole('link', { name: 'Explore the collection' })).toHaveAttribute('href', '#featured-frames');
    await expect(page.locator('header')).not.toContainText('Powered by');
    await expect(page.getByText('Powered by VisuTry')).toBeVisible();
    await expect(page.getByText('Petite Fit Reference Experience', { exact: true })).toBeVisible();
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

  test('contextual handoffs preserve the configured Campaign presentation mode', async ({ page }) => {
    const response = await page.goto('/en/c/ello-sunglasses/petite-fit?source=visutry&medium=internal&surface=face-analysis&campaign=face-analysis-fit', { waitUntil: 'load' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page.locator('[data-presentation-mode="EDITORIAL_FIRST"]')).toBeVisible();
    await page.getByRole('button', { name: 'Try on your photo', exact: true }).click();
    // The persisted merchant Campaign mode is authoritative. A contextual
    // handoff must not silently rewrite the merchant's configured hierarchy.
    await expect(page.locator('[data-presentation-mode="EDITORIAL_FIRST"]')).toBeVisible();
    await expect(page.getByText('Reference pilot · simulation')).toBeVisible();
    await expect(page.getByRole('button', { name: /start with my photo/i })).toBeVisible({ timeout: 20_000 });
  });

  test('the second Store workspace collection CTA scrolls back to the collection', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.goto('/en/store/ello-sunglasses', { waitUntil: 'load' });
    await page.getByRole('button', { name: 'Try on your photo', exact: true }).click();
    await expect(page.getByRole('dialog', { name: /try-on workspace/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible({ timeout: 20_000 });

    const collectionCtas = page.getByRole('button', { name: 'Explore the collection', exact: true });
    await expect(collectionCtas).toHaveCount(2);
    const workspaceScroller = page.locator('[role="dialog"] > div').last();
    await workspaceScroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight - element.clientHeight;
    });
    const beforeScrollTop = await workspaceScroller.evaluate((element) => element.scrollTop);

    await collectionCtas.last().click();
    await expect.poll(() => workspaceScroller.evaluate((element) => element.scrollTop)).toBeLessThan(beforeScrollTop);
    await expect(page.locator('#featured-frames-heading')).toBeVisible();
  });

  test('presentation modes remain usable at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto('/en/store/ello-sunglasses', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-presentation-mode="PRODUCT_FIRST"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('Store and Campaign landing actions remain usable at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['/en/store/ello-sunglasses', '/en/c/ello-sunglasses/petite-fit']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Explore the collection' })).toHaveAttribute('href', '#featured-frames');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test('campaign offers the same merchant Store without replacing first-touch attribution', async ({ page }) => {
    const response = await page.goto('/en/c/ello-sunglasses/petite-fit?source=visutry&medium=internal&surface=discover&campaign=discover-featured', { waitUntil: 'load' });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    const tryOnButton = page.getByRole('button', { name: 'Try on your photo', exact: true });
    await expect(tryOnButton).toBeVisible();
    await tryOnButton.click();
    await expect(page.getByRole('dialog', { name: /try-on workspace/i })).toBeVisible({ timeout: 20_000 });
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
    await page.setViewportSize({ width: 1365, height: 768 });
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
    await page.route('**/api/store/sessions/try-on', async (route) => {
      const request = route.request().postDataJSON() as { merchantFrameId: string };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            taskId: `task-${request.merchantFrameId}`,
            status: 'processing',
            frame: frames.find((frame) => frame.id === request.merchantFrameId),
          },
        }),
      });
    });
    await page.route('**/api/store/sessions/try-on/poll', async (route) => {
      const request = route.request().postDataJSON() as { taskId: string };
      const frameId = request.taskId.replace(/^task-/, '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'completed',
            resultImageUrl: preview,
            frame: frames.find((frame) => frame.id === frameId),
          },
        }),
      });
    });
    let compareCalls = 0;
    let productIntentCalls = 0;
    await page.route('**/api/store/sessions/compare', async (route) => {
      compareCalls += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { comparedFrameIds: ['frame-1', 'frame-2'] } }) });
    });
    await page.route('**/api/store/sessions/intent', async (route) => {
      const request = route.request().postDataJSON() as { type: string };
      if (request.type === 'PRODUCT_CLICK') productIntentCalls += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { intentId: 'intent-1' } }) });
    });
    // Keep this policy smoke deterministic and free of MediaPipe/provider work.
    await page.route('**/mediapipe/**', (route) => route.abort());
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
    await page.route('https://storage.googleapis.com/**', (route) => route.abort());

    await page.goto('/en/store/ello-sunglasses', { waitUntil: 'load' });
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
    await expect(page.getByRole('heading', { name: 'Your fit profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fit profile not available yet' })).toBeVisible();
    await expect(page.locator('[data-fit-map="store"]')).toHaveAttribute('data-fit-map-overlay', 'suppressed');
    const frameButtons = recommendationSection.locator('ul button');
    await frameButtons.nth(0).click();
    await frameButtons.nth(1).click();
    await expect(frameButtons.nth(2)).toBeDisabled();
    await expect(page.getByRole('complementary').getByText('Selected 2 of 2')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('maximum of 2');

    await page.locator('[data-selection-cta="desktop"]').click();
    await expect(page.getByText('Frames ready')).toBeVisible();
    await expect(page.locator('[data-selection-cta="desktop"]')).toHaveText(/Continue to Try-On/);
    await page.getByRole('button', { name: 'Try on 2 frames' }).click();
    await expect(page.getByRole('button', { name: 'Compare 2 results' })).toBeVisible();
    await page.getByRole('button', { name: 'Compare 2 results' }).click();
    await expect(page.getByRole('heading', { name: 'Side-by-side compare' })).toBeVisible();
    await expect.poll(() => compareCalls).toBe(1);
    await page.getByRole('button', { name: 'View product' }).first().click();
    await expect.poll(() => productIntentCalls).toBe(1);
  });

  test('keeps a real provider failure retryable without opening entitlement continuation', async ({ page }) => {
    const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const frame = {
      id: 'retry-frame-1',
      name: 'Retry frame',
      imageUrl: null,
      productUrl: 'https://example.com/retry-frame',
      price: null,
      currency: null,
      shape: 'round',
      material: null,
      color: null,
      widthClass: 'petite',
      styleTags: ['petite-fit'],
      score: 90,
      reason: 'Petite-fit proportions',
    };

    await page.route('**/api/store/merchants/ello-sunglasses*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'merchant-retry',
            slug: 'ello-sunglasses',
            name: 'ello sunglasses',
            logoUrl: null,
            websiteUrl: null,
            accentColor: '#1D4ED8',
            pilotType: 'REFERENCE',
            referenceData: true,
            activeFrameCount: 1,
            featuredFrames: [frame],
            status: 'ACTIVE',
            experience: null,
            experiencePolicy: { tryOnEnabled: true, compareEnabled: true, maxCompareFrames: 2, inquiryEnabled: false },
          },
        }),
      });
    });
    await page.route('**/api/store/sessions', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { merchantId: 'merchant-retry', merchantSessionId: 'session-retry', expiresAt: new Date(Date.now() + 60_000).toISOString() } }) });
    });
    await page.route('**/api/store/sessions/photo', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { previewUrl: preview } }) });
    });
    await page.route('**/api/store/sessions/recommend', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { rankingVersion: 'mock', frames: [frame] } }) });
    });
    await page.route('**/api/store/sessions/select-frames', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { selectedFrameIds: [frame.id] } }) });
    });
    let submitCalls = 0;
    await page.route('**/api/store/sessions/try-on', async (route) => {
      submitCalls += 1;
      if (submitCalls === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'PROVIDER_FAILED', error: 'Provider unavailable' }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { taskId: 'retry-task-1', status: 'processing', frame } }) });
    });
    let pollCalls = 0;
    await page.route('**/api/store/sessions/try-on/poll', async (route) => {
      pollCalls += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'completed', resultImageUrl: preview, frame } }) });
    });
    await page.route('**/mediapipe/**', (route) => route.abort());
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
    await page.route('https://storage.googleapis.com/**', (route) => route.abort());

    await page.goto('/en/store/ello-sunglasses', { waitUntil: 'load' });
    await page.getByRole('button', { name: 'Try on your photo', exact: true }).click();
    await expect(page.getByRole('dialog', { name: /try-on workspace/i })).toBeVisible();
    await page.getByRole('button', { name: /I understand.*continue/i }).click();
    await page.locator('input[type="file"]').setInputFiles({ name: 'retry-shopper.png', mimeType: 'image/png', buffer: Buffer.from(preview.split(',')[1], 'base64') });
    const recommendationSection = page.locator('section').filter({ hasText: 'Select up to 2 to try on' }).first();
    await expect(recommendationSection).toBeVisible();
    await recommendationSection.locator('ul button').first().click();
    await page.locator('[data-selection-cta="desktop"]').click();
    await expect(page.getByText('Frames ready')).toBeVisible();
    await page.getByRole('button', { name: 'Try on 1 frame' }).click();
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: /Your sponsored Try-On is used|Your Consumer credits are unavailable/ })).toHaveCount(0);
    expect(pollCalls).toBe(0);

    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect.poll(() => pollCalls).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'View product', exact: true })).toBeVisible();
  });

  test('turns Store/Campaign AUTH_REQUIRED into an explicit bounded shopper continuation', async ({ page }) => {
    const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const frames = [1, 2].map((index) => ({
      id: `continuation-frame-${index}`,
      name: `Continuation frame ${index}`,
      imageUrl: null,
      productUrl: null,
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

    await page.route('**/api/store/merchants/ello-sunglasses*', async (route) => {
      const isCampaign = route.request().url().includes('experienceSlug=petite-fit');
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
            websiteUrl: null,
            accentColor: '#1D4ED8',
            pilotType: 'REFERENCE',
            referenceData: true,
            activeFrameCount: frames.length,
            featuredFrames: frames,
            status: 'ACTIVE',
            experience: {
              id: isCampaign ? 'experience-campaign' : 'experience-store',
              type: isCampaign ? 'CAMPAIGN' : 'STORE',
              slug: isCampaign ? 'petite-fit' : 'store',
              name: isCampaign ? 'Petite Fit' : 'Store',
              headline: null,
              description: null,
              heroAssetUrl: null,
              presentationMode: null,
              referenceData: true,
            },
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
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { merchantId: 'merchant-ello', merchantSessionId: `continuation-session-${Date.now()}`, expiresAt: new Date(Date.now() + 60_000).toISOString() } }) });
    });
    await page.route('**/api/store/sessions/photo', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { previewUrl: preview } }) });
    });
    await page.route('**/api/store/sessions/recommend', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { rankingVersion: 'mock', frames } }) });
    });
    await page.route('**/api/store/sessions/select-frames', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { selectedFrameIds: ['continuation-frame-1'] } }) });
    });
    await page.route('**/api/store/sessions/try-on', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, code: 'AUTH_REQUIRED', error: 'Sign in to continue with more AI generations.' }),
      });
    });
    let pollCalls = 0;
    await page.route('**/api/store/sessions/try-on/poll', async (route) => {
      pollCalls += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'processing' } }) });
    });
    await page.route('**/mediapipe/**', (route) => route.abort());
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
    await page.route('https://storage.googleapis.com/**', (route) => route.abort());

    for (const experiencePath of ['/en/store/ello-sunglasses', '/en/c/ello-sunglasses/petite-fit']) {
      await page.goto(experiencePath, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Try on your photo', exact: true }).click();
      await page.getByRole('button', { name: /I understand.*continue/i }).click();
      await page.locator('input[type="file"]').setInputFiles({ name: 'continuation-shopper.png', mimeType: 'image/png', buffer: Buffer.from(preview.split(',')[1], 'base64') });

      const recommendationSection = page.locator('section').filter({ hasText: 'Select up to 2 to try on' }).first();
      await expect(recommendationSection).toBeVisible();
      await recommendationSection.locator('ul button').nth(0).click();
      await recommendationSection.locator('ul button').nth(1).click();
      await page.locator('[data-selection-cta="desktop"]').click();
      await expect(page.getByText('Frames ready')).toBeVisible();
      await page.getByRole('button', { name: 'Try on 2 frames' }).click();

      const continuation = page.getByRole('alert').filter({ hasText: /Your sponsored Try-On is used|Your Consumer credits are unavailable/ });
      await expect(continuation).toBeVisible();
      await expect(page.getByText('Queued', { exact: true })).toHaveCount(0);
      expect(pollCalls).toBe(0);
      await expect(continuation).not.toContainText('Retry');
      const signInHref = await page.getByRole('link', { name: 'Sign in to continue', exact: true }).getAttribute('href');
      expect(signInHref).not.toBeNull();
      const signInUrl = new URL(signInHref!, 'http://localhost');
      expect(signInUrl.pathname).toBe('/en/auth/signin');
      const callbackUrl = new URL(signInUrl.searchParams.get('callbackUrl')!, 'http://localhost');
      expect(callbackUrl.pathname).toBe(experiencePath);
      expect(callbackUrl.searchParams.get('merchantContinuation')).not.toBeNull();
    }
  });

  test('keeps workspace progression visible on mobile width', async ({ page }) => {
    const viewports = [
      { width: 390, height: 844 },
      { width: 375, height: 812 },
    ];
    const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const frames = [1, 2].map((index) => ({
      id: `mobile-frame-${index}`,
      name: `Mobile frame ${index}`,
      imageUrl: null,
      productUrl: null,
      price: null,
      currency: null,
      shape: 'round',
      material: null,
      color: null,
      widthClass: 'medium',
      styleTags: [],
      score: 90 - index,
      reason: 'Balanced proportions',
    }));

    await page.route('**/api/store/merchants/ello-sunglasses**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'merchant-mobile',
            slug: 'ello-sunglasses',
            name: 'ello sunglasses',
            logoUrl: null,
            websiteUrl: null,
            accentColor: '#1D4ED8',
            pilotType: 'REFERENCE',
            referenceData: true,
            activeFrameCount: 2,
            featuredFrames: frames,
            experiencePolicy: { tryOnEnabled: true, compareEnabled: true, maxCompareFrames: 2, inquiryEnabled: false },
          },
        }),
      });
    });
    await page.route('**/api/store/sessions', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { merchantId: 'merchant-mobile', merchantSessionId: 'session-mobile', expiresAt: new Date(Date.now() + 60_000).toISOString() } }) });
    });
    await page.route('**/api/store/sessions/photo', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { previewUrl: preview } }) });
    });
    await page.route('**/api/store/sessions/recommend', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { frames } }) });
    });
    await page.route('**/api/store/sessions/select-frames', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { selectedFrameIds: frames.map((frame) => frame.id) } }) });
    });
    await page.route('**/mediapipe/**', (route) => route.abort());
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
    await page.route('https://storage.googleapis.com/**', (route) => route.abort());

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/en/store/ello-sunglasses', { waitUntil: 'load' });
      const launcherButton = page.getByRole('button', { name: 'Try on your photo', exact: true });
      await expect(launcherButton).toBeVisible();
      await launcherButton.click();
      await expect(page.getByRole('dialog', { name: /try-on workspace/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible();
      await page.getByRole('button', { name: /I understand.*continue/i }).click();
      await page.locator('input[type="file"]').setInputFiles({ name: 'mobile-shopper.png', mimeType: 'image/png', buffer: Buffer.from(preview.split(',')[1], 'base64') });

      const recommendationSection = page.locator('section').filter({ hasText: 'Select up to 2 to try on' }).first();
      await expect(recommendationSection).toBeVisible();
      const frameButtons = recommendationSection.locator('ul button');
      await frameButtons.nth(0).click();
      await frameButtons.nth(1).click();
      const mobileCta = page.locator('[data-selection-cta="mobile"]');
      await expect(mobileCta).toBeVisible();
      await expect(mobileCta).toHaveText(/Try on selected frames/);
      await mobileCta.click();
      await expect(mobileCta).toHaveText(/Continue to Try-On/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test('reopens a mobile Store workspace after a signed-in or payment continuation return', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const frame = {
      id: 'resume-frame-1',
      name: 'Resume frame',
      imageUrl: null,
      productUrl: null,
      price: null,
      currency: null,
      shape: 'round',
      material: null,
      color: null,
      widthClass: 'medium',
      styleTags: [],
      score: 92,
      reason: 'Balanced proportions',
      productBrand: 'ello',
    };
    const context = {
      locale: 'en',
      merchantSlug: 'ello-sunglasses',
      experienceType: 'STORE',
      canonicalReturnPath: '/en/store/ello-sunglasses',
    };
    const continuation = encodeURIComponent(JSON.stringify(context));
    const storageKey = 'vt_store_continuation:en:STORE:ello-sunglasses:store';
    const resumeState = {
      merchantId: 'merchant-resume',
      merchantSessionId: 'session-resume',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      photoPreview: '/assets/glasses-presets/browline-classic.jpg',
      recommendations: [frame],
      selectedIds: [frame.id],
      selectionSaved: true,
      batchId: 'resume-batch-1',
    };

    await page.addInitScript(({ key, value }) => {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // about:blank may not expose storage; the same script runs again on the app origin.
      }
    }, { key: storageKey, value: resumeState });
    await page.route('**/api/store/merchants/ello-sunglasses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'merchant-resume',
            slug: 'ello-sunglasses',
            name: 'ello sunglasses',
            logoUrl: null,
            websiteUrl: null,
            accentColor: '#1D4ED8',
            pilotType: 'REFERENCE',
            referenceData: true,
            activeFrameCount: 1,
            featuredFrames: [frame],
            experiencePolicy: { tryOnEnabled: true, compareEnabled: true, maxCompareFrames: 2, inquiryEnabled: false },
          },
        }),
      });
    });

    await page.goto(`/en/store/ello-sunglasses?merchantContinuation=${continuation}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('dialog', { name: /try-on workspace/i })).toBeVisible();
    await expect(page.locator('[data-selection-cta="mobile"]')).toHaveText(/Continue to Try-On/);
    await expect(page.getByRole('button', { name: /Try on 1 frame/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
