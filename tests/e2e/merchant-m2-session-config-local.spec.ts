import { expect, test, type APIResponse } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { prisma } from '@/lib/prisma'

const isolated = process.env.APP_ENV === 'local'
  && process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.VISUTRY_MERCHANT_AI_BUDGET_MODE === 'ENFORCE'
  && process.env.VISUTRY_DATABASE_IDENTITY === 'local:127.0.0.1:5439/visutry_local_container_e2e'
  && process.env.PLAYWRIGHT_BASE_URL === 'http://127.0.0.1:3003'

async function body<T>(response: APIResponse, code = 200): Promise<T> {
  const value = await response.json() as { success: boolean; data: T; error?: string; code?: string }
  expect(response.status(), JSON.stringify(value)).toBe(code)
  expect(value.success, JSON.stringify(value)).toBe(true)
  return value.data
}

test.describe('M2 local-only Merchant settings and real shopper limits', () => {
  test('Store and Campaign save 1/2/4, reload, and enforce independent shopper sessions', async ({ page, request, context }) => {
    test.skip(!isolated, 'Requires disposable PGlite, TEST identity, and v2 ENFORCE fixture')
    test.setTimeout(300_000)
    const run = Date.now().toString(36)
    const slug = 'local-qa-usage'

    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page.getByRole('region', { name: 'Local QA' })).toBeVisible()
    const csrf = await (await request.get('/api/auth/csrf')).json() as { csrfToken: string }
    const login = await request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'test@example.com', qaIdentity: 'existing', type: 'free',
        csrfToken: csrf.csrfToken, callbackUrl: '/en/merchant', json: 'true' },
    })
    expect(login.ok()).toBe(true)
    await context.addCookies((await request.storageState()).cookies)
    await page.goto('/en/merchant', { waitUntil: 'networkidle' })
    const options = await page.locator('#merchant-switcher option').evaluateAll((nodes) =>
      nodes.map((n) => ({ id: (n as HTMLOptionElement).value, name: n.textContent?.trim() ?? '' })))
    const merchant = options.find((x) => x.name === 'Local QA-USAGE')
    expect(merchant).toBeTruthy()
    const id = merchant!.id
    const contract = await prisma.merchant.findUniqueOrThrow({
      where: { id }, select: { classification: true, pricingVersion: true, entitlementVersion: true },
    })
    expect(contract).toEqual({ classification: 'TEST', pricingVersion: 'v2-container-e2e', entitlementVersion: 'v2' })

    const catalogEndpoint = '/api/merchant/' + id + '/catalog'
    const appUrl = process.env.PLAYWRIGHT_BASE_URL!
    const inserted = await body(await request.post(catalogEndpoint, { data: {
      approved: true, frames: [1, 2, 3].map((n) => ({
        sku: 'M2-CAP-' + run + '-' + n,
        name: 'M2 local frame ' + n, brand: 'Local QA',
        imageUrl: appUrl + '/assets/glasses-presets/large-round-classic.jpg',
        productUrl: appUrl + '/local/m2-frame-' + n,
        price: 12900, currency: 'USD', shape: 'round', source: 'MANUAL',
        enrichmentStatus: 'NOT_REQUIRED',
      })),
    } }))
    expect(inserted).toBeTruthy()
    const catalog = await body<{ items: Array<{ id: string; name: string }> }>(
      await request.get(catalogEndpoint + '?readiness=READY&limit=40'))
    const frames = catalog.items.filter((f) => f.name.startsWith('M2 local frame '))
      .map((f) => f.id).slice(0, 3)
    expect(frames).toHaveLength(3)

    const storeApi = '/api/merchant/' + id + '/store'
    let store = await body<{ store: { id: string; status: string; publicPath: string; sessionTryOnLimit: number } | null }>(
      await request.get(storeApi))
    if (!store.store) {
      await body(await request.post(storeApi, { data: { name: 'M2 Local TEST Store' } }))
      store = await body(await request.get(storeApi))
    }
    expect(store.store).toBeTruthy()
    const storeId = store.store!.id
    await body(await request.put(storeApi, { data: { storeId, frameIds: frames } }))
    if (store.store!.status !== 'ACTIVE') {
      await body(await request.post(storeApi + '/preview', { data: { storeId } }))
      await body(await request.post(storeApi + '/publish', { data: { storeId, approved: true } }))
    }

    const campaign = await body<{ id: string }>(await request.post('/api/merchant/' + id + '/campaigns', {
      data: { name: 'M2 Local Campaign ' + run, headline: 'Test bounded virtual try-on',
        objective: 'TRAFFIC', gate: 'NONE', presentationMode: 'PRODUCT_FIRST' },
    }), 201)
    const campaignApi = '/api/merchant/' + id + '/campaigns/' + campaign.id
    await body(await request.put(campaignApi + '/products', { data: { frameIds: frames } }))
    await body(await request.post(campaignApi + '/publish', { data: { approved: true } }))

    async function storeChooser() {
      await page.goto('/en/merchant/store?merchantId=' + id, { waitUntil: 'networkidle' })
      const section = page.locator('details').filter({ has: page.getByText('Shopper experience', { exact: true }) })
      if (!await section.evaluate((el) => (el as HTMLDetailsElement).open)) await section.locator('summary').click()
      const select = page.getByRole('combobox', { name: 'Try-Ons per shopper session' })
      await expect(select).toBeVisible()
      return select
    }
    for (const limit of [4, 2, 1]) {
      const select = await storeChooser()
      await select.selectOption(String(limit))
      await page.getByRole('button', { name: 'Save experience settings' }).click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Apply to live Store' }).click()
      await expect(page.getByText('Experience settings saved. Changes are now visible to shoppers.', { exact: true })).toBeVisible()
      const persisted = await body<{ store: { sessionTryOnLimit: number } }>(await request.get(storeApi))
      expect(persisted.store.sessionTryOnLimit).toBe(limit)
      await expect(await storeChooser()).toHaveValue(String(limit))
    }

    async function campaignChooser() {
      await page.goto('/en/merchant/campaigns/' + campaign.id + '?merchantId=' + id, { waitUntil: 'networkidle' })
      const select = page.getByRole('combobox', { name: 'Try-Ons per shopper session' })
      await expect(select).toBeVisible()
      return select
    }
    for (const limit of [1, 4, 2]) {
      const select = await campaignChooser()
      await select.selectOption(String(limit))
      await page.getByRole('button', { name: 'Save campaign details' }).click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Apply to live Campaign' }).click()
      await expect(page.getByText('Campaign details saved. These changes are now visible in your live Campaign.', { exact: true })).toBeVisible()
      const persisted = await body<{ sessionTryOnLimit: number }>(await request.get(campaignApi))
      expect(persisted.sessionTryOnLimit).toBe(limit)
      await expect(await campaignChooser()).toHaveValue(String(limit))
    }
    // Store is limited to one; Campaign can still independently use two.
    async function shopper(experienceSlug?: string) {
      const created = await body<{ merchantSessionId: string }>(await request.post('/api/store/sessions', {
        data: { merchantSlug: slug, ...(experienceSlug ? { experienceSlug } : {}),
          locale: 'en', deviceType: 'desktop' },
      }))
      const session = created.merchantSessionId
      await body(await request.post('/api/store/sessions/photo', { multipart: {
        merchantSlug: slug, merchantSessionId: session, locale: 'en', deviceType: 'desktop',
        photo: { name: 'm2-local-shopper.jpg', mimeType: 'image/jpeg',
          buffer: readFileSync('public/home/Sophia-try-on-glasses-screen.jpg') },
      } }))
      const reco = await body<{ frames: Array<{ id: string }> }>(await request.post('/api/store/sessions/recommend', {
        data: { merchantSlug: slug, merchantSessionId: session,
          measuredShape: 'oval', faceAspectRatio: 1.2,
          geometryAnalysis: { status: 'measured', measuredShape: 'oval', measuredConfidence: 0.9, qualityScore: 90 },
          locale: 'en', deviceType: 'desktop', clientActionId: 'm2-rec-' + run + '-' + (experienceSlug ?? 'store') },
      }))
      const choices = reco.frames.slice(0, 3).map((f) => f.id)
      expect(choices).toHaveLength(3)
      await body(await request.post('/api/store/sessions/select-frames', {
        data: { merchantSlug: slug, merchantSessionId: session, frameIds: choices.slice(0, 2),
          clientActionId: 'm2-select-' + run + '-' + (experienceSlug ?? 'store'),
          locale: 'en', deviceType: 'desktop' },
      }))
      return { session, choices }
    }
    async function generate(session: string, frameId: string, key: string) {
      return request.post('/api/store/sessions/try-on', {
        data: { merchantSlug: slug, merchantSessionId: session, merchantFrameId: frameId,
          batchId: 'm2-batch-' + run, clientSubmissionId: key, locale: 'en', deviceType: 'desktop' },
      })
    }
    async function completed(session: string, frameId: string, key: string) {
      const response = await generate(session, frameId, key)
      const accepted = await body<{ taskId: string }>(response)
      const poll = await body<{ status: string }>(await request.post('/api/store/sessions/try-on/poll', {
        data: { merchantSlug: slug, merchantSessionId: session, taskId: accepted.taskId,
          locale: 'en', deviceType: 'desktop' },
      }))
      expect(poll.status.toUpperCase()).toBe('COMPLETED')
    }
    const storeShopper = await shopper()
    await completed(storeShopper.session, storeShopper.choices[0]!, 'm2-store-a-' + run)
    const storeDenied = await generate(storeShopper.session, storeShopper.choices[1]!, 'm2-store-b-' + run)
    expect(storeDenied.status(), await storeDenied.text()).toBe(429)
    expect((await storeDenied.json()).code).toBe('AI_SESSION_LIMIT_REACHED')

    const campaignModel = await body<{ slug: string }>(await request.get(campaignApi))
    const campaignShopper = await shopper(campaignModel.slug)
    await completed(campaignShopper.session, campaignShopper.choices[0]!, 'm2-campaign-a-' + run)
    await completed(campaignShopper.session, campaignShopper.choices[1]!, 'm2-campaign-b-' + run)
    // A new selection of the remaining Catalog frame is still the same
    // shopper Session. The per-Session limit must survive another shortlist.
    await body(await request.post('/api/store/sessions/select-frames', {
      data: { merchantSlug: slug, merchantSessionId: campaignShopper.session,
        frameIds: [campaignShopper.choices[2]!], clientActionId: 'm2-select-next-' + run,
        locale: 'en', deviceType: 'desktop' },
    }))
    const campaignDenied = await generate(campaignShopper.session, campaignShopper.choices[2]!, 'm2-campaign-c-' + run)
    expect(campaignDenied.status(), await campaignDenied.text()).toBe(429)
    expect((await campaignDenied.json()).code).toBe('AI_SESSION_LIMIT_REACHED')

    const ledger = await prisma.merchantAiRenderReservation.groupBy({
      by: ['status'], where: { merchantId: id }, _count: { _all: true },
    })
    expect(ledger.find((x) => x.status === 'SETTLED')?._count._all).toBe(3)
    expect(ledger.find((x) => x.status === 'RESERVED')).toBeUndefined()

    await page.goto('/en/merchant/plan?merchantId=' + id, { waitUntil: 'networkidle' })
    await expect(page.getByText('AI Try-On generations', { exact: true })).toBeVisible()
    await expect(page.getByText('3 / 20', { exact: true })).toBeVisible()
    console.log(JSON.stringify({ result: 'PASS', merchantM2Ui: true, storeLimitsSavedAndReloaded: [4, 2, 1],
      campaignLimitsSavedAndReloaded: [1, 4, 2], storeActualLimit: 1, campaignActualLimit: 2,
      settledRenders: 3, noProviderSpend: true }))
  })
})
