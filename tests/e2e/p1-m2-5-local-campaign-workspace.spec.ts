import { expect, test, type APIResponse } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const isLocalCampaignRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_M2_5_LOCAL_CAMPAIGN_E2E === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

type ApiEnvelope<T> = { success?: boolean; data?: T; error?: string; message?: string }

async function readApi<T>(response: APIResponse, expectedStatus: number, action: string): Promise<T> {
  const body = await response.json() as ApiEnvelope<T>
  expect(response.status(), `${action}: ${body.message || body.error || 'unexpected response'}`).toBe(expectedStatus)
  expect(body.success, action).toBe(true)
  return body.data as T
}

test.describe('P1-M2.5 Local Campaign workspace', () => {
  test('runs real Local draft, preview, entitlement, publish, live edit and archive journeys', async ({ page }) => {
    test.skip(!isLocalCampaignRun, 'Run npm run merchant:local:campaign:e2e against the guarded Local PostgreSQL environment.')

    const browserErrors: string[] = []
    const serverErrors: Array<{ status: number; url: string }> = []
    const clientErrorResponses: Array<{ status: number; url: string }> = []
    const networkConsoleErrors: string[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') {
        if (message.text().startsWith('Failed to load resource:')) networkConsoleErrors.push(message.text())
        else browserErrors.push(message.text())
      }
    })
    page.on('response', (response) => {
      if (response.status() >= 500) serverErrors.push({ status: response.status(), url: response.url() })
      else if (response.status() >= 400) clientErrorResponses.push({ status: response.status(), url: response.url() })
    })

    const evidenceDir = '/tmp/visutry-p1-m2-5-campaign-workspace'
    mkdirSync(evidenceDir, { recursive: true })
    const runId = Date.now().toString(36)
    const screenshots: string[] = []
    const screenshotMetrics: Array<{ screenshot: string; viewport: { width: number; height: number }; pageHeight: number; headerHeight: number | null; horizontalOverflow: boolean; documentWidth: number }> = []
    const journeyClicks = { homeToCampaignList: 0, createToPrivatePreview: 0 }
    const capture = async (name: string, fullPage = false) => {
      const path = `${evidenceDir}/${name}.png`
      await page.screenshot({ path, fullPage })
      screenshots.push(path)
      screenshotMetrics.push({
        screenshot: name,
        ...(await page.evaluate(() => ({
          viewport: { width: window.innerWidth, height: window.innerHeight },
          pageHeight: document.documentElement.scrollHeight,
          headerHeight: document.querySelector('header')?.getBoundingClientRect().height ?? null,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
        }))),
      })
    }
    const prepareMerchant = async (merchantId: string, merchantSlug: string) => {
      const catalogEndpoint = `/api/merchant/${encodeURIComponent(merchantId)}/catalog`
      const sku = `LOCAL-M2-5-${merchantSlug.toUpperCase()}-${runId}`
      const lookupResponse = await page.request.get(`${catalogEndpoint}?readiness=all&limit=100&search=${encodeURIComponent(sku)}`)
      const lookup = await readApi<{ items: Array<{ id: string; name: string; sku: string | null }>; nextCursor: string | null }>(lookupResponse, 200, 'Read Local QA Catalog fixture')
      let frame = lookup.items.find((item) => item.sku === sku)
      if (!frame) {
        const importResponse = await page.request.post(catalogEndpoint, {
          data: {
            approved: true,
            frames: [{
              sku,
              name: `Local Campaign Frame ${merchantSlug}`,
              brand: 'Local QA',
              imageUrl: 'http://127.0.0.1:3001/assets/glasses-presets/large-round-classic.jpg',
              productUrl: `http://127.0.0.1:3001/local/campaign-product/${merchantSlug}`,
              price: 12900,
              currency: 'USD',
              shape: 'round',
              source: 'MANUAL',
              enrichmentStatus: 'NOT_REQUIRED',
            }],
          },
        })
        await readApi<unknown>(importResponse, 200, 'Create Local Campaign Catalog fixture')
        const refreshedResponse = await page.request.get(`${catalogEndpoint}?readiness=READY&limit=100&search=${encodeURIComponent(sku)}`)
        const refreshed = await readApi<{ items: Array<{ id: string; name: string; sku: string | null }> }>(refreshedResponse, 200, 'Verify ready Local Campaign product')
        frame = refreshed.items.find((item) => item.sku === sku)
      }
      expect(frame, `A ready Local Catalog product exists for ${merchantSlug}`).toBeTruthy()

      const storeEndpoint = `/api/merchant/${encodeURIComponent(merchantId)}/store`
      const storeResponse = await page.request.get(storeEndpoint)
      const storeData = await readApi<{ store: { id: string; status: string } | null }>(storeResponse, 200, 'Read Local TEST Store')
      let store = storeData.store
      if (!store) {
        const createResponse = await page.request.post(storeEndpoint, { data: { name: `Local Campaign Store ${merchantSlug}` } })
        store = await readApi<{ id: string; status: string }>(createResponse, 200, 'Create Local private Store draft')
      }
      expect(store.status).toBe('DRAFT')
      const selectionResponse = await page.request.put(storeEndpoint, { data: { storeId: store.id, frameIds: [frame!.id] } })
      await readApi<unknown>(selectionResponse, 200, 'Select product in Local private Store')
      return { productName: frame!.name, sku }
    }
    const completePrivateStorePreview = async (merchantId: string) => {
      await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchantId)}`, { waitUntil: 'networkidle' })
      const milestone = page.waitForResponse((response) => response.url().includes(`/api/merchant/${merchantId}/activation-events`)
        && response.request().method() === 'POST'
        && response.request().postData()?.includes('merchant_store_previewed') === true)
      await page.locator('#store').getByRole('button', { name: 'Preview your Store' }).first().click()
      await milestone
      await expect(page.getByText('Private draft preview', { exact: true })).toBeVisible()
    }
    const signIn = async (email: string, qaIdentity: 'clean' | 'existing') => {
      await page.context().clearCookies()
      const csrfResponse = await page.request.get('/api/auth/csrf')
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
      const callbackResponse = await page.request.post('/api/auth/callback/mock-credentials', {
        form: { email, qaIdentity, type: 'free', csrfToken, callbackUrl: '/en/merchant', json: 'true' },
      })
      expect(callbackResponse.ok(), 'Local mock Credentials authentication succeeds').toBeTruthy()
      await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    }

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page.getByRole('region', { name: 'Local QA' })).toBeVisible()
    await signIn('clean@local.test', 'clean')
    await expect(page.getByRole('heading', { name: 'Set up VisuTry for your business' })).toBeVisible()
    const localMerchantName = `M2.5 Local QA ${runId}`
    await page.getByLabel(/business, brand, or store name/i).fill(localMerchantName)
    await page.getByRole('button', { name: /create merchant workspace/i }).click()
    await expect(page.getByRole('status')).toContainText('Workspace created')
    await expect(page.locator('#merchant-switcher')).toBeVisible()
    const merchantOptions = await page.locator('#merchant-switcher option').evaluateAll((options) => options.map((option) => ({ id: (option as HTMLOptionElement).value, name: option.textContent?.trim() ?? '' })))
    const freeMerchant = merchantOptions.find((merchant) => merchant.name === localMerchantName)
    expect(freeMerchant, 'The newly created Local QA Merchant is selected').toBeTruthy()

    const freeFixture = await prepareMerchant(freeMerchant!.id, `m2-5-free-${runId}`)
    await completePrivateStorePreview(freeMerchant!.id)

    await signIn('test@example.com', 'existing')
    const existingMerchantOptions = await page.locator('#merchant-switcher option').evaluateAll((options) => options.map((option) => ({ id: (option as HTMLOptionElement).value, name: option.textContent?.trim() ?? '' })))
    const growthMerchant = existingMerchantOptions.find((merchant) => merchant.name === 'Local QA-USAGE')
    expect(growthMerchant, 'The seeded Local QA-USAGE TEST Merchant is present').toBeTruthy()
    const growthFixture = await prepareMerchant(growthMerchant!.id, 'local-qa-usage')
    await completePrivateStorePreview(growthMerchant!.id)
    const growthRoute = `/en/merchant/campaigns?merchantId=${encodeURIComponent(growthMerchant!.id)}`

    // The new FREE workspace belongs to the clean identity, so restore that
    // supported mock login before exercising its campaign entitlement.
    await signIn('clean@local.test', 'clean')
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(freeMerchant!.id)}`, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: 'Campaigns', exact: true }).first().click()
    journeyClicks.homeToCampaignList += 1
    await expect(page.getByText('No Campaigns yet')).toBeVisible()
    await capture('01-campaign-list-empty-desktop')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: `${evidenceDir}/09-campaign-list-mobile.png`, fullPage: false })
    screenshots.push(`${evidenceDir}/09-campaign-list-mobile.png`)
    await page.setViewportSize({ width: 1440, height: 900 })

    await page.getByRole('button', { name: 'Create Campaign' }).first().click()
    journeyClicks.createToPrivatePreview += 1
    const freeCampaignName = `M2.5 Local QA Draft ${runId}`
    await page.getByLabel('Campaign name *').fill(freeCampaignName)
    await page.getByLabel('Shopper-facing headline').fill('Discover frames for every day')
    await page.getByRole('button', { name: 'Create draft' }).click()
    journeyClicks.createToPrivatePreview += 1
    await expect(page.getByTestId('merchant-campaign-detail')).toBeVisible()
    await expect(page.getByText('Needs attention').first()).toBeVisible()
    await capture('02-campaign-draft-incomplete-desktop', true)

    await expect(page.getByRole('checkbox', { name: `Select ${freeFixture.productName}` })).toBeVisible()
    await page.getByRole('checkbox', { name: `Select ${freeFixture.productName}` }).check()
    journeyClicks.createToPrivatePreview += 1
    await page.getByRole('button', { name: 'Save draft' }).click()
    journeyClicks.createToPrivatePreview += 1
    await expect(page.getByText('Campaign draft saved.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Private Preview' })).toBeEnabled()
    await capture('03-campaign-draft-ready-desktop', true)

    const draftCampaignId = page.url().match(/\/campaigns\/([^?]+)/)?.[1]
    expect(draftCampaignId).toBeTruthy()
    const draftCampaignResponse = await page.request.get(`/api/merchant/${encodeURIComponent(freeMerchant!.id)}/campaigns/${encodeURIComponent(draftCampaignId!)}`)
    const draftCampaign = await readApi<{ status: string; publicPath: string }>(draftCampaignResponse, 200, 'Read saved Draft Campaign')
    expect(draftCampaign.status).toBe('DRAFT')
    const draftPublicResponse = await page.request.get(draftCampaign.publicPath)
    expect(draftPublicResponse.status(), 'Draft public URL stays unavailable until public admission allows it').toBe(404)
    const draftPublicRouteStatus = draftPublicResponse.status()

    await page.getByRole('button', { name: 'Private Preview' }).click()
    journeyClicks.createToPrivatePreview += 1
    await expect(page.getByTestId('campaign-private-preview')).toBeVisible()
    await expect(page.getByText('DRAFT · not public')).toBeVisible()
    await expect(page.getByTestId('campaign-private-preview').getByText(freeFixture.productName)).toBeVisible()
    await capture('04-campaign-private-preview-desktop', true)
    await page.setViewportSize({ width: 390, height: 844 })
    await capture('10-campaign-draft-preview-mobile', true)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'Close Preview' }).click()
    await page.getByRole('checkbox', { name: 'I approve publishing this Campaign publicly.' }).scrollIntoViewIfNeeded()
    await capture('05-campaign-publish-approval-desktop', true)
    await page.getByRole('checkbox', { name: 'I approve publishing this Campaign publicly.' }).check()
    const freePublishResponse = page.waitForResponse((response) => response.url().includes('/publish') && response.status() === 409)
    await page.getByRole('button', { name: 'Publish Campaign' }).click()
    const limitResponse = await freePublishResponse
    expect(await limitResponse.json()).toMatchObject({ success: false, error: 'CAMPAIGN_LIMIT_REACHED' })
    await expect(page.locator('[data-testid="merchant-campaign-detail"] [role="alert"]')).toContainText('up to 0 active Campaigns')
    await expect(page.getByRole('link', { name: 'Review Plan & Usage' })).toBeVisible()
    await capture('06-campaign-plan-limit-desktop', true)

    // Growth is a separate seeded TEST Merchant owned by the existing identity.
    await signIn('test@example.com', 'existing')
    await page.goto(growthRoute, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Create Campaign' }).first().click()
    const liveCampaignName = `M2.5 Local QA Live ${runId}`
    await page.getByLabel('Campaign name *').fill(liveCampaignName)
    await page.getByLabel('Shopper-facing headline').fill('A considered frame collection')
    await page.getByRole('button', { name: 'Create draft' }).click()
    await expect(page.getByTestId('merchant-campaign-detail')).toBeVisible()
    await page.getByRole('checkbox', { name: `Select ${growthFixture.productName}` }).check()
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Campaign draft saved.')).toBeVisible()
    await page.getByRole('checkbox', { name: 'I approve publishing this Campaign publicly.' }).check()
    await capture('07-campaign-publish-approved-desktop', true)
    await page.getByRole('button', { name: 'Publish Campaign' }).click()
    await expect(page.getByText('Campaign is live. Its public link is ready to share.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View live Campaign' }).first()).toBeVisible()
    const campaignIdMatch = page.url().match(/\/campaigns\/([^?]+)/)
    expect(campaignIdMatch).toBeTruthy()
    const campaignResponse = await page.request.get(`/api/merchant/${encodeURIComponent(growthMerchant!.id)}/campaigns/${encodeURIComponent(campaignIdMatch![1])}`)
    const liveCampaign = await readApi<{ status: string; publicPath: string }>(campaignResponse, 200, 'Read canonical Live Campaign')
    expect(liveCampaign.status).toBe('ACTIVE')
    const publicResponse = await page.request.get(liveCampaign.publicPath)
    expect(publicResponse.status()).toBe(200)
    await capture('08-campaign-live-desktop', true)

    await page.setViewportSize({ width: 390, height: 844 })
    await capture('11-campaign-live-detail-mobile', true)
    await page.getByLabel('Shopper-facing headline').fill('Updated for shoppers immediately')
    await expect(page.getByText('Saving changes updates the live Campaign visible to shoppers.')).toBeVisible()
    await capture('12-campaign-live-edit-mobile', true)
    await page.getByRole('button', { name: 'Save live changes' }).click()
    await expect(page.getByText('Saved. These changes are now visible in your live Campaign.')).toBeVisible()
    const updatedPublic = await page.request.get(liveCampaign.publicPath)
    expect(updatedPublic.status()).toBe(200)
    expect(await updatedPublic.text()).toContain('Updated for shoppers immediately')

    await page.setViewportSize({ width: 1440, height: 900 })
    await capture('13-campaign-live-edit-desktop', true)
    await page.getByRole('button', { name: 'Archive Campaign' }).first().click()
    await expect(page.getByRole('alertdialog')).toContainText('Existing public links may remain accessible')
    await capture('14-campaign-archive-confirmation-desktop')
    await page.getByRole('alertdialog').getByRole('button', { name: 'Archive Campaign' }).click()
    await expect(page.getByText('Campaign archived. Existing public links may remain accessible under the archive policy.')).toBeVisible()
    await expect(page.getByText('This Campaign is archived and is read-only here.')).toBeVisible()
    await capture('15-campaign-archived-detail-desktop', true)
    await page.setViewportSize({ width: 390, height: 844 })
    await capture('16-campaign-archived-detail-mobile', true)

    const finalMetrics = screenshotMetrics[screenshotMetrics.length - 1]
    writeFileSync(`${evidenceDir}/README.md`, [
      '# P1-M2.5 Local Campaign workspace screenshots',
      '',
      `Local browser evidence captured ${new Date().toISOString()} against TEST Merchants only.`,
      'All writes were made through the authenticated local application APIs and browser UI; Store setup stopped at private Preview.',
      `Draft public URL before publish: HTTP ${draftPublicRouteStatus}.`,
      '',
      'Desktop: 1440×900. Mobile: 390×844. Browser zoom: 100%.',
      '',
      ...screenshots.map((path) => `- ${path}`),
      '',
      `Per-screenshot viewport metrics: ${JSON.stringify(screenshotMetrics)}`,
      `Browser errors: ${JSON.stringify(browserErrors)}`,
      `HTTP 5xx: ${JSON.stringify(serverErrors)}`,
      `HTTP 4xx: ${JSON.stringify(clientErrorResponses)}`,
      `Generic resource console errors: ${JSON.stringify(networkConsoleErrors)}`,
      `Home → Campaign list click count: ${journeyClicks.homeToCampaignList}`,
      `Create form → private Preview click count: ${journeyClicks.createToPrivatePreview}`,
    ].join('\n'))
    console.log(JSON.stringify({ finalMetrics, screenshotMetrics, draftPublicRouteStatus, journeyClicks, screenshots, browserErrors, serverErrors }))
    expect(screenshotMetrics.every((metrics) => !metrics.horizontalOverflow)).toBe(true)
    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
    expect(clientErrorResponses).toEqual([{ status: 409, url: expect.stringContaining('/publish') }])
    expect(networkConsoleErrors).toHaveLength(1)
  })
})
