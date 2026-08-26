import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test'

const isLocalMockRun = process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.G2_MERCHANT_CATALOG_E2E === 'true'
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

test.describe('Human Merchant Catalog G2', () => {
  test('covers URL, CSV, and Manual preview-to-approval paths', async ({ page, request, context }) => {
    test.skip(!isLocalMockRun, 'Run with NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true G2_MERCHANT_CATALOG_E2E=true against the local test server.')

    await loginWithMock(request, context)
    await page.goto('/en/merchant', { waitUntil: 'domcontentloaded' })
    const workspaceResponse = await page.evaluate(async () => {
      const response = await fetch('/api/merchant/workspaces', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'G2 Local Human Catalog' }),
      })
      return { status: response.status, body: await response.json() as { data?: { merchant?: { id?: string } } } }
    })
    expect(workspaceResponse.status).toBeLessThan(400)
    const merchantId = workspaceResponse.body.data?.merchant?.id
    expect(merchantId).toBeTruthy()

    let imported: Array<Record<string, unknown>> = []
    let inspectionNumber = 0
    await page.route('**/api/merchant/*/catalog**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/inspect')) {
        inspectionNumber += 1
        const sku = `G2-${inspectionNumber}`
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          success: true,
          data: {
            proposal: true, writePerformed: false, requiresApproval: true,
            sourceSummary: { sourceUrls: [], sourceHostnames: [], platforms: inspectionNumber === 1 ? ['SHOPIFY'] : [], fetchedPageCount: 1, foundCount: 1, readyToImport: 1, needsReview: 0, invalid: 0, sourceIssues: [] },
            candidates: [{ sku, name: `G2 Product ${inspectionNumber}`, brand: 'VisuTry', imageUrl: 'https://cdn.example.test/frame.jpg', productUrl: 'https://catalog.example.test/products/frame', price: 9900, currency: 'usd', shape: 'round', material: null, color: null, widthClass: null, styleTags: [], collectionTags: [], source: inspectionNumber === 2 ? 'CSV' : inspectionNumber === 3 ? 'MANUAL' : 'EXTERNAL', externalId: null, status: 'READY', dedupeStatus: 'NEW', issues: [] }],
            importReady: [{ sku, name: `G2 Product ${inspectionNumber}`, brand: 'VisuTry', imageUrl: 'https://cdn.example.test/frame.jpg', productUrl: 'https://catalog.example.test/products/frame', price: 9900, currency: 'usd', shape: 'round', source: inspectionNumber === 2 ? 'CSV' : inspectionNumber === 3 ? 'MANUAL' : 'EXTERNAL' }],
            limits: { maxSourceUrls: 5, maxDiscoveredProducts: inspectionNumber === 2 ? 1000 : 20 },
          },
        }) })
        return
      }
      if (route.request().method() === 'GET') {
        const items = imported.map((item, index) => ({ ...item, id: `frame-${index}`, status: 'ACTIVE', source: item.source, validation: { valid: true, issues: [], warnings: [] } }))
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { items, nextCursor: null } }) })
        return
      }
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { approved?: boolean; frames?: Array<Record<string, unknown>> }
        expect(body.approved).toBe(true)
        imported = [...imported, ...(body.frames ?? [])]
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { ids: ['frame'], created: body.frames?.length ?? 0, updated: 0, imported: body.frames?.length ?? 0 } }) })
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
    await expect(page.getByText('G2 Product 1')).toBeVisible()

    await page.getByRole('tab', { name: /upload csv/i }).click()
    await page.getByLabel(/product csv/i).setInputFiles({ name: 'catalog.csv', mimeType: 'text/csv', buffer: Buffer.from('sku,name,shape,imageUrl\nG2-2,CSV Frame,round,https://cdn.example.test/frame.jpg') })
    await page.getByRole('button', { name: /inspect and preview/i }).click()
    await page.getByRole('button', { name: /approve and import 1/i }).click()
    await expect(page.getByText('G2 Product 2')).toBeVisible()

    await page.getByRole('tab', { name: /add manually/i }).click()
    await page.getByLabel(/sku for product 1/i).fill('G2-3')
    await page.getByLabel(/name for product 1/i).fill('Manual Frame')
    await page.getByLabel(/shape for product 1/i).fill('oval')
    await page.getByLabel(/imageUrl for product 1/i).fill('https://cdn.example.test/manual.jpg')
    await page.getByRole('button', { name: /inspect and preview/i }).click()
    await page.getByRole('button', { name: /approve and import 1/i }).click()
    await expect(page.getByText('G2 Product 3')).toBeVisible()
  })
})
