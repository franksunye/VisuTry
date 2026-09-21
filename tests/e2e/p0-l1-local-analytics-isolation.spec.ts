import { expect, test } from '@playwright/test'

const isLocalAnalyticsRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.P0_L1_LOCAL_ANALYTICS_E2E === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

test.describe('P0-L1 Local public analytics isolation', () => {
  test('does not bootstrap or request GA/GTM with valid IDs present', async ({ page }) => {
    test.skip(!isLocalAnalyticsRun, 'Run the Local analytics isolation command with fake valid IDs.')

    const remoteRequests: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('www.googletagmanager.com/gtag/js')
        || url.includes('www.googletagmanager.com/gtm.js')
        || url.includes('www.google-analytics.com')) {
        remoteRequests.push(url)
      }
    })

    await page.goto('/en/business', { waitUntil: 'networkidle' })

    await expect(page.locator('script[src*="www.googletagmanager.com/gtag/js"]')).toHaveCount(0)
    await expect(page.locator('script[src*="www.googletagmanager.com/gtm.js"]')).toHaveCount(0)
    await expect(page.locator('script#google-analytics')).toHaveCount(0)
    const html = await page.content()
    expect(html).not.toContain('gtag/js?id=G-LOCALSHOULDNOTSEND')
    expect(html).not.toContain('gtm.js?id=GTM-LOCALSHOULDNOTSEND')
    expect(html).not.toContain("event:'gtm.js'")
    expect(remoteRequests).toEqual([])
  })
})
