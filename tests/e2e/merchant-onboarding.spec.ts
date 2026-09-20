import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test'

const isLocalMockRun = process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.G1_MERCHANT_ONBOARDING_E2E === 'true'
  && !process.env.PLAYWRIGHT_BASE_URL

async function loginWithMock(
  request: APIRequestContext,
  context: BrowserContext,
  userType: 'free' | 'premium',
) {
  const csrfResponse = await request.get('/api/auth/csrf')
  expect(csrfResponse.ok()).toBeTruthy()
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
  const loginResponse = await request.post('/api/auth/callback/mock-credentials', {
    form: {
      email: userType === 'premium' ? 'premium@example.com' : 'test@example.com',
      type: userType,
      csrfToken,
      callbackUrl: '/en/merchant',
      json: 'true',
    },
    failOnStatusCode: false,
  })
  expect(loginResponse.status()).toBeLessThan(400)
  const state = await request.storageState()
  await context.addCookies(state.cookies)
}

test.describe('Human Merchant Onboarding G1', () => {
  test('runs the local mock golden path once and preserves tenant ownership', async ({ page, request, context }) => {
    test.skip(!isLocalMockRun, 'Run with NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true G1_MERCHANT_ONBOARDING_E2E=true against the local test server.')

    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page).toHaveURL(/\/en\/auth\/signin/)
    const callbackUrl = new URL(page.url()).searchParams.get('callbackUrl')
    expect(callbackUrl).toBe('/en/merchant')

    // The local QA seed gives mock-user-1 the four reusable QA Merchants.
    // Use mock-user-2 as the clean new-workspace identity, then use the same
    // identity again to prove the existing-workspace path is idempotent.
    await loginWithMock(request, context, 'premium')
    await page.goto('/en/merchant', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /set up visutry for your business/i })).toBeVisible()
    const nameField = page.getByLabel(/business, brand, or store name/i)
    const websiteField = page.getByLabel(/website/i)
    await expect(nameField).toBeVisible()
    await expect(nameField).toHaveAttribute('required', '')
    await expect(websiteField).toBeVisible()
    await nameField.fill('G1 Local Human Merchant')
    await websiteField.fill('https://g1-local.example')
    await page.getByRole('button', { name: /create merchant workspace/i }).click()

    await expect(page).toHaveURL(/\/en\/merchant\?merchantId=[^&]+&onboarding=created/)
    await expect(page.getByRole('status')).toContainText('Merchant workspace created successfully')
    await expect(page.getByRole('link', { name: /next: add your eyewear catalog/i })).toHaveAttribute('href', '#catalog')
    const merchantId = new URL(page.url()).searchParams.get('merchantId')
    expect(merchantId).toBeTruthy()

    const retry = await page.evaluate(async () => {
      const response = await fetch('/api/merchant/workspaces', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'G1 Local Human Merchant' }),
      })
      return { status: response.status, body: await response.json() }
    })
    expect(retry.status).toBe(200)
    expect(retry.body).toMatchObject({ success: true, data: { created: false, merchant: { id: merchantId } } })

    const csrfToken = await page.evaluate(async () => {
      const response = await fetch('/api/auth/csrf')
      return (await response.json() as { csrfToken: string }).csrfToken
    })
    await page.evaluate(async (token) => {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrfToken: token, callbackUrl: '/' }),
      })
    }, csrfToken)
    await context.clearCookies()

    await loginWithMock(request, context, 'premium')
    await page.goto('/en/merchant', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /bring your eyewear catalog to life/i })).toBeVisible()
    await expect(page.locator('body')).toContainText('G1 Local Human Merchant')
    await expect(page.getByText(/create your merchant workspace/i)).not.toBeVisible()

    await context.clearCookies()
    await loginWithMock(request, context, 'free')
    const denied = await page.evaluate(async (id) => {
      const response = await fetch(`/api/merchant/${id}/profile`)
      return response.status
    }, merchantId)
    expect(denied).toBe(404)
  })
})
