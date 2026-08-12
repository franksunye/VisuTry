import { expect, test } from '@playwright/test'

test.describe('Discover distribution surface', () => {
  test('renders the curated campaign and merchant catalog', async ({ page }) => {
    const response = await page.goto('/en/discover')
    if (!response?.ok()) {
      await page.reload()
    }
    await expect(page).toHaveTitle(/Discover.*VisuTry|VisuTry.*Discover/)
    await expect(page.getByRole('heading', { name: 'Find eyewear experiences for your fit, style, and occasion.' })).toBeVisible()

    const campaignLinks = page.locator('a[href*="/en/c/"][href*="surface=discover"]')
    const merchantLinks = page.locator('a[href*="/en/store/"][href*="surface=discover"]')

    await expect(campaignLinks).toHaveCount(6)
    await expect(merchantLinks).toHaveCount(6)
    await expect(campaignLinks.getByText('Reference Experience', { exact: true })).toHaveCount(6)
    await expect(page.getByText('Reference Experiences are product demonstrations', { exact: false })).toHaveCount(1)
    await expect(page.getByText('Live Merchant', { exact: true })).toBeVisible()
  })

  test('keeps the editorial surface within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 })
    await page.goto('/en/discover')

    await expect(page.getByRole('heading', { name: 'Find eyewear experiences for your fit, style, and occasion.' })).toBeVisible()
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)

    expect(documentWidth).toBeLessThanOrEqual(viewportWidth)
  })
})
