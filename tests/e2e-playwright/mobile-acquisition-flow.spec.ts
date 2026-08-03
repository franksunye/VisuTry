import { test, expect, devices } from '@playwright/test'

/**
 * Mobile acquisition-flow smoke: verifies the public GTM continuation surfaces
 * render and expose Detector → Try-On → Compare → Pricing paths.
 * Does not exercise upload/AI processing.
 */
test.use({ ...devices['Pixel 5'] })

test.describe('Mobile acquisition-flow smoke', () => {
  test('Search→Tool landing exposes product continuation CTAs', async ({ page }) => {
    await page.goto('/en/glasses-for-face-shape')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /face shape|detect/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /try-on|try on/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /compare/i }).first()).toBeVisible()
  })

  test('Detector page is reachable and upload surface is present', async ({ page }) => {
    await page.goto('/en/face-shape-detector')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('input[type="file"]').first()).toBeAttached()
  })

  test('Try-On, Compare, and Pricing routes load on mobile', async ({ page }) => {
    await page.goto('/en/try-on/glasses')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.goto('/en/try-on/glasses/compare')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.goto('/en/pricing')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
