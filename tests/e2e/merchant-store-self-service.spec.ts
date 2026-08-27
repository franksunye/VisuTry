import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test'

const isLocalMockRun = process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.G3_MERCHANT_STORE_E2E === 'true'
  && !process.env.PLAYWRIGHT_BASE_URL

async function loginWithMock(request: APIRequestContext, context: BrowserContext) {
  const csrfResponse = await request.get('/api/auth/csrf')
  expect(csrfResponse.ok()).toBeTruthy()
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
  const loginResponse = await request.post('/api/auth/callback/mock-credentials', {
    form: { email: 'test@example.com', type: 'free', csrfToken, callbackUrl: '/en/merchant', json: 'true' },
    failOnStatusCode: false,
  })
  expect(loginResponse.status()).toBeLessThan(400)
  const state = await request.storageState()
  await context.addCookies(state.cookies)
}

test.describe('Human Merchant Store G3', () => {
  test('creates, saves, previews, and explicitly publishes a Store without requiring shape', async ({ page, request, context }) => {
    test.skip(!isLocalMockRun, 'Run with NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true G3_MERCHANT_STORE_E2E=true against the local test server.')

    await loginWithMock(request, context)
    await page.goto('/en/merchant', { waitUntil: 'domcontentloaded' })
    const workspaceResponse = await page.evaluate(async () => {
      const response = await fetch('/api/merchant/workspaces', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'G3 Local Human Store' }),
      })
      return { status: response.status, body: await response.json() as { data?: { merchant?: { id?: string } } } }
    })
    expect(workspaceResponse.status).toBeLessThan(400)
    const merchantId = workspaceResponse.body.data?.merchant?.id
    expect(merchantId).toBeTruthy()

    const frames = [
      {
        id: 'frame-g3-a', sku: null, externalId: 'shopify:g3-frame-a', productUrl: 'https://catalog.example.test/products/g3-frame-a',
        name: 'G3 Shape-Pending Frame', brand: 'G3 Optical', imageUrl: '/assets/glasses-presets/large-round-classic.jpg', price: 12900, currency: 'usd',
        shape: '', source: 'EXTERNAL', status: 'ACTIVE', enrichmentStatus: 'PENDING',
        validation: { recommendationReady: false, recommendationIssues: ['MISSING_SHAPE'] },
        storeReadiness: { storeEligible: true, issues: [] },
      },
      {
        id: 'frame-g3-b', sku: 'G3-B', externalId: 'shopify:g3-frame-b', productUrl: 'https://catalog.example.test/products/g3-frame-b',
        name: 'G3 Saved Frame B', brand: 'G3 Optical', imageUrl: '/assets/glasses-presets/geometric-classic.jpg', price: 13900, currency: 'usd',
        shape: 'round', source: 'EXTERNAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED',
        validation: { recommendationReady: true, recommendationIssues: [] },
        storeReadiness: { storeEligible: true, issues: [] },
      },
      {
        id: 'frame-g3-c', sku: 'G3-C', externalId: 'shopify:g3-frame-c', productUrl: 'https://catalog.example.test/products/g3-frame-c',
        name: 'G3 Local Frame C', brand: 'G3 Optical', imageUrl: '/assets/glasses-presets/oval-classic.jpg', price: 14900, currency: 'usd',
        shape: 'oval', source: 'EXTERNAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED',
        validation: { recommendationReady: true, recommendationIssues: [] },
        storeReadiness: { storeEligible: true, issues: [] },
      },
      {
        id: 'frame-g3-d', sku: 'G3-D', externalId: 'shopify:g3-frame-d', productUrl: 'https://catalog.example.test/products/g3-frame-d',
        name: 'G3 Local Frame D', brand: 'G3 Optical', imageUrl: '/assets/glasses-presets/square-classic.jpg', price: 15900, currency: 'usd',
        shape: 'square', source: 'EXTERNAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED',
        validation: { recommendationReady: true, recommendationIssues: [] },
        storeReadiness: { storeEligible: true, issues: [] },
      },
    ]
    let imported = false
    let store: { id: string; slug: string; name: string; status: 'DRAFT' | 'ACTIVE'; headline: string | null; description: string | null; publicPath: string; selectedFrameIds: string[] } | null = null
    let selectedFrameIds: string[] = []
    let createCalls = 0
    let publishCalls = 0
    let lastPreviewPayload: { frames: typeof frames; checks: Array<{ frameId: string; storeEligible: boolean; recommendationReady: boolean }> } | null = null
    await page.route('**/api/merchant/*/catalog**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/inspect')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          success: true,
          data: {
            proposal: true, writePerformed: false, requiresApproval: true,
            sourceSummary: { sourceUrls: ['https://shop.example.test'], sourceHostnames: ['shop.example.test'], platforms: ['SHOPIFY'], fetchedPageCount: 1, foundCount: 4, readyToImport: 4, importReady: 4, recommendationReady: 3, needsReview: 1, invalid: 0, reasonDistribution: { MISSING_SHAPE: 1 }, sourceIssues: [] },
            candidates: frames.map((item) => ({
              ...item,
              identity: item.sku ? { type: 'MERCHANT_SKU', value: item.sku } : { type: 'EXTERNAL_ID', value: item.externalId },
              shapeSource: item.shape ? 'STRUCTURED_FIELD' : 'NONE', shapeConfidence: item.shape ? 0.98 : null,
              importReady: true, recommendationReady: item.validation.recommendationReady,
              recommendationIssues: item.validation.recommendationIssues,
              readiness: item.validation.recommendationReady ? 'RECOMMENDATION_READY' : 'IMPORT_READY',
              dedupeStatus: 'NEW', issues: item.validation.recommendationIssues,
            })),
            importReady: frames.map(({ validation: _validation, storeReadiness: _storeReadiness, ...item }) => item),
            limits: { maxSourceUrls: 5, maxDiscoveredProducts: 1000 },
          },
        }) })
        return
      }
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          success: true,
          data: { items: imported ? frames : [], nextCursor: null },
        }) })
        return
      }
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { approved?: boolean; frames?: unknown[] }
        expect(body.approved).toBe(true)
        imported = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { ids: frames.map((item) => item.id), created: frames.length, updated: 0, imported: frames.length } }) })
        return
      }
      await route.continue()
    })

    await page.route('**/api/merchant/*/store**', async (route) => {
      const url = new URL(route.request().url())
      const pathname = url.pathname
      const method = route.request().method()
      if (pathname.endsWith('/preview')) {
        const previewFrames = selectedFrameIds.map((id) => frames.find((item) => item.id === id)).filter((item): item is typeof frames[number] => Boolean(item))
        lastPreviewPayload = {
          frames: previewFrames,
          checks: previewFrames.map((item) => ({ frameId: item.id, storeEligible: item.storeReadiness.storeEligible, recommendationReady: item.validation.recommendationReady })),
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {
          store: { id: store?.id ?? 'store-g3', name: store?.name ?? 'G3 Local Human Store', status: store?.status ?? 'DRAFT', headline: store?.headline ?? null, description: store?.description ?? null, publicPath: `/en/store/g3-local` },
          frameCount: previewFrames.length,
          frames: previewFrames.map((item) => ({ id: item.id, name: item.name, imageUrl: item.imageUrl, shape: item.shape, color: null, productBrand: item.brand })),
          readiness: { ready: previewFrames.length > 0, readyFrameCount: previewFrames.length, blockingIssues: [], checks: lastPreviewPayload.checks },
          preview: { sideEffectFree: true, publicPath: '/en/store/g3-local' },
        } }) })
        return
      }
      if (pathname.endsWith('/publish')) {
        publishCalls += 1
        const body = route.request().postDataJSON() as { approved?: boolean }
        expect(body.approved).toBe(true)
        if (store) store = { ...store, status: 'ACTIVE' }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: store?.id ?? 'store-g3', status: 'ACTIVE', publicPath: '/en/store/g3-local', approvalRecorded: true } }) })
        return
      }
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {
          store: store ? { ...store, selectedFrameIds } : null,
          catalog: imported ? frames : [],
        } }) })
        return
      }
      if (method === 'POST') {
        createCalls += 1
        if (!store) {
          const body = route.request().postDataJSON() as { name?: string; headline?: string | null; description?: string | null }
          store = { id: 'store-g3', slug: 'store', name: body.name?.trim() || 'G3 Local Human Store', status: 'DRAFT', headline: body.headline ?? null, description: body.description ?? null, publicPath: '/en/store/g3-local', selectedFrameIds: [] }
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: store.id, slug: store.slug, name: store.name, status: store.status, created: true, publicPath: store.publicPath } }) })
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: store.id, slug: store.slug, name: store.name, status: store.status, created: false, publicPath: store.publicPath } }) })
        }
        return
      }
      if (method === 'PATCH') {
        const body = route.request().postDataJSON() as { name?: string; headline?: string | null; description?: string | null }
        if (store) store = { ...store, name: body.name?.trim() || store.name, headline: body.headline ?? null, description: body.description ?? null }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: store }) })
        return
      }
      if (method === 'PUT') {
        const body = route.request().postDataJSON() as { frameIds?: string[] }
        selectedFrameIds = body.frameIds ?? []
        if (store) store = { ...store, selectedFrameIds }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { storeId: 'store-g3', frameIds: selectedFrameIds, frameCount: selectedFrameIds.length } }) })
        return
      }
      await route.continue()
    })

    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(merchantId as string)}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Add your eyewear catalog', exact: true })).toBeVisible()
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/store or product url/i).fill('https://shop.example.test')
    await expect(page.getByLabel(/store or product url/i)).toHaveValue('https://shop.example.test')
    const [inspectResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/catalog/inspect')),
      page.getByRole('button', { name: /inspect and preview/i }).click(),
    ])
    expect(inspectResponse.ok()).toBeTruthy()
    await expect(page.getByText('Review before import', { exact: true })).toBeVisible()
    await expect(page.getByText(/FOUND 4 · IMPORT_READY 4 · RECOMMENDATION_READY 3 · NEEDS_REVIEW 1/i)).toBeVisible()
    await page.getByRole('button', { name: /approve and import 4/i }).click()
    await expect(page.getByText('G3 Shape-Pending Frame')).toBeVisible()

    await expect(page.getByRole('heading', { name: /create your store/i })).toBeVisible()
    await page.getByRole('button', { name: /^create store$/i }).click()
    await expect(page.getByRole('heading', { name: /set up your store/i })).toBeVisible()
    await expect(page.getByText('Available in Store · Recommendation enrichment pending')).toBeVisible()
    expect(createCalls).toBe(1)

    const createRetry = await page.evaluate(async () => {
      const response = await fetch('/api/merchant/test/store', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) })
      return await response.json() as { data?: { created?: boolean; id?: string } }
    })
    expect(createRetry.data).toMatchObject({ created: false, id: 'store-g3' })
    expect(createCalls).toBe(2)

    await page.getByLabel('Store name').fill('G3 Preview Collection')
    await page.getByLabel('Store headline').fill('Frames selected for your next look')
    await page.getByLabel('Store description').fill('A private G3 Store draft for the selected eyewear collection.')
    await page.getByRole('button', { name: /save details/i }).click()
    await expect(page.getByText('Store details saved.')).toBeVisible()

    const checkboxes = page.locator('#store input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()
    await page.getByRole('button', { name: /save products/i }).click()
    await expect(page.getByText('Store products saved.')).toBeVisible()
    const [previewResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/store/preview')),
      page.getByRole('button', { name: /preview store/i }).click(),
    ])
    expect(previewResponse.ok()).toBeTruthy()
    await expect(page.getByTestId('store-draft-preview')).toContainText('G3 Preview Collection')
    await expect(page.getByTestId('store-draft-preview')).toContainText('Frames selected for your next look')
    await expect(page.getByTestId('store-draft-preview')).toContainText('G3 Shape-Pending Frame')
    expect(lastPreviewPayload).toBeTruthy()
    expect((lastPreviewPayload as unknown as { frames: typeof frames }).frames.map((frame) => frame.id)).toEqual(['frame-g3-a', 'frame-g3-b'])
    expect((lastPreviewPayload as unknown as { checks: Array<{ frameId: string; storeEligible: boolean; recommendationReady: boolean }> }).checks).toContainEqual({ frameId: 'frame-g3-a', storeEligible: true, recommendationReady: false })
    await expect(page.getByText(/DRAFT · not public/i)).toBeVisible()
    expect(publishCalls).toBe(0)

    await checkboxes.nth(0).uncheck()
    await checkboxes.nth(1).uncheck()
    await checkboxes.nth(2).check()
    await checkboxes.nth(3).check()
    await expect(page.getByText('Save your changes before previewing.')).toBeVisible()
    await expect(page.getByRole('button', { name: /preview store/i })).toBeDisabled()
    await expect(page.getByTestId('store-draft-preview')).not.toBeVisible()

    await page.getByRole('button', { name: /save products/i }).click()
    await expect(page.getByText('Store products saved.')).toBeVisible()
    await page.getByRole('button', { name: /preview store/i }).click()
    await expect(page.getByTestId('store-draft-preview')).toContainText('G3 Local Frame C')
    await expect(page.getByTestId('store-draft-preview')).toContainText('G3 Local Frame D')
    await expect(page.getByTestId('store-draft-preview')).not.toContainText('G3 Shape-Pending Frame')
    expect(lastPreviewPayload).toBeTruthy()
    expect((lastPreviewPayload as unknown as { frames: typeof frames }).frames.map((frame) => frame.id)).toEqual(['frame-g3-c', 'frame-g3-d'])
    expect(publishCalls).toBe(0)

    await page.getByLabel(/i confirm this store is ready to publish publicly/i).check()
    await page.getByRole('button', { name: /publish store/i }).click()
    await expect(page.getByText('Your Store is live', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /view store/i })).toHaveAttribute('href', '/en/store/g3-local')
    await expect(page.getByRole('button', { name: /copy store link/i })).toBeVisible()
    expect(publishCalls).toBe(1)

    const publishRetry = await page.evaluate(async () => {
      const response = await fetch('/api/merchant/test/store/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ storeId: 'store-g3', approved: true }) })
      return await response.json() as { data?: { id?: string; status?: string } }
    })
    expect(publishRetry.data).toMatchObject({ id: 'store-g3', status: 'ACTIVE' })
    expect(publishCalls).toBe(2)
  })
})
