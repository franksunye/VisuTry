import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const enabled = process.env.APP_ENV === 'local'
  && process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.G1F_REAL_CATALOG_CSV_E2E === '1'
  && process.env.PLAYWRIGHT_BASE_URL === 'http://127.0.0.1:3003'

test('blocks paused URL import, keeps CSV available, and imports only after approval through real Catalog APIs', async ({ page, request, context }) => {
  test.skip(!enabled, 'Requires the marked ephemeral LOCAL PostgreSQL CI environment.')
  test.setTimeout(180_000)

  const browserErrors: string[] = []
  const serverErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(String(response.status()) + ' ' + response.url())
  })

  const csrfResponse = await request.get('/api/auth/csrf')
  expect(csrfResponse.status()).toBe(200)
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
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
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/business, brand, or store name/i).fill('Local CSV Recovery QA Merchant')
  const createPromise = page.waitForResponse((response) =>
    response.url().includes('/api/merchant/workspaces')
    && response.request().method() === 'POST', { timeout: 45_000 })
  await page.getByRole('button', { name: /create merchant workspace/i }).click()
  expect((await createPromise).status()).toBe(201)
  await expect(page.locator('[data-onboarding-state="created"]')).toContainText('Workspace created', { timeout: 45_000 })
  const merchantId = await page.getByLabel('Active merchant').inputValue()
  expect(merchantId).toMatch(/^[a-zA-Z0-9_-]+$/)
  const catalogUrl = '/api/merchant/' + merchantId + '/catalog'

  async function readCatalog() {
    const response = await page.request.get(catalogUrl + '?readiness=all&limit=100')
    expect(response.status()).toBe(200)
    const body = await response.json() as {
      success: boolean; data: { items: Array<{
        id: string; sku: string | null; source: string;
        imageUrl: string | null; name: string; price: number | null
      }> }
    }
    expect(body.success).toBe(true)
    return body.data.items
  }
  expect(await readCatalog()).toHaveLength(0)

  // The paused capability is hidden and direct requests fail before fetching.
  await expect(page.getByRole('tab', { name: 'Store URL' })).toHaveCount(0)
  const disabled = await page.request.post(catalogUrl + '/inspect', {
    data: { sourceType: 'url', sourceUrls: ['https://example.com/products/frame'] },
  })
  expect(disabled.status()).toBe(403)
  expect(await disabled.json()).toMatchObject({ success: false, error: 'PUBLIC_URL_IMPORT_DISABLED' })
  expect(await readCatalog()).toHaveLength(0)

  mkdirSync('.local/merchant-rc/evidence/catalog-url-pause', { recursive: true })
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.locator('#catalog').screenshot({ path: `.local/merchant-rc/evidence/catalog-url-pause/catalog-${viewport.width}.png` })
  }

  // Recovery goes through the actual multipart CSV inspection endpoint and DB.
  await page.getByRole('tab', { name: 'Upload CSV' }).click()
  await page.getByLabel('Product CSV').setInputFiles({
    name: 'real-local-catalog.csv', mimeType: 'text/csv',
    buffer: Buffer.from(
      'sku,name,shape,imageUrl,productUrl,price,brand\n'
      + 'G1F-CSV-001,CSV Recovery Round,round,https://cdn.example.test/catalog/round.jpg,https://merchant.example.test/products/recovery-round,89.50,Local QA\n',
    ),
  })
  const csvPromise = page.waitForResponse((response) =>
    response.url().endsWith(catalogUrl + '/inspect')
    && response.request().method() === 'POST', { timeout: 45_000 })
  await page.getByRole('button', { name: 'Inspect and preview' }).click()
  const csvResponse = await csvPromise
  expect(csvResponse.status()).toBe(200)
  const inspected = await csvResponse.json() as {
    success: boolean; data: {
      requiresApproval: boolean;
      importReady: Array<{ sku: string; imageUrl: string; source: string }>
    }
  }
  expect(inspected.success).toBe(true)
  expect(inspected.data.requiresApproval).toBe(true)
  expect(inspected.data.importReady).toHaveLength(1)
  expect(inspected.data.importReady[0]).toMatchObject({ sku: 'G1F-CSV-001', source: 'CSV' })
  await expect(page.getByRole('heading', { name: '1 product is ready to add' })).toBeVisible()
  expect(await readCatalog()).toHaveLength(0)

  // Server must reject approval-less writes even after a valid inspection.
  const noApproval = await page.request.post(catalogUrl, { data: {
    approved: false, frames: inspected.data.importReady,
  } })
  expect(noApproval.status()).toBe(400)
  expect(await readCatalog()).toHaveLength(0)

  const approved = page.waitForResponse((response) =>
    response.url().endsWith(catalogUrl)
    && response.request().method() === 'POST', { timeout: 45_000 })
  await page.getByRole('button', { name: 'Approve and import 1' }).click()
  expect((await approved).status()).toBe(200)
  await expect(page.getByText('Your first product is in the Catalog.', { exact: true })).toBeVisible()
  const rows = await readCatalog()
  expect(rows).toHaveLength(1)
  expect(rows[0]).toMatchObject({
    sku: 'G1F-CSV-001', source: 'CSV',
    name: 'CSV Recovery Round',
    imageUrl: 'https://cdn.example.test/catalog/round.jpg',
    price: 8950,
  })
  expect(browserErrors).toEqual([])
  expect(serverErrors).toEqual([])
  console.log(JSON.stringify({ catalogCsvE2e: {
    urlSource: 'PUBLIC_URL_IMPORT_DISABLED',
    csvInspect: 'REAL_LOCAL_MULTIPART',
    catalogApprovalAndReadback: 'REAL_LOCAL_POSTGRES',
    beforeExplicitApproval: 0, afterApproval: rows.length,
    paidProviderCalls: 'NOT_MEASURED',
  } }))
})
