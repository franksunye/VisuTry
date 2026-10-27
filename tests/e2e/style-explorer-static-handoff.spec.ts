import { expect, test } from '@playwright/test'

const signInLink = (page: import('@playwright/test').Page) =>
  // A prerendered Suspense fallback can remain in the DOM while hidden after
  // hydration; only the visible CTA reflects the live URL handoff context.
  page.locator('main:visible a[href^="/en/auth/signin?callbackUrl="]:visible').first()

test('Style Explorer anonymous entry serves its public marketing without a request-time render', async ({ page }) => {
  const response = await page.goto('/en/style-explorer')
  expect(response?.status()).toBe(200)
  await expect(page.locator('main h1')).toBeVisible()
  await expect(signInLink(page)).toHaveAttribute(
    'href', '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer',
  )
})

test('Face Analysis handoff survives hydration in sign-in callback URL', async ({ page }) => {
  const response = await page.goto('/en/style-explorer?source=face-analysis&taskId=analysis-1')
  expect(response?.status()).toBe(200)
  await expect(signInLink(page)).toHaveAttribute(
    'href',
    '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer%3Fsource%3Dface-analysis%26taskId%3Danalysis-1',
  )
})

test('ambiguous duplicate task IDs cannot be forwarded to sign-in', async ({ page }) => {
  const response = await page.goto('/en/style-explorer?source=face-analysis&taskId=a&taskId=b')
  expect(response?.status()).toBe(200)
  await expect(signInLink(page)).toHaveAttribute(
    'href', '/en/auth/signin?callbackUrl=%2Fen%2Fstyle-explorer',
  )
})
