import { expect, test, type Page, type Request } from '@playwright/test'

const publicRoutes = [
  '/en',
  '/en/glasses-guide/best-rectangle-glasses-for-round-face',
  '/en/style/round-face',
  '/en/brand/warby-parker',
  '/en/blog',
] as const

function isSpeculativePublicNavigation(request: Request) {
  const headers = request.headers()
  const url = new URL(request.url())
  const purpose = `${headers.purpose ?? ''} ${headers['sec-purpose'] ?? ''}`.toLowerCase()

  if (headers['next-router-prefetch'] === '1') return true
  if (purpose.includes('prefetch') || purpose.includes('prerender')) return true

  const isRsc = headers.rsc === '1' || headers.accept?.toLowerCase().includes('text/x-component')
  return isRsc && url.searchParams.has('_rsc')
}

function collectSpeculativeRequests(page: Page) {
  const requests: string[] = []
  page.on('request', (request) => {
    if (isSpeculativePublicNavigation(request)) requests.push(request.url())
  })
  return requests
}

function collectPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test.describe('P0.5B public prefetch governance', () => {
  for (const route of publicRoutes) {
    test(`${route} has no idle speculative RSC/prefetch requests`, async ({ page }) => {
      const speculativeRequests = collectSpeculativeRequests(page)
      const pageErrors = collectPageErrors(page)
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

      expect(response, `${route} should return an HTTP response`).not.toBeNull()
      expect(response!.status(), `${route} should not return an error status`).toBeLessThan(400)
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.locator('footer')).toBeVisible()

      // Give the client router time to process viewport visibility without
      // clicking any links. This is the idle-state acceptance window.
      await page.waitForTimeout(1200)
      expect(speculativeRequests, `${route} emitted speculative requests: ${speculativeRequests.join(', ')}`).toHaveLength(0)
      expect(pageErrors, `${route} emitted browser errors`).toEqual([])
    })
  }

  test('Public navigation still works when the user clicks a Public destination', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })

    await Promise.all([
      page.waitForURL('**/en/face-shape-detector'),
      page.locator('a[href="/en/face-shape-detector"]').first().click(),
    ])

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('Public navigation still enters the Consumer App on click', async ({ page }) => {
    const sessionRequests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/auth/session') sessionRequests.push(request.url())
    })

    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await Promise.all([
      page.waitForURL('**/en/try-on/glasses'),
      page.locator('a[href="/en/try-on/glasses"]').first().click(),
    ])

    await expect(page.getByRole('banner')).toBeVisible()
    await expect.poll(() => sessionRequests.length).toBeGreaterThan(0)
  })

  test('Consumer App navigation retains its session-aware runtime', async ({ page }) => {
    const sessionRequests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/auth/session') sessionRequests.push(request.url())
    })

    const response = await page.goto('/en/try-on/glasses', { waitUntil: 'domcontentloaded' })
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(400)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect.poll(() => sessionRequests.length).toBeGreaterThan(0)
  })
})
