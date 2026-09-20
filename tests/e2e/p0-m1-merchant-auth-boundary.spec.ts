import { expect, test, type Page } from '@playwright/test'

async function openSignIn(page: Page, callbackUrl: string) {
  await page.goto(`/en/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, { waitUntil: 'networkidle' })
}

test.describe('P0-M1 Merchant acquisition/auth boundary', () => {
  test('ordinary Consumer and Public SEO callbacks use the Consumer auth surface', async ({ page }) => {
    for (const publicPath of ['/en', '/en/style/round-face']) {
      const sessionRequests: string[] = []
      page.on('request', (request) => {
        if (new URL(request.url()).pathname === '/api/auth/session') sessionRequests.push(request.url())
      })
      await page.goto(publicPath, { waitUntil: 'networkidle' })
      const signInHref = await page.locator('a[href*="/auth/signin"]').first().getAttribute('href')

      expect(signInHref).toBeTruthy()
      expect(sessionRequests).toHaveLength(0)
      await page.goto(signInHref!, { waitUntil: 'networkidle' })
      await expect(page.locator('[data-auth-surface="consumer"]')).toBeVisible()
      await expect(page.getByRole('button', { name: /create shopper account/i })).toBeVisible()
      await expect(page.getByText('Create merchant account')).toHaveCount(0)
    }
  })

  test('explicit Merchant and Store/Campaign entries retain their boundaries', async ({ page }) => {
    await openSignIn(page, '/en/merchant')
    await expect(page.locator('[data-auth-surface="merchant-admin"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /create merchant account/i })).toBeVisible()

    await openSignIn(page, '/en/c/visutry-demo/everyday-fit')
    await expect(page.locator('[data-auth-surface="shopper"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /create shopper account/i })).toBeVisible()
  })

  test('invalid external callbacks fail closed to localized Consumer home', async ({ page }) => {
    await openSignIn(page, 'https://evil.example/steal')

    await expect(page.locator('[data-auth-surface="consumer"]')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('evil.example')
    await expect(page.locator('body')).not.toContainText('Create merchant account')
  })

  test('Business Merchant Sign In remains an explicit Merchant entry', async ({ page }) => {
    await page.goto('/en/business', { waitUntil: 'domcontentloaded' })
    const merchantLink = page.getByRole('link', { name: 'Merchant Sign In' }).first()
    await expect(merchantLink).toHaveAttribute('href', '/en/merchant')
    await merchantLink.click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/en/auth/signin')
    expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe('/en/merchant')
    await expect(page.locator('[data-auth-surface="merchant-admin"]')).toBeVisible()
  })
})
