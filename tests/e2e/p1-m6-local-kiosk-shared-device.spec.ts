import { expect, test } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const isLocalKioskRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_M5_LOCAL_DECISION_RESULT_E2E === '1'
  && process.env.P1_M6_LOCAL_KIOSK_E2E === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

test.describe('P1-M6 Local Kiosk shared-device privacy', () => {
  test('runs the kiosk golden path, preserves the phone Result, and resets A→B on manual and idle boundaries', async ({ page, request, browser }) => {
    // The final idle-boundary assertion exercises the real configured timeout
    // (120s), in addition to the complete recommendation/Try-On/Result path.
    test.setTimeout(360_000)
    test.skip(!isLocalKioskRun, 'Run against the guarded Local PostgreSQL environment with the P1-M6 fixture flag.')

    const evidenceDir = '/tmp/visutry-p1-m6-local-kiosk'
    mkdirSync(evidenceDir, { recursive: true })
    const browserErrors: string[] = []
    const serverErrors: string[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      const text = message.text()
      const knownMediaPipeCpuInfo = text.startsWith('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')
      if (message.type() === 'error' && !text.startsWith('Failed to load resource:') && !knownMediaPipeCpuInfo) {
        browserErrors.push(text)
      }
    })
    page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`) })

    const csrf = await request.get('/api/auth/csrf').then((response) => response.json()) as { csrfToken: string }
    const login = await request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'admin@local.test', qaIdentity: 'admin', type: 'admin', csrfToken: csrf.csrfToken, callbackUrl: '/admin/store', json: 'true' },
    })
    expect(login.ok()).toBeTruthy()
    const merchantsResponse = await request.get('/api/admin/store/merchants')
    expect(merchantsResponse.status()).toBe(200)
    const merchantsPayload = await merchantsResponse.json() as { data: { merchants: Array<{ id: string; slug: string }> } }
    const merchant = merchantsPayload.data.merchants.find((item) => item.slug === 'local-qa-pilot')
    test.skip(!merchant, 'Provision local-qa-pilot with the Local Live Pulse E2E first.')
    const experiencesResponse = await request.get(`/api/admin/store/merchants/${merchant!.id}/experiences?type=STORE`)
    expect(experiencesResponse.status()).toBe(200)
    const experiencesPayload = await experiencesResponse.json() as { data: { experiences: Array<{ id: string; type: string }> } }
    const storeExperience = experiencesPayload.data.experiences.find((item) => item.type === 'STORE')
    test.skip(!storeExperience, 'The Local pilot needs an active Store Experience.')
    const detailResponse = await request.get(`/api/admin/store/merchants/${merchant!.id}/experiences/${storeExperience!.id}`)
    expect(detailResponse.status()).toBe(200)
    const detailPayload = await detailResponse.json() as { data: { experience: Record<string, unknown> } }
    const originalExperience = detailPayload.data.experience

    // Prepare one additional Local-only catalog frame so the real browser run
    // can execute Compare as well as Try-On. This mutates only the guarded DB.
    const ownerCsrf = await request.get('/api/auth/csrf').then((response) => response.json()) as { csrfToken: string }
    const ownerLogin = await request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'test@example.com', qaIdentity: 'existing', type: 'free', csrfToken: ownerCsrf.csrfToken, callbackUrl: '/en/merchant', json: 'true' },
    })
    expect(ownerLogin.ok()).toBeTruthy()
    const catalogPath = `/api/merchant/${encodeURIComponent(merchant!.id)}/catalog`
    const sku = 'LOCAL-P1-M6-KIOSK-COMPARE'
    const lookupResponse = await request.get(`${catalogPath}?readiness=all&limit=100&search=${encodeURIComponent(sku)}`)
    expect(lookupResponse.status()).toBe(200)
    const lookup = await lookupResponse.json() as { data: { items: Array<{ id: string; sku: string | null }> } }
    let compareFrame = lookup.data.items.find((item) => item.sku === sku)
    if (!compareFrame) {
      const createResponse = await request.post(catalogPath, {
        data: { approved: true, frames: [{
          sku,
          name: 'Kiosk Compare Round Frame',
          brand: 'Local QA',
          imageUrl: 'http://127.0.0.1:3001/assets/glasses-presets/large-round-classic.jpg',
          productUrl: 'https://merchant.example.test/kiosk-frame',
          price: 11900,
          currency: 'USD',
          shape: 'round',
          source: 'MANUAL',
          enrichmentStatus: 'NOT_REQUIRED',
        }] },
      })
      expect(createResponse.status()).toBe(200)
      const readyResponse = await request.get(`${catalogPath}?readiness=READY&limit=100&search=${encodeURIComponent(sku)}`)
      expect(readyResponse.status()).toBe(200)
      const ready = await readyResponse.json() as { data: { items: Array<{ id: string; sku: string | null }> } }
      compareFrame = ready.data.items.find((item) => item.sku === sku)
    }
    expect(compareFrame).toBeTruthy()
    const storePath = `/api/merchant/${encodeURIComponent(merchant!.id)}/store`
    const storeResponse = await request.get(storePath)
    expect(storeResponse.status()).toBe(200)
    const storePayload = await storeResponse.json() as { data: { store: { id: string; selectedFrameIds: string[] } } }
    const currentStore = storePayload.data.store
    const frameIds = [...new Set([...currentStore.selectedFrameIds, compareFrame!.id])]
    const selectionResponse = await request.put(storePath, { data: { storeId: currentStore.id, frameIds } })
    expect(selectionResponse.status()).toBe(200)

    // Switch back to the admin session for the Experience-scoped settings.
    const adminCsrf = await request.get('/api/auth/csrf').then((response) => response.json()) as { csrfToken: string }
    const adminLogin = await request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'admin@local.test', qaIdentity: 'admin', type: 'admin', csrfToken: adminCsrf.csrfToken, callbackUrl: '/admin/store', json: 'true' },
    })
    expect(adminLogin.ok()).toBeTruthy()

    const enableResponse = await request.put(`/api/admin/store/merchants/${merchant!.id}/experiences/${storeExperience!.id}`, {
      data: {
        // Give the longer A→Result golden path ample time; the dedicated idle
        // boundary below reconfigures the Local fixture to the supported 30s.
        deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 900 },
        primaryCtaType: 'LINK',
        primaryCtaLabel: 'Continue to merchant',
        primaryCtaUrl: 'https://merchant.example.test/contact',
      },
    })
    expect(enableResponse.status()).toBe(200)

    try {
      // Ordinary Web is still the existing modal flow and has no kiosk reset UI.
      const webContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const webPage = await webContext.newPage()
      await webPage.goto('/en/store/local-qa-pilot', { waitUntil: 'networkidle' })
      await webPage.getByRole('button', { name: 'Try on your photo' }).click()
      await expect(webPage.getByRole('dialog', { name: /try-on workspace/i })).toBeVisible()
      await expect(webPage.getByRole('dialog').getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
      await expect(webPage.getByRole('button', { name: 'New shopper' })).toHaveCount(0)
      await webPage.screenshot({ path: `${evidenceDir}/web-mobile-regression.png`, fullPage: true })
      await webContext.close()

      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.goto('/en/store/local-qa-pilot?deliveryProfile=kiosk', { waitUntil: 'networkidle' })
      await expect(page.getByRole('button', { name: 'Start over and clear this shopper' })).toBeVisible()
      await page.setViewportSize({ width: 1024, height: 768 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `${evidenceDir}/kiosk-ipad-class-touch-viewport.png`, fullPage: true })
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.screenshot({ path: `${evidenceDir}/kiosk-fresh-desktop.png`, fullPage: true })
      await page.getByRole('button', { name: /I understand.*continue/i }).click()
      await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
      await test.step('Shopper A photo upload and recommendation', async () => {
        await page.getByLabel('Your photo').setInputFiles({
          name: 'kiosk-shopper-a.jpg',
          mimeType: 'image/jpeg',
          buffer: readFileSync('public/home/Sophia-try-on-glasses-screen.jpg'),
        })
        await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({ timeout: 60_000 })
      }, { timeout: 90_000 })
      const availableFrames = page.getByRole('button', { name: /^Select / })
      await expect(availableFrames).toHaveCount(2)
      const firstFrameLabel = await availableFrames.nth(0).getAttribute('aria-label')
      const secondFrameLabel = await availableFrames.nth(1).getAttribute('aria-label')
      expect(firstFrameLabel).toBeTruthy()
      expect(secondFrameLabel).toBeTruthy()
      await page.screenshot({ path: `${evidenceDir}/kiosk-shopper-a-recommendations.png`, fullPage: true })
      await page.getByRole('button', { name: firstFrameLabel!, exact: true }).click()
      await page.getByRole('button', { name: secondFrameLabel!, exact: true }).click()
      await page.locator('[data-selection-cta="desktop"]').click()
      await expect(page.getByTestId('store-tryon-start')).toBeVisible()
      await page.getByTestId('store-tryon-start').click()
      await expect(page.locator('[data-testid^="store-tryon-result-"]')).toHaveCount(2, { timeout: 45_000 })
      await page.getByRole('button', { name: 'Compare 2 results' }).click()
      await expect(page.getByRole('heading', { name: 'Side-by-side compare' })).toBeVisible()
      await page.screenshot({ path: `${evidenceDir}/kiosk-shopper-a-tryon-compare.png`, fullPage: true })

      const resultLink = page.getByRole('link', { name: 'Open your private result' })
      await expect(resultLink).toBeVisible()
      const kioskResultHref = await resultLink.getAttribute('href')
      expect(kioskResultHref).toContain('deliveryProfile=kiosk')
      await resultLink.click()
      await expect(page.getByRole('heading', { name: /Your .* result/i })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Your curated shortlist' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Your completed looks' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Continue to merchant' })).toBeVisible()
      const resultUrl = new URL(page.url())
      const token = decodeURIComponent(resultUrl.pathname.split('/').at(-1) || '')
      expect(resultUrl.searchParams.get('deliveryProfile')).toBe('kiosk')
      await page.screenshot({ path: `${evidenceDir}/kiosk-shopper-a-result-qr-handoff.png`, fullPage: true })

      const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
      const phonePage = await phoneContext.newPage()
      await phonePage.goto(`/en/result/${encodeURIComponent(token)}`, { waitUntil: 'networkidle' })
      await expect(phonePage.getByRole('heading', { name: /Your .* result/i })).toBeVisible()
      await expect(phonePage.locator('img[src*="/api/store/results/"]').first()).toBeVisible()
      await expect(phonePage.getByRole('button', { name: 'New shopper' })).toHaveCount(0)
      await phonePage.screenshot({ path: `${evidenceDir}/clean-phone-canonical-result.png`, fullPage: true })

      // Manual reset from the shared Kiosk Result expires the shopper session,
      // while the independent canonical phone Result remains authorized.
      await page.getByRole('button', { name: 'New shopper' }).click()
      await expect(page).toHaveURL(/\/en\/store\/local-qa-pilot\?deliveryProfile=kiosk$/)
      await expect(page.getByRole('button', { name: 'Start over and clear this shopper' })).toBeVisible()
      await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
      await expect(page.getByRole('main').nth(1).getByRole('heading', { name: 'Recommended for you' })).toHaveCount(0)
      await expect(page.locator('[data-testid^="store-tryon-result-"]')).toHaveCount(0)
      const kioskStorage = await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('vt_store_')))
      expect(kioskStorage).toEqual([])
      const retainedResult = await phonePage.request.get(`/api/store/results/${encodeURIComponent(token)}`)
      expect(retainedResult.status()).toBe(200)

      // Browser history must not restore the just-reset in-memory session.
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
      await page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Your curated shortlist' })).toHaveCount(0)
      await page.screenshot({ path: `${evidenceDir}/kiosk-manual-reset-clean.png`, fullPage: true })

      // A browser reload intentionally drops the in-memory session ID while
      // leaving HttpOnly capability cookies in place. New shopper must use
      // that capability to expire the orphaned Local session and clear cookies.
      await page.getByRole('button', { name: /I understand.*continue/i }).click()
      await expect.poll(async () => (await page.context().cookies('http://127.0.0.1:3001'))
        .some((cookie) => cookie.name === 'vt_store_cap')).toBe(true)
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
      const orphanReset = page.waitForResponse((response) => response.url().endsWith('/api/store/sessions/kiosk-reset')
        && response.request().method() === 'POST')
      await page.getByRole('button', { name: 'Start over and clear this shopper' }).click()
      expect((await orphanReset).status()).toBe(200)
      await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
      const resetCookies = await page.context().cookies('http://127.0.0.1:3001')
      expect(resetCookies.some((cookie) => cookie.name === 'vt_store_cap')).toBe(false)
      expect(resetCookies.some((cookie) => cookie.name === 'vt_store_visitor')).toBe(false)

      // Shopper B starts from an empty profile and the configured idle timeout
      // independently returns the device to that same clean state.
      // Keep the complete A journey protected by the standard 120s timeout,
      // then lower the Local-only policy to its supported 30s minimum so the
      // independent idle-reset boundary remains fast and deterministic.
      const idlePolicyResponse = await request.put(`/api/admin/store/merchants/${merchant!.id}/experiences/${storeExperience!.id}`, {
        data: { deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 30 } },
      })
      expect(idlePolicyResponse.status()).toBe(200)
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
      await page.getByRole('button', { name: /I understand.*continue/i }).click()
      await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
      await page.getByLabel('Your photo').setInputFiles({
        name: 'kiosk-shopper-b.jpg',
        mimeType: 'image/jpeg',
        buffer: readFileSync('public/home/Ethan-try-on-glasses-screen.jpg'),
      })
      await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({ timeout: 45_000 })
      await expect(page.locator('[data-testid^="store-tryon-result-"]')).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'Your completed looks' })).toHaveCount(0)
      await expect(page.getByText(/For privacy, this kiosk reset after inactivity/i)).toHaveCount(0)
      await expect(page.getByRole('button', { name: /I understand.*continue/i })).toBeVisible({ timeout: 40_000 })
      await expect(page.getByText(/For privacy, this kiosk reset after inactivity/i)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Recommended for you' })).toHaveCount(0)
      await page.screenshot({ path: `${evidenceDir}/kiosk-idle-reset-clean.png`, fullPage: true })

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      expect(await phonePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      expect(browserErrors).toEqual([])
      expect(serverErrors).toEqual([])
      await phoneContext.close()
    } finally {
      const restoreResponse = await request.put(`/api/admin/store/merchants/${merchant!.id}/experiences/${storeExperience!.id}`, {
        data: {
          deliveryPolicy: originalExperience.deliveryPolicy ?? null,
          primaryCtaType: originalExperience.primaryCtaType ?? null,
          primaryCtaLabel: originalExperience.primaryCtaLabel ?? null,
          primaryCtaUrl: originalExperience.primaryCtaUrl ?? null,
        },
      })
      expect(restoreResponse.status()).toBe(200)
    }
  })
})
