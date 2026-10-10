import { expect, test } from '@playwright/test'

const enabled = process.env.APP_ENV === 'local'
  && process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.G1F_CATALOG_NATIVE_PHOTO_E2E === '1'
  && process.env.PLAYWRIGHT_BASE_URL === 'http://127.0.0.1:3003'

// Real browser and LOCAL database. Only the external Blob storage call is simulated.
const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlG0p0AAAAASUVORK5CYII=',
  'base64',
)
const blobHost = 'https://abc123.public.blob.vercel-storage.com'

test('chooses local photo, simulates Blob staging, then inspects and approves in real local Catalog', async ({ page, request, context }) => {
  test.skip(!enabled, 'Only the guarded local CI environment with MOCK storage is authorized.')
  test.setTimeout(180_000)
  let merchantId = ''
  let uploadCount = 0
  const browserErrors: string[] = []
  const serverErrors: string[] = []
  page.on('pageerror', (e) => browserErrors.push(e.message))
  page.on('response', (r) => { if (r.status() >= 500) serverErrors.push(String(r.status())) })

  await page.route(blobHost + '/**', async (r) => {
    await r.fulfill({ status: 200, contentType: 'image/png', body: image })
  })
  await page.route('**/api/merchant/*/catalog/media', async (route) => {
    const req = route.request()
    expect(req.method()).toBe('POST')
    expect(req.headers()['content-type']).toContain('multipart/form-data;')
    expect(req.postDataBuffer()?.byteLength ?? 0).toBeGreaterThan(image.byteLength)
    expect(new URL(req.url()).pathname.split('/')[3]).toBe(merchantId)
    uploadCount++
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {
        url: blobHost + '/merchant-catalog/' + merchantId
          + '/product/0123456789abcdef0123456789abcdef.png',
        width: 1, height: 1,
      } }),
    })
  })

  const csrf = await request.get('/api/auth/csrf')
  expect(csrf.status()).toBe(200)
  const { csrfToken } = await csrf.json() as { csrfToken: string }
  const login = await request.post('/api/auth/callback/mock-credentials', {
    form: {
      email: 'clean@local.test', qaIdentity: 'clean', type: 'premium',
      csrfToken, callbackUrl: '/en/merchant', json: 'true',
    },
  })
  expect(login.ok()).toBeTruthy()
  await context.addCookies((await request.storageState()).cookies)
  await page.goto('/en/merchant', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /set up visutry for your business/i })).toBeVisible()
  // Next dev hydration timing varies after two prior local browser journeys.
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/business, brand, or store name/i).fill('Local Native Photo QA Merchant')
  const createResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/merchant/workspaces')
    && response.request().method() === 'POST', { timeout: 45_000 })
  await page.getByRole('button', { name: /create merchant workspace/i }).click()
  const createResponse = await createResponsePromise
  expect(createResponse.status(), 'Real LOCAL Merchant workspace API creation').toBe(200)
  await expect(page.locator('[data-onboarding-state="created"]')).toContainText('Workspace created', { timeout: 45_000 })
  merchantId = await page.getByLabel('Active merchant').inputValue()
  expect(merchantId).toMatch(/^[A-Za-z0-9_-]+$/)

  async function readCatalog() {
    const res = await page.request.get('/api/merchant/' + merchantId + '/catalog?readiness=all&limit=100')
    expect(res.status()).toBe(200)
    const body = await res.json() as {
      success: boolean; data: { items: Array<{ sku: string | null; imageUrl: string | null }> }
    }
    expect(body.success).toBe(true)
    return body.data.items
  }
  expect(await readCatalog()).toHaveLength(0)
  await page.getByRole('tab', { name: 'Add manually' }).click()
  await page.getByLabel('Product name for product 1').fill('Local Photo Round')
  await page.getByLabel('Merchant SKU for product 1').fill('G1F-PHOTO-001')
  await expect(page.getByRole('button', { name: 'Review product' })).toBeDisabled()

  await page.getByLabel('Choose product photo').setInputFiles({
    name: 'frame.png', mimeType: 'image/png', buffer: image,
  })
  await page.getByRole('button', { name: 'Upload photo' }).click()
  const expected = blobHost + '/merchant-catalog/' + merchantId
    + '/product/0123456789abcdef0123456789abcdef.png'
  await expect(page.getByLabel('Product image URL for product 1')).toHaveValue(expected)
  expect(uploadCount).toBe(1)
  expect(await readCatalog()).toHaveLength(0)

  await page.getByRole('button', { name: 'Review product' }).click()
  await expect(page.getByRole('heading', { name: '1 product is ready to add' })).toBeVisible()
  expect(await readCatalog()).toHaveLength(0)
  await page.getByLabel('Merchant SKU for product 1').fill('G1F-PHOTO-002')
  await expect(page.getByRole('button', { name: 'Approve and import 1' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Review product' }).click()
  await expect(page.getByRole('heading', { name: '1 product is ready to add' })).toBeVisible()
  await page.getByRole('button', { name: 'Approve and import 1' }).click()
  await expect(page.getByText('Your first product is in the Catalog.', { exact: true })).toBeVisible()

  const items = await readCatalog()
  expect(items).toHaveLength(1)
  expect(items[0]).toMatchObject({ sku: 'G1F-PHOTO-002', imageUrl: expected })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/en/merchant/catalog', { waitUntil: 'domcontentloaded' })
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
  expect(browserErrors).toEqual([])
  expect(serverErrors).toEqual([])
  console.log(JSON.stringify({ nativePhoto: {
    storage: 'MOCK', catalog: 'REAL_LOCAL_POSTGRES', uploaded: uploadCount,
    imported: items.length, explicitApproval: true, mobileOverflow: false,
  } }))
})
