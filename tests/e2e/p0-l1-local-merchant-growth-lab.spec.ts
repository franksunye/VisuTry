import { expect, test } from '@playwright/test'

const isLocalLabRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P0_L1_LOCAL_MERCHANT_E2E === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

test.describe('P0-L1 / P1-M1 Local Merchant First Value', () => {
  test('runs the real local acquisition-to-private-preview journey', async ({ page, request, context }) => {
    test.skip(!isLocalLabRun, 'Run npm run merchant:local:e2e with the Local server already running.')

    const browserErrors: string[] = []
    const serverErrors: number[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    page.on('response', (response) => {
      if (response.status() >= 500) serverErrors.push(response.status())
    })

    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Merchant Sign In' }).first().click()
    await expect(page).toHaveURL(/\/en\/auth\/signin/)
    await expect(page.getByRole('region', { name: 'Local QA' })).toBeVisible()

    // Keep the human-facing Local QA controls visible, but use the same
    // supported Credentials-provider boundary directly for this deterministic
    // browser fixture. This avoids making the test depend on client-side
    // redirect timing while still exercising the real NextAuth session.
    const csrfResponse = await request.get('/api/auth/csrf')
    expect(csrfResponse.ok()).toBeTruthy()
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
    const callbackResponse = await request.post('/api/auth/callback/mock-credentials', {
      form: {
        email: 'clean@local.test',
        qaIdentity: 'clean',
        type: 'premium',
        csrfToken,
        callbackUrl: '/en/merchant',
        json: 'true',
      },
    })
    expect(callbackResponse.ok()).toBeTruthy()
    await context.addCookies(await request.storageState().then((state) => state.cookies))
    await page.goto('/en/merchant', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/en\/merchant(?:\?|$)/)
    await expect(page.getByRole('heading', { name: /set up visutry for your business/i })).toBeVisible()
    const nameField = page.getByLabel(/business, brand, or store name/i)
    await expect(nameField).toHaveAttribute('required', '')
    await page.waitForLoadState('networkidle')
    await nameField.fill('Local Growth Lab Eyewear')
    await page.getByRole('button', { name: /create merchant workspace/i }).click()
    await expect(page.getByRole('status')).toContainText('Workspace created')
    await expect(page.getByRole('link', { name: 'Add your first product' })).toBeVisible()

    await page.getByRole('tab', { name: 'Add manually' }).click()
    await page.getByLabel('Product name for product 1').fill('Local Growth Round Frame')
    await page.getByLabel('Product image URL for product 1').fill(`${process.env.PLAYWRIGHT_BASE_URL}/assets/glasses-presets/large-round-classic.jpg`)
    await page.getByLabel('Merchant SKU for product 1').fill('LOCAL-FRAME-001')
    await expect(page.getByRole('button', { name: 'Review product' })).toBeEnabled()
    await page.getByRole('button', { name: 'Review product' }).click()
    await expect(page.getByRole('heading', { name: '1 product is ready to add' })).toBeVisible()
    await page.getByRole('button', { name: /Approve and import 1/ }).click()
    await expect(page.getByText('Your first product is in the Catalog.', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Create your Store/ })).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Create your Store' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create your Store' })).toBeVisible()
    await expect(page.getByText('Add Store details (optional)')).toBeVisible()
    await page.getByRole('button', { name: 'Create Store draft' }).click()
    await expect(page.getByRole('heading', { name: 'Set up your Store' })).toBeVisible()
    await expect(page.getByText('Your Store draft is ready with your first product selected.', { exact: true })).toBeVisible()
    await expect(page.locator('#store').getByRole('button', { name: 'Preview your Store' }).first()).toBeEnabled()
    await page.locator('#store').getByRole('button', { name: 'Preview your Store' }).first().click()
    await expect(page.getByTestId('store-draft-preview')).toBeVisible()
    await expect(page.getByText('Private draft preview', { exact: true })).toBeVisible()
    await expect(page.getByText('DRAFT · not public')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /confirm this store is ready/i })).not.toBeChecked()
    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
  })
})
