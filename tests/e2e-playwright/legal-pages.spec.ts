import { test, expect } from '@playwright/test'

test.describe('Legal Pages', () => {
  test('Privacy Policy page should load correctly', async ({ page }) => {
    await page.goto('/privacy')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Privacy Policy')
    
    // Check for key sections
    await expect(page.locator('text=Introduction')).toBeVisible()
    await expect(page.locator('text=Information We Collect')).toBeVisible()
    await expect(page.locator('text=Third-Party Services')).toBeVisible()
    
    // Check back link
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible()
  })

  test('Terms of Service page should load correctly', async ({ page }) => {
    await page.goto('/terms')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Terms of Service')
    
    // Check for key sections
    await expect(page.locator('text=Agreement to Terms')).toBeVisible()
    await expect(page.locator('text=Service Description')).toBeVisible()
    await expect(page.locator('text=User Responsibilities')).toBeVisible()
    
    // Check back link
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible()
  })

  test('Refund Policy page should load correctly', async ({ page }) => {
    await page.goto('/refund')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Refund Policy')
    
    // Check for key sections
    await expect(page.locator('text=Overview')).toBeVisible()
    await expect(page.locator('text=Subscription Refunds')).toBeVisible()
    await expect(page.locator('text=Cancellation')).toBeVisible()
    
    // Check back link
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible()
  })

  test('Footer should be visible on all pages', async ({ page }) => {
    const pages = ['/', '/pricing', '/privacy', '/terms', '/refund']
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      
      // Check footer is visible
      await expect(page.locator('footer')).toBeVisible()
      
      // Check footer links
      await expect(page.locator('footer a:has-text("Privacy Policy")')).toBeVisible()
      await expect(page.locator('footer a:has-text("Terms of Service")')).toBeVisible()
      await expect(page.locator('footer a:has-text("Refund Policy")')).toBeVisible()
    }
  })

  test('Footer links should navigate correctly', async ({ page }) => {
    await page.goto('/')
    
    // Click Privacy Policy link
    await page.locator('footer a:has-text("Privacy Policy")').click()
    await expect(page).toHaveURL(/.*privacy/)
    await expect(page.locator('h1')).toContainText('Privacy Policy')
    
    // Go back and click Terms link
    await page.goto('/')
    await page.locator('footer a:has-text("Terms of Service")').click()
    await expect(page).toHaveURL(/.*terms/)
    await expect(page.locator('h1')).toContainText('Terms of Service')
    
    // Go back and click Refund link
    await page.goto('/')
    await page.locator('footer a:has-text("Refund Policy")').click()
    await expect(page).toHaveURL(/.*refund/)
    await expect(page.locator('h1')).toContainText('Refund Policy')
  })

  test('Pricing page should show legal links', async ({ page }) => {
    await page.goto('/pricing')
    
    // Check for legal notice
    await expect(page.locator('text=By subscribing, you agree to our')).toBeVisible()
    
    // Check legal links are present
    await expect(page.locator('a:has-text("Terms of Service")')).toBeVisible()
    await expect(page.locator('a:has-text("Privacy Policy")')).toBeVisible()
    await expect(page.locator('a:has-text("Refund Policy")')).toBeVisible()
  })

  test('Legal pages should have proper SEO metadata', async ({ page }) => {
    // Privacy page
    await page.goto('/privacy')
    const privacyTitle = await page.title()
    expect(privacyTitle).toContain('Privacy Policy')
    
    // Terms page
    await page.goto('/terms')
    const termsTitle = await page.title()
    expect(termsTitle).toContain('Terms of Service')
    
    // Refund page
    await page.goto('/refund')
    const refundTitle = await page.title()
    expect(refundTitle).toContain('Refund Policy')
  })

  test('Legal pages should be responsive', async ({ page }) => {
    const pages = ['/privacy', '/terms', '/refund']
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      
      // Check content is visible
      await expect(page.locator('h1')).toBeVisible()
      
      // Check footer is visible
      await expect(page.locator('footer')).toBeVisible()
    }
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      
      // Check content is visible
      await expect(page.locator('h1')).toBeVisible()
      
      // Check footer is visible
      await expect(page.locator('footer')).toBeVisible()
    }
  })
})

