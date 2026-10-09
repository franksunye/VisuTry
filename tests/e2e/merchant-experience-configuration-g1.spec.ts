import { expect, test, type APIResponse, type Page } from '@playwright/test'

const isIsolatedLocalRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.MERCHANT_EXPERIENCE_CONFIGURATION_G1_E2E === '1'
  && isLoopbackBaseUrl(process.env.PLAYWRIGHT_BASE_URL || '')

function isLoopbackBaseUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:'
      && ['127.0.0.1', 'localhost', '::1'].includes(url.hostname.replace(/^\[|\]$/g, ''))
      && Number(url.port) >= 3000
      && Number(url.port) <= 3999
      && url.pathname === '/'
      && !url.search && !url.hash
  } catch {
    return false
  }
}

type Envelope<T> = { success?: boolean; data?: T; message?: string; error?: string }

async function readData<T>(response: APIResponse, expectedStatus = 200): Promise<T> {
  const body = await response.json() as Envelope<T>
  expect(response.status(), body.message || body.error || 'Unexpected Local API response').toBe(expectedStatus)
  expect(body.success).toBe(true)
  return body.data as T
}

const policies = [
  { name: 'Face + recommendations', fit: false, tryOn: false, compare: false, stages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
  { name: 'Fit + recommendations', fit: true, tryOn: false, compare: false, stages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'] },
  { name: 'Try-On without Fit', fit: false, tryOn: true, compare: false, stages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] },
  { name: 'Try-On with Fit', fit: true, tryOn: true, compare: false, stages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON'] },
  { name: 'Compare without Fit', fit: false, tryOn: true, compare: true, stages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'] },
  { name: 'Full Journey', fit: true, tryOn: true, compare: true, stages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'] },
] as const

const runtimeLabels: Record<string, string> = {
  FACE_ANALYSIS: 'Upload your photo',
  FIT_PROFILE: 'Your fit profile',
  RECOMMENDATION: 'Choose frames',
  TRY_ON: 'Start Try-On',
  COMPARE: 'Side-by-side compare',
}

test.describe('G1 Merchant Experience Configuration', () => {
  test('persists all six legal policies for Store and Campaign and renders the effective guest steps', async ({ page, browser }) => {
    test.skip(!isIsolatedLocalRun, 'Run only against a disposable, marked Local PostgreSQL database and loopback Next server.')
    test.setTimeout(240_000)

    const browserErrors: string[] = []
    const serverErrors: string[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
    page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`) })

    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page.getByRole('region', { name: 'Local QA' })).toBeVisible()
    const csrf = await (await page.request.get('/api/auth/csrf')).json() as { csrfToken: string }
    const login = await page.request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'test@example.com', qaIdentity: 'existing', type: 'free', csrfToken: csrf.csrfToken, callbackUrl: '/en/merchant', json: 'true' },
    })
    expect(login.ok()).toBe(true)
    await page.context().addCookies(await page.request.storageState().then((state) => state.cookies))
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })

    const merchants = await page.locator('#merchant-switcher option').evaluateAll((options) => options.map((option) => ({
      id: (option as HTMLOptionElement).value,
      name: option.textContent?.trim() ?? '',
    })))
    const merchant = merchants.find((item) => item.name === 'Local QA-USAGE')
    expect(merchant, 'The seeded Growth TEST Merchant is available to the Local test identity').toBeTruthy()
    const merchantId = merchant!.id
    let catalog = await readData<{ items: Array<{ id: string; name: string }> }>(
      await page.request.get(`/api/merchant/${encodeURIComponent(merchantId)}/catalog?readiness=READY&limit=20`),
    )
    if (catalog.items.length === 0) {
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL!
      await readData(await page.request.post(`/api/merchant/${encodeURIComponent(merchantId)}/catalog`, {
        data: {
          approved: true,
          frames: [{
            sku: `G1-EXPERIENCE-${Date.now()}`,
            name: 'G1 Local Experience Frame',
            brand: 'Local QA',
            imageUrl: `${baseUrl}/assets/glasses-presets/large-round-classic.jpg`,
            productUrl: `${baseUrl}/local/g1-experience-frame`,
            price: 12900,
            currency: 'USD',
            shape: 'round',
            source: 'MANUAL',
            enrichmentStatus: 'NOT_REQUIRED',
          }],
        },
      }))
      catalog = await readData(await page.request.get(`/api/merchant/${encodeURIComponent(merchantId)}/catalog?readiness=READY&limit=20`))
    }
    const frame = catalog.items[0]
    expect(frame, 'A ready TEST Catalog frame is available').toBeTruthy()

    const storeEndpoint = `/api/merchant/${encodeURIComponent(merchantId)}/store`
    let storeData = await readData<{ store: { id: string; status: string; publicPath: string } | null }>(await page.request.get(storeEndpoint))
    if (!storeData.store) {
      storeData.store = await readData<{ id: string; status: string; publicPath: string }>(await page.request.post(storeEndpoint, { data: { name: 'G1 Local Experience Store' } }), 200)
    }
    const storeId = storeData.store!.id
    await readData(await page.request.put(storeEndpoint, { data: { storeId, frameIds: [frame.id] } }))
    if (storeData.store!.status !== 'ACTIVE') {
      await readData(await page.request.post(`${storeEndpoint}/preview`, { data: { storeId } }))
      await readData(await page.request.post(`${storeEndpoint}/publish`, { data: { storeId, approved: true } }))
    }
    storeData = await readData(await page.request.get(storeEndpoint))

    const campaignName = `G1 Local Experience ${Date.now()}`
    const createdCampaign = await readData<{ id: string }>(await page.request.post(`/api/merchant/${encodeURIComponent(merchantId)}/campaigns`, {
      data: { name: campaignName, headline: 'A considered frame edit', objective: 'TRAFFIC', gate: 'NONE', presentationMode: 'PRODUCT_FIRST' },
    }), 201)
    const campaignEndpoint = `/api/merchant/${encodeURIComponent(merchantId)}/campaigns/${encodeURIComponent(createdCampaign.id)}`
    await readData(await page.request.put(`${campaignEndpoint}/products`, { data: { frameIds: [frame.id] } }))
    await readData(await page.request.post(`${campaignEndpoint}/publish`, { data: { approved: true } }))
    let campaignData = await readData<{ id: string; status: string; publicPath: string }>(await page.request.get(campaignEndpoint))
    expect(campaignData.status).toBe('ACTIVE')

    const setPolicyFromUi = async (type: 'STORE' | 'CAMPAIGN', policy: typeof policies[number]) => {
      const route = type === 'STORE'
        ? `/en/merchant/store?merchantId=${encodeURIComponent(merchantId)}`
        : `/en/merchant/campaigns/${encodeURIComponent(createdCampaign.id)}?merchantId=${encodeURIComponent(merchantId)}`
      await page.goto(route, { waitUntil: 'networkidle' })
      if (type === 'STORE') {
        const section = page.locator('details').filter({ has: page.getByText('Shopper experience', { exact: true }) })
        if (!await section.evaluate((element) => (element as HTMLDetailsElement).open)) await section.locator('summary').click()
      }
      await page.getByRole('checkbox', { name: 'Fit profile' }).setChecked(policy.fit)
      await page.getByRole('checkbox', { name: 'Virtual Try-On' }).setChecked(policy.tryOn)
      await page.getByRole('checkbox', { name: 'Compare frames' }).setChecked(policy.compare)

      if (type === 'STORE') {
        await page.getByRole('button', { name: 'Save experience settings' }).click()
        await expect(page.getByRole('alertdialog')).toContainText('visible immediately')
        await page.getByRole('alertdialog').getByRole('button', { name: 'Apply to live Store' }).click()
        await expect(page.getByText('Experience settings saved. Changes are now visible to shoppers.', { exact: true })).toBeVisible()
        const saved = await readData<{ store: { id: string; status: string; journeyPolicy: { enabledStages: string[] }; effectiveJourneyPolicy: { enabledStages: string[] }; publicPath: string } }>(await page.request.get(storeEndpoint))
        expect(saved.store.journeyPolicy.enabledStages, `${type}: ${policy.name} is persisted`).toEqual(policy.stages)
        storeData = saved
        return saved.store
      }

      await page.getByRole('button', { name: 'Save campaign details' }).click()
      await expect(page.getByRole('alertdialog')).toContainText('visible immediately')
      await page.getByRole('alertdialog').getByRole('button', { name: 'Apply to live Campaign' }).click()
      await expect(page.getByText('Campaign details saved. These changes are now visible in your live Campaign.', { exact: true })).toBeVisible()
      const saved = await readData<{ journeyPolicy: { enabledStages: string[] }; effectiveJourneyPolicy: { enabledStages: string[] }; publicPath: string }>(await page.request.get(campaignEndpoint))
      expect(saved.journeyPolicy.enabledStages, `${type}: ${policy.name} is persisted`).toEqual(policy.stages)
      campaignData = { ...campaignData, ...saved }
      return saved
    }

    const inspectGuestSteps = async (type: 'STORE' | 'CAMPAIGN', publicPath: string, effectiveStages: string[]) => {
      const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const guest = await guestContext.newPage()
      guest.on('pageerror', (error) => browserErrors.push(error.message))
      guest.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`) })
      await guest.goto(publicPath, { waitUntil: 'networkidle' })
      expect(guest.url(), `${type} public route is live`).toContain('/en/')
      const tryOnCta = guest.getByRole('button', { name: 'Try on your photo' })
      await expect(tryOnCta).toBeEnabled()
      await tryOnCta.click()
      await guest.getByRole('button', { name: 'I understand — continue' }).click()
      await expect(guest.getByRole('heading', { name: 'Upload your photo' })).toBeVisible()
      const progress = guest.getByRole('region', { name: 'Shopper journey progress' })
      await expect(progress).toBeVisible()
      for (const stage of ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON', 'COMPARE']) {
        const label = runtimeLabels[stage]
        if (effectiveStages.includes(stage)) await expect(progress.getByText(label, { exact: true }), `${type} exposes ${stage}`).toBeVisible()
        else await expect(progress.getByText(label, { exact: true }), `${type} omits disabled ${stage}`).toHaveCount(0)
      }
      expect(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${type} 390px guest view has no horizontal overflow`).toBe(true)
      await guestContext.close()
    }

    for (const policy of policies) {
      const store = await setPolicyFromUi('STORE', policy)
      await inspectGuestSteps('STORE', store.publicPath, store.effectiveJourneyPolicy.enabledStages)
      const campaign = await setPolicyFromUi('CAMPAIGN', policy)
      await inspectGuestSteps('CAMPAIGN', campaign.publicPath, campaign.effectiveJourneyPolicy.enabledStages)
    }

    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
  })
})
