import { expect, test, type APIResponse } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const isLocalLivePulseRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_M3_LIVE_PULSE_E2E === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

type Envelope<T> = { success?: boolean; data?: T; error?: string; message?: string }

async function readApi<T>(response: APIResponse, status: number, label: string): Promise<T> {
  const body = await response.json() as Envelope<T>
  expect(response.status(), `${label}: ${body.message || body.error || 'unexpected response'}`).toBe(status)
  expect(body.success, label).toBe(true)
  return body.data as T
}

test.describe('P1-M3 Local Live Commerce Pulse', () => {
  test('shows a truthful quiet state, then real Store activity on Home without reload', async ({ page }) => {
    test.skip(!isLocalLivePulseRun, 'Run npm run merchant:local:live-pulse:e2e against the guarded Local PostgreSQL environment.')

    const browserErrors: string[] = []
    const serverErrors: Array<{ status: number; url: string }> = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) browserErrors.push(message.text())
    })
    page.on('response', (response) => {
      if (response.status() >= 500) serverErrors.push({ status: response.status(), url: response.url() })
    })

    const evidenceDir = '/tmp/visutry-p1-m3-live-experience'
    mkdirSync(evidenceDir, { recursive: true })
    const capture = async (name: string, fullPage = false) => {
      await page.screenshot({ path: `${evidenceDir}/${name}.png`, fullPage })
      return page.evaluate(() => ({
        viewport: { width: innerWidth, height: innerHeight },
        pageHeight: document.documentElement.scrollHeight,
        headerHeight: document.querySelector('header')?.getBoundingClientRect().height ?? null,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      }))
    }

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page.getByRole('region', { name: 'Local QA' })).toBeVisible()
    const csrf = await page.request.get('/api/auth/csrf').then((response) => response.json()) as { csrfToken: string }
    const login = await page.request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'test@example.com', qaIdentity: 'existing', type: 'free', csrfToken: csrf.csrfToken, callbackUrl: '/en/merchant', json: 'true' },
    })
    expect(login.ok(), 'Local TEST identity authenticates through mock credentials').toBeTruthy()
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    const merchantSwitcher = page.getByRole('combobox', { name: 'Active merchant' })
    await expect(merchantSwitcher).toBeVisible()
    const merchantOptions = await merchantSwitcher.locator('option').evaluateAll((options) => options.map((option) => ({
      id: (option as HTMLOptionElement).value,
      name: option.textContent?.trim() ?? '',
    })))
    const merchant = merchantOptions.find((item) => item.name === 'Local QA-PILOT')
    expect(merchant, 'Local QA-PILOT TEST Merchant is available to the existing QA identity').toBeTruthy()
    const catalogPath = `/api/merchant/${encodeURIComponent(merchant!.id)}/catalog`
    const sku = 'LOCAL-P1-M3-LIVE-PULSE'
    const lookupResponse = await page.request.get(`${catalogPath}?readiness=all&limit=100&search=${encodeURIComponent(sku)}`)
    const lookup = await readApi<{ items: Array<{ id: string; name: string; sku: string | null }> }>(lookupResponse, 200, 'Read Local Pulse Catalog product')
    let frame = lookup.items.find((item) => item.sku === sku)
    if (!frame) {
      const createdResponse = await page.request.post(catalogPath, {
        data: { approved: true, frames: [{
          sku,
          name: 'Live Pulse Round Frame',
          brand: 'Local QA',
          imageUrl: 'http://127.0.0.1:3001/assets/glasses-presets/large-round-classic.jpg',
          productUrl: 'http://127.0.0.1:3001/local/live-pulse-product',
          price: 12900,
          currency: 'USD',
          shape: 'round',
          source: 'MANUAL',
          enrichmentStatus: 'NOT_REQUIRED',
        }] },
      })
      await readApi<unknown>(createdResponse, 200, 'Create Local TEST Catalog product')
      const readyResponse = await page.request.get(`${catalogPath}?readiness=READY&limit=100&search=${encodeURIComponent(sku)}`)
      const ready = await readApi<{ items: Array<{ id: string; name: string; sku: string | null }> }>(readyResponse, 200, 'Verify Local ready product')
      frame = ready.items.find((item) => item.sku === sku)
    }
    expect(frame, 'The real TEST product is Store-ready').toBeTruthy()

    const storePath = `/api/merchant/${encodeURIComponent(merchant!.id)}/store`
    const storeResponse = await page.request.get(storePath)
    const storeData = await readApi<{ store: { id: string; status: string; publicPath?: string } | null }>(storeResponse, 200, 'Read Local TEST Store')
    let store = storeData.store
    if (!store) {
      const createStoreResponse = await page.request.post(storePath, { data: { name: 'Local QA Live Pulse Store' } })
      store = await readApi<{ id: string; status: string }>(createStoreResponse, 200, 'Create Local private Store draft')
    }
    const selectionResponse = await page.request.put(storePath, { data: { storeId: store.id, frameIds: [frame!.id] } })
    await readApi<unknown>(selectionResponse, 200, 'Select the Local TEST product')

    // Complete the existing First Value Preview through the normal UI so the
    // operating-mode page gate is proven from canonical state, not fabricated.
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchant!.id)}`, { waitUntil: 'networkidle' })
    const alreadyOperating = await page.getByRole('heading', { name: 'Workspace overview' }).count() > 0
    if (!alreadyOperating) {
      const previewMilestone = page.waitForResponse((response) =>
        response.url().includes(`/api/merchant/${merchant!.id}/activation-events`)
        && response.request().method() === 'POST'
        && response.request().postData()?.includes('merchant_store_previewed') === true,
      )
      await page.locator('#store').getByRole('button', { name: 'Preview your Store' }).click()
      await previewMilestone
      await expect(page.getByText('Private draft preview', { exact: true })).toBeVisible()
    }
    if (store.status !== 'ACTIVE') {
      const publishResponse = await page.request.post(`${storePath}/publish`, { data: { storeId: store.id, approved: true } })
      await readApi<unknown>(publishResponse, 200, 'Explicitly publish the Local-only QA Store')
    }
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchant!.id)}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Workspace overview' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Live activity' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Shopper outcomes' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Current work' })).toBeVisible()

    const initialPulse = await page.request.get(`/api/merchant/${encodeURIComponent(merchant!.id)}/live-pulse`)
      .then((response) => readApi<{ activeShoppers: number; recentWindow: { visitors: number; tryOnCompletions: number; productClicks: number }; recentActivity: unknown[] }>(response, 200, 'Read Local empty Pulse'))
    const startedEmpty = initialPulse.activeShoppers === 0
      && initialPulse.recentWindow.visitors === 0
      && initialPulse.recentWindow.tryOnCompletions === 0
      && initialPulse.recentWindow.productClicks === 0
      && initialPulse.recentActivity.length === 0
    if (startedEmpty) await expect(page.getByText('No live shopper activity right now')).toBeVisible()
    const desktopQuietMetrics = await capture(startedEmpty ? '01-home-desktop-quiet' : '01-home-desktop-existing-activity')

    const createShopperSession = async () => {
      const response = await page.request.post('/api/store/sessions', { data: { merchantSlug: 'local-qa-pilot', locale: 'en' } })
      return readApi<{ merchantSessionId: string }>(response, 200, 'Create real anonymous Local Store session')
    }
    const clickProduct = async (merchantSessionId: string, action: string) => {
      const response = await page.request.post('/api/store/sessions/intent', {
        data: {
          merchantSlug: 'local-qa-pilot',
          merchantSessionId,
          type: 'PRODUCT_CLICK',
          merchantFrameId: frame!.id,
          clientActionId: action,
        },
      })
      await readApi<unknown>(response, 200, 'Record real Local shopper product click')
    }

    const firstSession = await createShopperSession()
    await clickProduct(firstSession.merchantSessionId, `p1-m3-baseline-${Date.now()}`)
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchant!.id)}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Live activity' })).toBeVisible()
    await expect(page.getByText('Product clicked').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[aria-label="Live data status: Live"]')).toBeVisible()
    const desktopLiveMetrics = await capture('02-home-desktop-live')

    const pulseRequestsBefore = await page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/live-pulse')).length)
    const secondSession = await createShopperSession()
    await clickProduct(secondSession.merchantSessionId, `p1-m3-arrival-${Date.now()}`)
    await expect(page.getByText('Product clicked').first()).toBeVisible({ timeout: 25_000 })
    await expect(page.getByText('just now', { exact: true }).first()).toBeVisible({ timeout: 25_000 })
    const activityMoment = await capture('04-home-desktop-activity-moment')
    const activityMomentPosition = await page.locator('[aria-live="polite"]').evaluate((element) => getComputedStyle(element).position)
    expect(activityMomentPosition, 'New Activity Moment stays out of normal layout flow').toBe('absolute')
    const pulseRequestsAfter = await page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/live-pulse')).length)
    expect(pulseRequestsAfter).toBeGreaterThan(pulseRequestsBefore)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchant!.id)}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Live activity' })).toBeVisible()
    await expect(page.getByText('Product clicked').first()).toBeVisible({ timeout: 15_000 })
    const mobileLiveMetrics = await capture('03-home-mobile-live')
    console.log(JSON.stringify({ startedEmpty, desktopQuietMetrics, desktopLiveMetrics, activityMoment, activityMomentPosition, mobileLiveMetrics, activityUpdatedWithoutReload: pulseRequestsAfter > pulseRequestsBefore }))
    for (const metrics of [desktopQuietMetrics, desktopLiveMetrics, activityMoment, mobileLiveMetrics]) expect(metrics.horizontalOverflow).toBe(false)
    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
  })
})
