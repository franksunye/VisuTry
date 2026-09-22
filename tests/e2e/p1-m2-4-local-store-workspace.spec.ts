import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const isLocalStoreRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_M2_4_LOCAL_STORE_E2E === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

test.describe('P1-M2.4 Local Store workspace', () => {
  test('keeps Draft private, requires explicit Publish, and makes Live saves truthful', async ({ page, request, context }) => {
    test.skip(!isLocalStoreRun, 'Run npm run merchant:local:store:e2e against the isolated Local QA database.')

    const browserErrors: string[] = []
    const serverErrors: Array<{ status: number; url: string }> = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
    page.on('response', (response) => { if (response.status() >= 500) serverErrors.push({ status: response.status(), url: response.url() }) })
    const evidenceDir = '/tmp/visutry-p1-m2-4-store-workspace'
    mkdirSync(evidenceDir, { recursive: true })
    await page.setViewportSize({ width: 1440, height: 900 })

    // Reuse the TEST Merchant created by the Local First Value E2E; do not
    // provision another Merchant just to exercise the operating lifecycle.
    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page.getByRole('region', { name: 'Local QA' })).toBeVisible()
    const csrfResponse = await request.get('/api/auth/csrf')
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
    const callbackResponse = await request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'clean@local.test', qaIdentity: 'clean', type: 'premium', csrfToken, callbackUrl: '/en/merchant', json: 'true' },
    })
    expect(callbackResponse.ok()).toBeTruthy()
    await context.addCookies(await request.storageState().then((state) => state.cookies))

    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Workspace overview' })).toBeVisible()
    await page.getByRole('link', { name: 'Store' }).first().click()
    await expect(page).toHaveURL(/\/en\/merchant\/store\?merchantId=/)
    await expect(page.getByTestId('merchant-operating-store')).toBeVisible()
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Preview Store' })).toBeEnabled()
    await expect(page.getByLabel('Products in Store').getByText('Local Growth Round Frame')).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/draft-desktop.png`, fullPage: false })

    const publicPath = await page.getByTestId('merchant-operating-store').getAttribute('data-public-path')
    expect(publicPath).toMatch(/^\/en\/store\//)
    const draftPublicResponse = await request.get(publicPath!)
    expect(draftPublicResponse.status()).toBe(404)

    await page.getByRole('button', { name: 'Preview Store' }).click()
    await expect(page.getByTestId('store-draft-preview')).toBeVisible()
    await expect(page.getByText('DRAFT · not public')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'I approve publishing this Store publicly' })).not.toBeChecked()
    await page.screenshot({ path: `${evidenceDir}/draft-preview-desktop.png`, fullPage: true })
    await page.screenshot({ path: `${evidenceDir}/publish-approval-desktop.png`, fullPage: true })
    await expect(page.getByRole('button', { name: 'Publish Store' })).toBeDisabled()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en/merchant/store', { waitUntil: 'networkidle' })
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/draft-mobile.png`, fullPage: false })
    await page.getByRole('button', { name: 'Preview Store' }).click()
    await expect(page.getByTestId('store-draft-preview')).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/draft-preview-mobile.png`, fullPage: true })

    await page.getByRole('checkbox', { name: 'I approve publishing this Store publicly' }).check()
    await expect(page.getByRole('button', { name: 'Publish Store' })).toBeEnabled()
    await page.getByRole('button', { name: 'Publish Store' }).click()
    await expect(page.getByText('LIVE', { exact: true })).toBeVisible()
    const liveLink = page.locator(`a[href="${publicPath}"]`).first()
    await expect(liveLink).toHaveAttribute('href', publicPath!)
    await expect(page.getByRole('button', { name: 'Publish Store' })).toHaveCount(0)
    await page.screenshot({ path: `${evidenceDir}/live-mobile.png`, fullPage: false })

    const livePublicResponse = await request.get(publicPath!)
    expect(livePublicResponse.status()).toBe(200)
    expect(await livePublicResponse.text()).toContain('Local Growth Round Frame')

    await page.getByText('Store details').click()
    await page.getByLabel(/Headline/).fill('Saved directly to the live Store')
    await expect(page.getByText(/become visible to shoppers after saving/i).first()).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/live-edit-mobile.png`, fullPage: true })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({ path: `${evidenceDir}/live-edit-desktop.png`, fullPage: true })
    await page.getByRole('button', { name: 'Save details' }).click()
    await expect(page.getByText('Saved. These changes are now visible in your live Store.')).toBeVisible()
    await expect(page.getByText('LIVE', { exact: true })).toBeVisible()
    const updatedPublicResponse = await request.get(publicPath!)
    expect(updatedPublicResponse.status()).toBe(200)
    expect(await updatedPublicResponse.text()).toContain('Saved directly to the live Store')
    await page.screenshot({ path: `${evidenceDir}/live-desktop.png`, fullPage: false })

    const metrics = await page.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      headerHeight: document.querySelector('header')?.getBoundingClientRect().height ?? null,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    }))
    console.log(JSON.stringify({ metrics, publicPath }))
    expect(metrics.horizontalOverflow).toBe(false)
    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
  })
})
