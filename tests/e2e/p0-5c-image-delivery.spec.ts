import { expect, test, type Page } from '@playwright/test'

const viewports = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
] as const

function collectImageRequests(page: Page) {
  const requests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/_next/image' || url.pathname.startsWith('/images/seo/')) {
      requests.push(request.url())
    }
  })
  return requests
}

async function loadPublicPage(page: Page, route: string) {
  const requests = collectImageRequests(page)
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

  expect(response, `${route} should return an HTTP response`).not.toBeNull()
  expect(response!.status(), `${route} should not return an error status`).toBeLessThan(400)
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()

  // Scroll only to make lazy public content images eligible for delivery. This
  // remains a single page-load observation; it is not a traffic/load test.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  return requests
}

function isSeoOptimizerRequest(requestUrl: string) {
  const url = new URL(requestUrl)
  return url.pathname === '/_next/image' && (url.searchParams.get('url') ?? '').startsWith('/images/seo/')
}

function isDirectSeoRequest(requestUrl: string) {
  return new URL(requestUrl).pathname.startsWith('/images/seo/')
}

test.describe('P0.5C image delivery governance', () => {
  for (const [viewportName, viewport] of viewports) {
    test(`${viewportName}: editorial SEO WebP assets use the viewport-safe delivery path`, async ({ page }) => {
      await page.setViewportSize(viewport)
      const requests = await loadPublicPage(page, '/en/style/round-face')

      if (viewportName === 'desktop') {
        expect(requests.filter(isDirectSeoRequest).length).toBeGreaterThan(0)
        expect(requests.filter(isSeoOptimizerRequest)).toHaveLength(0)
      } else {
        expect(requests.filter(isDirectSeoRequest)).toHaveLength(0)
        expect(requests.filter(isSeoOptimizerRequest).length).toBeGreaterThan(0)
      }
      expect(await page.locator('img').count()).toBeGreaterThan(0)
    })

    test(`${viewportName}: small SEO WebP placements retain responsive optimization`, async ({ page }) => {
      await page.setViewportSize(viewport)
      const requests = await loadPublicPage(page, '/en/face-shape-detector')

      expect(requests.filter(isDirectSeoRequest)).toHaveLength(0)
      expect(requests.filter(isSeoOptimizerRequest).length).toBeGreaterThan(0)
      expect(await page.locator('img').count()).toBeGreaterThan(0)
    })
  }

  test('combination visual SEO PNG assets retain responsive optimization', async ({ page }) => {
    const requests = await loadPublicPage(page, '/en/glasses-guide/best-rectangle-glasses-for-round-face')
    const optimizerRequests = requests.filter((requestUrl) => new URL(requestUrl).pathname === '/_next/image')

    expect(optimizerRequests.length).toBeGreaterThan(0)
    expect(optimizerRequests.some((requestUrl) => (new URL(requestUrl).searchParams.get('url') ?? '').includes('/_next/static/media/'))).toBe(true)
    expect(requests.filter(isDirectSeoRequest)).toHaveLength(0)
  })
})
