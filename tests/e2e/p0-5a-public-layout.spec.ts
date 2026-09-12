import { expect, test, type Page } from '@playwright/test'

const publicRoutes = [
  '/en',
  '/en/glasses-guide/best-rectangle-glasses-for-round-face',
  '/en/style/round-face',
  '/en/brand/warby-parker',
  '/en/blog',
] as const

const consumerRoutes = [
  ['/en/try-on/glasses', 'Try-On'],
  ['/en/face-analysis', 'Face Analysis'],
  ['/en/dashboard', 'Dashboard'],
  ['/en/payments', 'Payments'],
] as const

function collectSessionRequests(page: Page) {
  const requests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/api/auth/session') requests.push(url.href)
  })
  return requests
}

test.describe('P0.5A public/consumer layout boundary', () => {
  for (const route of publicRoutes) {
    test(`${route} renders without the consumer session request`, async ({ page }) => {
      const sessionRequests = collectSessionRequests(page)
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

      expect(response, `${route} should return an HTTP response`).not.toBeNull()
      expect(response!.status(), `${route} should not return an error status`).toBeLessThan(400)
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.locator('footer')).toBeVisible()
      await expect(page.locator('a[href*="/auth/signin"]')).toBeVisible()

      // Allow the normal client hydration queue to settle. This deliberately
      // observes requests instead of mocking /api/auth/session.
      await page.waitForTimeout(500)
      expect(sessionRequests, `${route} must not request /api/auth/session`).toHaveLength(0)
    })
  }

  for (const [route, surface] of consumerRoutes) {
    test(`${surface} retains the session-aware runtime`, async ({ page }) => {
      const sessionRequests = collectSessionRequests(page)
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

      expect(response).not.toBeNull()
      expect(response!.status()).toBeLessThan(400)
      await expect(page.getByRole('banner')).toBeVisible()
      await expect.poll(() => sessionRequests.length, {
        message: `${surface} should request the session endpoint`,
      }).toBeGreaterThan(0)
    })
  }
})
