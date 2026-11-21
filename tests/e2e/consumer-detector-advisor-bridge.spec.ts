import { expect, test } from '@playwright/test'

const mockUser = {
  expires: '2099-01-01T00:00:00.000Z',
  user: {
    id: 'consumer-bridge-qa-user', name: 'QA Shopper', email: 'shopper@example.test', role: 'USER',
    freeTrialsUsed: 0, creditsPurchased: 0, creditsUsed: 0, isPremium: false,
    isPremiumActive: false, remainingTrials: 1, premiumUsageCount: 0, currentSubscriptionType: null,
  },
}

test.beforeAll(() => {
  if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_MOCKS !== 'true' || process.env.TEST_MODE !== 'true') {
    throw new Error('Isolated Mock browser tests only')
  }
  if (process.env.PLAYWRIGHT_BASE_URL && !/^http:\/\/(127\.0\.0\.1|localhost):300[12]\/?/.test(process.env.PLAYWRIGHT_BASE_URL)) {
    throw new Error('Refuse remote/production Playwright URL')
  }
})

for (const viewport of [
  { width: 430, height: 932, label: 'mobile-430' },
  { width: 390, height: 844, label: 'mobile-390' },
  { width: 1440, height: 900, label: 'desktop' },
]) {
  test(`@consumer-bridge ${viewport.label}: guest continues with face context, not generic SEO landing`, async ({ page }, info) => {
    await page.setViewportSize(viewport)
    await page.route('**/api/auth/session', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )
    await page.goto(
      '/en/face-analysis?source=free-face-shape-detector&faceShape=round&photoHandoff=qa-handoff',
      { waitUntil: 'domcontentloaded' },
    )
    const surface = page.getByTestId('detector-advisor-continuation')
    await expect(surface).toBeVisible()
    await expect(surface.getByText(/Round face/)).toBeVisible()
    await expect(surface.getByText(/held temporarily in this browser/)).toBeVisible()
    const signIn = page.getByRole('button', { name: /Sign in and continue with my result/ })
    await expect(signIn).toBeVisible()
    const rect = await signIn.boundingBox()
    expect(rect).not.toBeNull()
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)

    await page.screenshot({ path: info.outputPath(`01-contextual-${viewport.label}.png`) })
    await page.screenshot({ path: info.outputPath(`01-contextual-${viewport.label}-full.png`), fullPage: true })

    await page.goto('/en/face-analysis', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('detector-advisor-continuation')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /AI Glasses Advisor for a Better Frame Shortlist/i })).toBeVisible()
  })
}

test('@consumer-bridge 430: guest context does not consume photo; login return restores it once', async ({ page }, info) => {
  await page.setViewportSize({ width: 430, height: 932 })
  let signedIn = false
  await page.route('**/api/auth/session', route =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: signedIn ? JSON.stringify(mockUser) : '{}',
    }),
  )
  const token = 'consumer-bridge-synthetic-handoff'
  await page.goto(
    `/en/face-analysis?source=free-face-shape-detector&faceShape=oval&photoHandoff=${token}`,
    { waitUntil: 'domcontentloaded' },
  )
  await expect(page.getByTestId('detector-advisor-continuation')).toBeVisible()
  await page.evaluate(async (handoffId) => {
    const response = await fetch('/assets/face-analysis/model-face-square-report.jpg')
    if (!response.ok) throw new Error('Synthetic photo fixture unavailable')
    const blob = await response.blob()
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('visutry-local-handoffs', 1)
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains('face-analysis-photos')) {
          open.result.createObjectStore('face-analysis-photos', { keyPath: 'id' })
        }
      }
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result
        const tx = db.transaction('face-analysis-photos', 'readwrite')
        tx.objectStore('face-analysis-photos').put({
          id: handoffId,
          blob, name: 'synthetic.jpg', type: 'image/jpeg',
          lastModified: Date.now(), expiresAt: Date.now() + 30 * 60 * 1000,
        })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); reject(tx.error) }
      }
    })
  }, token)

  const recordExists = async () => await page.evaluate(async (handoffId) => {
    return new Promise<boolean>((resolve, reject) => {
      const request = indexedDB.open('visutry-local-handoffs', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('face-analysis-photos', 'readonly')
        const value = tx.objectStore('face-analysis-photos').get(handoffId)
        value.onsuccess = () => { resolve(Boolean(value.result)); db.close() }
        value.onerror = () => { reject(value.error); db.close() }
      }
    })
  }, token)
  expect(await recordExists()).toBe(true)

  signedIn = true
  await page.reload({ waitUntil: 'domcontentloaded' })
  const photo = page.locator('img[src^="blob:"]').first()
  await expect(photo).toBeVisible({ timeout: 17000 })
  await expect(page.getByRole('button', { name: /Analyze My Face/ })).toBeEnabled()
  await expect.poll(() => new URL(page.url()).searchParams.has('photoHandoff')).toBe(false)
  expect(await recordExists()).toBe(false)
  await page.screenshot({ path: info.outputPath('02-advisor-photo-restored-after-bridge.png') })
})

test('@consumer-bridge: ES and malformed source never receive English-only continuation', async ({ page }) => {
  await page.route('**/api/auth/session', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  )
  for (const href of [
    '/en/face-analysis?source=free-face-shape-detector&faceShape=spoof',
    '/en/face-analysis?source=unknown&faceShape=round',
    '/es/face-analysis?source=free-face-shape-detector&faceShape=round',
  ]) {
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('detector-advisor-continuation')).toHaveCount(0)
  }
})
