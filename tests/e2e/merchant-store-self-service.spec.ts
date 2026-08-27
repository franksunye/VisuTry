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
  test('creates, selects, previews, and explicitly publishes a Store without requiring shape', async ({ page, request, context }) => {
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

    const frame = {
      id: 'frame-g3', sku: null, externalId: 'shopify:g3-frame', productUrl: 'https://catalog.example.test/products/g3-frame',
      name: 'G3 Shape-Pending Frame', brand: 'G3 Optical', imageUrl: 'https://cdn.example.test/g3-frame.jpg', price: 12900, currency: 'usd',
      shape: '', source: 'EXTERNAL', status: 'ACTIVE', enrichmentStatus: 'PENDING',
      validation: { recommendationReady: false, recommendationIssues: ['MISSING_SHAPE'] },
      storeReadiness: { storeEligible: true, issues: [] },
    }
    let imported = false
    let store: { id: string; slug: string; name: string; status: 'DRAFT' | 'ACTIVE'; headline: string | null; description: string | null; publicPath: string; selectedFrameIds: string[] } | null = null
    let selectedFrameIds: string[] = []
    let publishCalls = 0

    await page.route('**/api/merchant/*/catalog**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/inspect')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          success: true,
          data: {
            proposal: true, writePerformed: false, requiresApproval: true,
            sourceSummary: { sourceUrls: ['https://shop.example.test'], sourceHostnames: ['shop.example.test'], platforms: ['SHOPIFY'], fetchedPageCount: 1, foundCount: 1, readyToImport: 1, importReady: 1, recommendationReady: 0, needsReview: 0, invalid: 0, reasonDistribution: {}, sourceIssues: [] },
            candidates: [{ ...frame, readiness: 'IMPORT_READY', status: 'READY', dedupeStatus: 'NEW', issues: [] }],
            importReady: [{ ...frame, validation: undefined, storeReadiness: undefined }],
            limits: { maxSourceUrls: 5, maxDiscoveredProducts: 1000 },
          },
        }) })
        return
      }
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          success: true,
          data: { items: imported ? [{ ...frame }] : [], nextCursor: null },
        }) })
        return
      }
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { approved?: boolean; frames?: unknown[] }
        expect(body.approved).toBe(true)
        imported = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { ids: ['frame-g3'], created: 1, updated: 0, imported: 1 } }) })
        return
      }
      await route.continue()
    })

    await page.route('**/api/merchant/*/store*', async (route) => {
      const url = new URL(route.request().url())
      const pathname = url.pathname
      const method = route.request().method()
      if (pathname.endsWith('/preview')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {
          store: { name: store?.name ?? 'G3 Local Human Store', status: store?.status ?? 'DRAFT', publicPath: `/en/store/g3-local` },
          frameCount: selectedFrameIds.length,
          readiness: { ready: true, readyFrameCount: selectedFrameIds.length, blockingIssues: [], checks: [{ frameId: 'frame-g3', storeEligible: true, recommendationReady: false }] },
          preview: { sideEffectFree: true, publicPath: '/en/store/g3-local' },
        } }) })
        return
      }
      if (pathname.endsWith('/publish')) {
        publishCalls += 1
        const body = route.request().postDataJSON() as { approved?: boolean }
        expect(body.approved).toBe(true)
        if (store) store = { ...store, status: 'ACTIVE' }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'store-g3', status: 'ACTIVE', publicPath: '/en/store/g3-local', approvalRecorded: true } }) })
        return
      }
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {
          store: store ? { ...store, selectedFrameIds } : null,
          catalog: imported ? [{ ...frame }] : [],
        } }) })
        return
      }
      if (method === 'POST') {
        store = { id: 'store-g3', slug: 'store', name: 'G3 Local Human Store', status: 'DRAFT', headline: null, description: null, publicPath: '/en/store/g3-local', selectedFrameIds: [] }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'store-g3', slug: 'store', name: store.name, status: 'DRAFT', created: true, publicPath: store.publicPath } }) })
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
    await expect(page.getByRole('heading', { name: /add your eyewear catalog/i })).toBeVisible()

    await page.getByLabel(/store or product url/i).fill('https://shop.example.test')
    await page.getByRole('button', { name: /inspect and preview/i }).click()
    await expect(page.getByRole('heading', { name: /review before import/i })).toBeVisible()
    await page.getByRole('button', { name: /approve and import 1/i }).click()
    await expect(page.getByText('G3 Shape-Pending Frame')).toBeVisible()

    await expect(page.getByRole('heading', { name: /create your store/i })).toBeVisible()
    await page.getByRole('button', { name: /^create store$/i }).click()
    await expect(page.getByRole('heading', { name: /set up your store/i })).toBeVisible()
    await page.locator('#store input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: /save products/i }).click()
    await page.getByRole('button', { name: /preview store/i }).click()
    await expect(page.getByText('Ready to publish')).toBeVisible()
    expect(publishCalls).toBe(0)
    await page.getByLabel(/i confirm this store is ready to publish publicly/i).check()
    await page.getByRole('button', { name: /publish store/i }).click()
    await expect(page.getByText('Your Store is live')).toBeVisible()
    await expect(page.getByRole('link', { name: /view store/i })).toHaveAttribute('href', '/en/store/g3-local')
    await expect(page.getByRole('button', { name: /copy store link/i })).toBeVisible()
    expect(publishCalls).toBe(1)
  })
})
