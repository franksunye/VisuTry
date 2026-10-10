import { expect, test } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const isLocalLabRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P0_L1_LOCAL_MERCHANT_E2E === '1'
  && isLoopbackLocalPort(process.env.PLAYWRIGHT_BASE_URL || '')

function isLoopbackLocalPort(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:'
      && ['127.0.0.1', 'localhost', '::1'].includes(url.hostname.replace(/^\[|\]$/g, ''))
      && Number(url.port) >= 3000 && Number(url.port) <= 3999
      && url.pathname === '/' && !url.search && !url.hash
  } catch {
    return false
  }
}
const localMerchantGoldenPathTimeoutMs = 360_000

test.describe('P0-L1 / P1-M1 Local Merchant First Value', () => {
  test('runs the real local acquisition-to-private-preview journey', async ({ page, request, context }) => {
    test.skip(!isLocalLabRun, 'Run npm run merchant:local:e2e with the Local server already running.')
    // This deliberately long, Local-only journey compiles and visits multiple
    // Merchant surfaces. Keep the larger budget scoped to this test only.
    test.setTimeout(localMerchantGoldenPathTimeoutMs)

    const journeyStartedAt = Date.now()
    let phaseStartedAt = journeyStartedAt
    let activePhase = 'auth/session establishment'
    const logPhaseStart = (phase: string) => {
      const now = Date.now()
      console.log(JSON.stringify({
        localMerchantGoldenPath: {
          event: 'phase_complete',
          phase: activePhase,
          phaseDurationMs: now - phaseStartedAt,
          elapsedMs: now - journeyStartedAt,
        },
      }))
      activePhase = phase
      phaseStartedAt = now
      console.log(JSON.stringify({
        localMerchantGoldenPath: {
          event: 'phase_start',
          phase: activePhase,
          elapsedMs: now - journeyStartedAt,
        },
      }))
    }
    const logJourneyComplete = () => {
      const now = Date.now()
      console.log(JSON.stringify({
        localMerchantGoldenPath: {
          event: 'phase_complete',
          phase: activePhase,
          phaseDurationMs: now - phaseStartedAt,
          elapsedMs: now - journeyStartedAt,
        },
      }))
      console.log(JSON.stringify({
        localMerchantGoldenPath: {
          event: 'journey_complete',
          elapsedMs: now - journeyStartedAt,
          timeoutMs: localMerchantGoldenPathTimeoutMs,
        },
      }))
    }
    console.log(JSON.stringify({
      localMerchantGoldenPath: {
        event: 'phase_start',
        phase: activePhase,
        elapsedMs: 0,
        timeoutMs: localMerchantGoldenPathTimeoutMs,
      },
    }))

    const browserErrors: string[] = []
    const serverErrors: number[] = []
    // Cold local route compilation can exceed Playwright's 30s navigation
    // default; keep this allowance local to this test's page instance.
    page.setDefaultNavigationTimeout(45_000)
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    page.on('response', (response) => {
      if (response.status() >= 500) serverErrors.push(response.status())
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    const responsiveEvidenceDir = '/tmp/visutry-purchase-billing-responsive'
    mkdirSync(responsiveEvidenceDir, { recursive: true })
    const assertNoHorizontalOverflow = async (surface: string) => {
      const metrics = await page.evaluate(() => ({
        route: `${location.pathname}${location.search}`,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }))
      expect(metrics.documentWidth, `${surface} must fit its ${metrics.viewportWidth}px viewport`).toBeLessThanOrEqual(metrics.viewportWidth)
      console.log(JSON.stringify({ responsiveSurface: surface, ...metrics, horizontalOverflow: false }))
    }

    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page).toHaveURL(/\/en\/auth\/signin/)
    await expect(page.getByRole('region', { name: 'Local QA' })).toBeVisible()

    // Keep the human-facing Local QA controls visible, but use the same
    // supported Credentials-provider boundary directly for this deterministic
    // browser fixture. This avoids making the test depend on client-side
    // redirect timing while still exercising the real NextAuth session.
    const csrfResponse = await request.get('/api/auth/csrf')
    expect(csrfResponse.ok()).toBeTruthy()
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
    const callbackResponse = await request.post('/api/auth/callback/mock-credentials', {
      form: {
        email: 'clean@local.test',
        qaIdentity: 'clean',
        type: 'premium',
        csrfToken,
        callbackUrl: '/en/merchant',
        json: 'true',
      },
    })
    expect(callbackResponse.ok()).toBeTruthy()
    await context.addCookies(await request.storageState().then((state) => state.cookies))
    await page.goto('/en/merchant', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/en\/merchant(?:\?|$)/)
    await expect(page.getByRole('heading', { name: /set up visutry for your business/i })).toBeVisible()
    const nameField = page.getByLabel(/business, brand, or store name/i)
    await expect(nameField).toHaveAttribute('required', '')
    logPhaseStart('merchant activation / first value')
    await page.waitForLoadState('networkidle')
    await nameField.fill('Local Growth Lab Eyewear')
    await page.getByRole('button', { name: /create merchant workspace/i }).click()
    await expect(page.locator('[data-onboarding-state="created"]')).toContainText('Workspace created')
    await expect(page.getByRole('link', { name: 'Add your first product' })).toBeVisible()

    await page.getByRole('tab', { name: 'Add manually' }).click()
    await page.getByLabel('Product name for product 1').fill('Local Growth Round Frame')
    await page.getByLabel('Product image URL for product 1').fill(`${process.env.PLAYWRIGHT_BASE_URL}/assets/glasses-presets/large-round-classic.jpg`)
    await page.getByLabel('Merchant SKU for product 1').fill('LOCAL-FRAME-001')
    await expect(page.getByRole('button', { name: 'Review product' })).toBeEnabled()
    const merchantId = await page.getByLabel('Active merchant').inputValue()
    const inspectResponsePromise = page.waitForResponse((response) => (
      response.url().includes(`/api/merchant/${encodeURIComponent(merchantId)}/catalog/inspect`)
      && response.request().method() === 'POST'
    ), { timeout: 45_000 })
    await page.getByRole('button', { name: 'Review product' }).click()
    const inspectResponse = await inspectResponsePromise
    expect(inspectResponse.status(), 'Local manual catalog inspection completes').toBe(200)
    expect((await inspectResponse.json() as { success?: boolean }).success).toBe(true)
    await expect(page.getByRole('heading', { name: '1 product is ready to add' })).toBeVisible()
    await page.getByRole('button', { name: /Approve and import 1/ }).click()
    await expect(page.getByText('Your first product is in the Catalog.', { exact: true })).toBeVisible()
    await expect(page.getByTestId('merchant-activation-checklist').getByRole('link', { name: 'Create your Store' })).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Create your Store', exact: true })).toBeVisible()
    await expect(page.locator('#catalog').getByRole('link', { name: 'Create your Store' })).toBeVisible()
    await expect(page.getByText('Add Store details (optional)')).toBeVisible({ timeout: 45_000 })
    await page.locator('#store').getByRole('button', { name: 'Create your Store' }).click()
    await expect(page.getByRole('heading', { name: 'Set up your Store' })).toBeVisible()
    await expect(page.getByText('Your Store draft is ready with your first product selected.', { exact: true })).toBeVisible()
    await expect(page.locator('#store').getByRole('button', { name: 'Preview your Store' }).first()).toBeEnabled()

    // Exercise the pre-first-value Merchant control center, including its
    // experience rows, at desktop and phone widths before the preview event
    // switches the workspace to the operating Home surface.
    await page.screenshot({ path: `${responsiveEvidenceDir}/control-center-desktop.png`, fullPage: true })
    await assertNoHorizontalOverflow('Merchant control center / desktop')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchantId)}`, { waitUntil: 'networkidle' })
    await expect(page.locator('#store')).toBeVisible()
    await page.screenshot({ path: `${responsiveEvidenceDir}/control-center-mobile.png`, fullPage: true })
    await assertNoHorizontalOverflow('Merchant control center / mobile')

    // The real Local pending return is read-only; it exercises the processing
    // notice together with Store/Catalog/experience content at the 390px target.
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchantId)}&billing=processing&plan=GROWTH`, { waitUntil: 'networkidle' })
    await expect(page.getByText('Plan update in progress')).toBeVisible()
    await page.screenshot({ path: `${responsiveEvidenceDir}/processing-pending-mobile.png`, fullPage: true })
    await assertNoHorizontalOverflow('Processing return pending / mobile')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchantId)}`, { waitUntil: 'networkidle' })
    await expect(page.locator('#store').getByRole('button', { name: 'Preview your Store' }).first()).toBeEnabled()
    await page.locator('#store').getByRole('button', { name: 'Preview your Store' }).first().click()
    await expect(page.getByTestId('store-draft-preview')).toBeVisible()
    await expect(page.getByText('Private draft preview', { exact: true })).toBeVisible()
    await expect(page.getByText('DRAFT · not public')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /confirm this store is ready/i })).not.toBeChecked()
    const activationPageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    logPhaseStart('operating workspace checks')

    // Operating-shell route QA starts only after the real First Value event.
    // Screenshots stay outside the repository so this remains evidence, not
    // a product fixture or a tracked visual baseline.
    const evidenceDir = '/tmp/visutry-p1-m2-1-operating-shell'
    mkdirSync(evidenceDir, { recursive: true })
    const catalogEvidenceDir = '/tmp/visutry-p1-m2-3-catalog'
    mkdirSync(catalogEvidenceDir, { recursive: true })
    const m26EvidenceDir = '/tmp/visutry-p1-m2-6-analytics-integrations'
    mkdirSync(m26EvidenceDir, { recursive: true })
    const m27EvidenceDir = '/tmp/visutry-p1-m2-7-mobile-navigation'
    mkdirSync(m27EvidenceDir, { recursive: true })
    const m26CaptureMetrics: Array<{ name: string; route: string; viewport: { width: number; height: number }; pageHeight: number; headerHeight: number | null; horizontalOverflow: boolean }> = []
    const captureM26 = async (name: string) => {
      await page.screenshot({ path: `${m26EvidenceDir}/${name}.png` })
      m26CaptureMetrics.push({ name, ...(await page.evaluate(() => ({
        route: `${location.pathname}${location.search}`,
        viewport: { width: innerWidth, height: innerHeight },
        pageHeight: document.documentElement.scrollHeight,
        headerHeight: document.querySelector('header')?.getBoundingClientRect().height ?? null,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      }))) })
    }
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    await page.screenshot({ path: `${evidenceDir}/home-desktop.png`, fullPage: true })
    await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible()
    const catalogLink = page.getByRole('link', { name: 'Catalog' }).first()
    const storeLink = page.getByRole('link', { name: 'Store' }).first()
    const analyticsLink = page.getByRole('link', { name: 'Analytics' }).first()
    await expect(catalogLink).toHaveAttribute('href', /\/en\/merchant\/catalog\?merchantId=/)
    await expect(storeLink).toHaveAttribute('href', /\/en\/merchant\/store\?merchantId=/)
    await expect(analyticsLink).toHaveAttribute('href', /\/en\/merchant\/analytics\?merchantId=/)
    await Promise.all([
      page.waitForURL(/\/en\/merchant\/catalog\?merchantId=/, { timeout: 45_000 }),
      catalogLink.click(),
    ])
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    await Promise.all([
      page.waitForURL(/\/en\/merchant\/store\?merchantId=/, { timeout: 45_000 }),
      storeLink.click(),
    ])
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    await Promise.all([
      page.waitForURL(/\/en\/merchant\/analytics\?merchantId=/, { timeout: 45_000 }),
      analyticsLink.click(),
    ])
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No shopper activity yet' })).toBeVisible()
    const m26MerchantId = await page.getByLabel('Active merchant').inputValue()
    await captureM26('01-analytics-empty-desktop')

    await page.goto(`/en/merchant/integrations?merchantId=${encodeURIComponent(m26MerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible()
    await expect(page.getByText('No active key')).toBeVisible()
    await expect(page.getByText('No keys have been created for this workspace.')).toBeVisible()
    await captureM26('03-integrations-empty-desktop')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/en/merchant/analytics?merchantId=${encodeURIComponent(m26MerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'No shopper activity yet' })).toBeVisible()
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const mobileNavigation = page.getByRole('dialog', { name: 'Merchant navigation' })
    await expect(mobileNavigation).toBeVisible()
    const primaryNavigation = mobileNavigation.getByRole('navigation', { name: 'Merchant primary navigation' })
    const activeAnalyticsLink = primaryNavigation.getByRole('link', { name: 'Analytics', exact: true })
    await expect(activeAnalyticsLink).toHaveAttribute('aria-current', 'page')
    const analyticsNavigationMetrics = await page.evaluate(() => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')
      const nav = dialog?.querySelector<HTMLElement>('nav[aria-label="Merchant primary navigation"]')
      const active = nav?.querySelector<HTMLElement>('a[aria-current="page"]')
      if (!dialog || !nav || !active) return null
      const dialogRect = dialog.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      return {
        activeFullyVisible: activeRect.left >= dialogRect.left - 1 && activeRect.right <= dialogRect.right + 1,
        drawerWithinViewport: dialogRect.left >= 0 && dialogRect.right <= innerWidth,
        noViewportOverflow: document.documentElement.scrollWidth <= innerWidth,
      }
    })
    expect(analyticsNavigationMetrics).toEqual({
      activeFullyVisible: true,
      drawerWithinViewport: true,
      noViewportOverflow: true,
    })
    console.log(JSON.stringify({ p1m27AnalyticsNavigation: analyticsNavigationMetrics }))
    await page.screenshot({ path: `${m27EvidenceDir}/analytics-active-mobile.png`, fullPage: false })
    await captureM26('02-analytics-empty-mobile')
    const utilityNavigation = mobileNavigation.getByRole('navigation', { name: 'Merchant utility navigation' })
    await expect(utilityNavigation.getByRole('link', { name: 'Integrations' })).toBeVisible()
    await expect(utilityNavigation.getByRole('link', { name: 'Plan & Usage' })).toBeVisible()
    await expect(utilityNavigation.getByRole('link', { name: 'Settings' })).toBeVisible()
    await page.screenshot({ path: `${m27EvidenceDir}/more-open-mobile.png`, fullPage: false })
    await page.goto(`/en/merchant/integrations?merchantId=${encodeURIComponent(m26MerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page.getByText('No active key')).toBeVisible()
    await captureM26('04-integrations-empty-mobile')

    logPhaseStart('Integrations credential lifecycle')
    const createdKeyResponse = page.waitForResponse((response) => response.url().endsWith(`/api/merchant/${m26MerchantId}/agent-credentials`) && response.request().method() === 'POST')
    await page.getByRole('button', { name: 'Create Agent key' }).click()
    const createdKey = await createdKeyResponse
    expect(createdKey.status(), 'Local Agent credential creation succeeds').toBe(201)
    await expect(page.getByRole('dialog')).toBeVisible()
    const setupText = await page.getByRole('dialog').locator('pre').innerText()
    const keyMatch = /Agent Key:\s*\n([^\s]+)/u.exec(setupText)
    expect(keyMatch, 'The one-time setup prompt contains the generated Local key').toBeTruthy()
    await expect(page.getByText('This key has not been used.')).toHaveCount(0)
    await captureM26('05-integrations-one-time-key-mobile')
    await page.getByRole('button', { name: 'Close and hide key' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('Key created · not yet used')).toBeVisible()
    await expect(page.getByText(/has no recorded successful use yet/)).toBeVisible()
    await expect(page.getByText(new RegExp(keyMatch![1].replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')))).toHaveCount(0)

    const agentRead = await request.get('/api/agent/v1/merchant', { headers: { authorization: `Bearer ${keyMatch![1]}` } })
    expect(agentRead.status(), 'A real authenticated Agent read records credential use').toBe(200)
    await page.getByRole('button', { name: 'Refresh status' }).click()
    await expect(page.getByText('Successful key use recorded')).toBeVisible()
    await expect(page.getByText(/confirms key use, not a continuous connection/)).toBeVisible()

    await page.setViewportSize({ width: 1440, height: 900 })
    await captureM26('06-integrations-used-desktop')
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Revoke VisuTry Agent' }).click()
    await expect(page.getByText('“VisuTry Agent” was revoked.')).toBeVisible()
    await expect(page.getByText('No active key')).toBeVisible()
    await captureM26('07-integrations-revoked-desktop')

    logPhaseStart('remaining desktop/mobile route checks')
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    const operatingPageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    console.log(JSON.stringify({ activationPageHeight, operatingPageHeight }))
    await page.goto('/en/merchant/catalog', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/catalog-desktop.png`, fullPage: true })
    await assertNoHorizontalOverflow('Catalog / desktop')
    await page.getByRole('button', { name: 'Add products' }).click()
    await page.screenshot({ path: `${catalogEvidenceDir}/add-products-desktop.png`, fullPage: true })
    await page.getByRole('tab', { name: 'Add manually' }).click()
    await page.getByLabel('Product name for product 1').fill('Local Growth Pending Frame')
    await page.getByLabel('Product image URL for product 1').fill(`${process.env.PLAYWRIGHT_BASE_URL}/assets/glasses-presets/large-round-classic.jpg`)
    await page.getByLabel('Product page URL for product 1').fill(`${process.env.PLAYWRIGHT_BASE_URL}/local/pending-frame`)
    const pendingInspectResponsePromise = page.waitForResponse((response) => (
      response.url().includes(`/api/merchant/${encodeURIComponent(merchantId)}/catalog/inspect`)
      && response.request().method() === 'POST'
    ), { timeout: 45_000 })
    await page.getByRole('button', { name: 'Review product' }).click()
    const pendingInspectResponse = await pendingInspectResponsePromise
    expect(pendingInspectResponse.status(), 'Local pending-product inspection completes').toBe(200)
    expect((await pendingInspectResponse.json() as { success?: boolean }).success).toBe(true)
    await expect(page.getByRole('heading', { name: '1 product is ready to add' })).toBeVisible()
    await page.getByRole('button', { name: /Approve and import 1/ }).click()
    await expect(page.getByText('Catalog updated successfully.', { exact: true })).toBeVisible()
    await page.screenshot({ path: `${catalogEvidenceDir}/attention-desktop.png`, fullPage: true })
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.screenshot({ path: `${catalogEvidenceDir}/edit-desktop.png`, fullPage: true })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await page.goto('/en/merchant/store', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Store', exact: true })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/store-desktop.png`, fullPage: true })
    await assertNoHorizontalOverflow('Store / desktop')
    await page.goto('/en/merchant/campaigns', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/campaigns-desktop.png`, fullPage: true })
    await page.goto('/en/merchant/analytics', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/analytics-desktop.png`, fullPage: true })
    await page.goto('/en/merchant/integrations', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/integrations-desktop.png`, fullPage: true })
    await page.goto('/en/merchant/plan', { waitUntil: 'networkidle' })
    await expect(page.locator('main').getByText('Plan & Usage').last()).toBeVisible()
    await page.goto('/en/merchant/settings', { waitUntil: 'networkidle' })
    await expect(page.getByText('Workspace details')).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/home-mobile.png`, fullPage: true })
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const homeNavigation = page.getByRole('dialog', { name: 'Merchant navigation' })
    await expect(homeNavigation.getByRole('navigation', { name: 'Merchant primary navigation' }).getByRole('link', { name: 'Catalog' })).toBeVisible()
    await expect(homeNavigation.getByRole('navigation', { name: 'Merchant primary navigation' }).getByRole('link', { name: 'Store' })).toBeVisible()
    await expect(homeNavigation.getByRole('navigation', { name: 'Merchant primary navigation' }).getByRole('link', { name: 'Analytics' })).toBeVisible()
    await expect(homeNavigation.getByRole('navigation', { name: 'Merchant utility navigation' }).getByRole('link', { name: 'Plan & Usage' })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/utilities-mobile.png`, fullPage: false })
    const mobileMetrics = await page.evaluate(() => ({
      headerHeight: document.querySelector('header')?.getBoundingClientRect().height ?? null,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    }))
    console.log(JSON.stringify({ mobileMetrics }))
    await page.goto('/en/merchant/catalog', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/catalog-mobile.png`, fullPage: true })
    await assertNoHorizontalOverflow('Catalog / mobile')
    await page.getByRole('button', { name: 'Add products' }).click()
    await page.screenshot({ path: `${catalogEvidenceDir}/add-products-mobile.png`, fullPage: true })
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.screenshot({ path: `${catalogEvidenceDir}/edit-mobile.png`, fullPage: true })
    await page.goto('/en/merchant/store', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Store', exact: true })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/store-mobile.png`, fullPage: true })
    await assertNoHorizontalOverflow('Store / mobile')

    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
    expect(m26CaptureMetrics.every((capture) => !capture.horizontalOverflow), 'Analytics and Integrations fit their captured viewports').toBe(true)
    writeFileSync(`${m26EvidenceDir}/README.md`, [
      '# P1-M2.6 Local browser evidence',
      '',
      '- Environment: Local Next.js + repository-local PostgreSQL; TEST Merchant created by the Local Merchant Golden Path.',
      '- Screenshots use 1440×900 desktop and 390×844 mobile viewports at 100% browser zoom.',
      '- The one-time-key screenshot contains a disposable Local TEST credential secret. It is never added to GitHub or logged; revoke is performed before the test ends.',
      '- The “used” state follows a real authenticated read through `/api/agent/v1/merchant`; no `lastUsedAt` fixture was fabricated.',
      '',
      '## Capture metrics',
      '',
      '```json',
      JSON.stringify(m26CaptureMetrics, null, 2),
      '```',
      '',
      `Unexpected browser errors: ${browserErrors.length}`,
      `HTTP 5xx responses: ${serverErrors.length}`,
      '',
    ].join('\n'))
    logJourneyComplete()
  })
})
