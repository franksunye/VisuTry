/**
 * Release gate for the two bounded Consumer improvements:
 * - one-time Detector photo survives a signed-out -> mock-authenticated return;
 * - the unchanged $2.99 report-unlock checkout is visible without scrolling.
 *
 * Executes real Next.js React client pages in Chromium, with only synthetic
 * browser/session/API fixtures. No Auth0, paid AI, Stripe charge or prod DB.
 */
import { expect, test, type Page } from '@playwright/test'

const TASK_ID = 'consumer-first-session-fix-review-task'
const checkoutUrl = '/mock/checkout/consumer-first-session-test'

const freeSession = {
  expires: '2099-01-01T00:00:00.000Z',
  user: {
    id: 'consumer-fix-mock-user',
    name: 'Test Shopper',
    email: 'consumer-fix@example.test',
    role: 'USER',
    freeTrialsUsed: 0,
    creditsPurchased: 0,
    creditsUsed: 0,
    isPremium: false,
    isPremiumActive: false,
    remainingTrials: 1,
    premiumUsageCount: 0,
    premiumExpiresAt: null,
    currentSubscriptionType: null,
  },
}

const spentSession = {
  ...freeSession,
  user: { ...freeSession.user, freeTrialsUsed: 1, remainingTrials: 0 },
}

const paidSession = {
  ...spentSession,
  user: { ...spentSession.user, creditsPurchased: 30, remainingTrials: 30 },
}

const basicResult = {
  faceShape: 'oval',
  faceShapeDisplayName: 'Oval Face',
  confidence: 0.91,
  summary: 'Balanced proportions with a softly rounded jawline.',
  keyFeatures: ['Balanced forehead', 'Soft jawline', 'Even face proportions'],
  analysisSource: 'ai-assisted',
}
const commonTask = {
  id: TASK_ID,
  status: 'completed',
  userImageUrl: '',
  detectedShape: 'oval',
  confidence: 0.91,
  basicResult,
  createdAt: '2026-11-19T00:00:00Z',
  errorMessage: null,
  progress: 100,
}
const lockedTask = {
  success: true,
  data: {
    ...commonTask,
    reportUnlocked: false,
    fullResult: null,
    lockedTeaser: {
      bestFrames: ['Round', 'Aviator'],
      framesToAvoid: ['Very narrow'],
      catalogRecommendedStyles: ['round', 'aviator'],
    },
  },
}
const unlockedTask = {
  success: true,
  data: {
    ...commonTask,
    reportUnlocked: true,
    userImageUrl: '/assets/face-analysis/model-face-square-report.jpg',
    lockedTeaser: null,
    fullResult: {
      ...basicResult,
      bestFrames: ['Round', 'Aviator'],
      framesToAvoid: ['Very narrow'],
      catalogRecommendedStyles: ['round', 'aviator'],
      overview: {
        summary: 'Explore gentle curves and balanced bridge widths.',
        strengths: ['Balanced proportions', 'Soft jawline', 'Versatile frame options'],
      },
      metrics: [],
      frameRecommendations: [{ type: 'round', displayName: 'Round', score: 90, reason: 'Balanced outline', stylingNote: 'Try this shape.' }],
      avoidRecommendations: [{ type: 'square', displayName: 'Square', score: 40, reason: 'Less softening', stylingNote: 'Try another shape.' }],
      styleTips: [{ title: 'Explore contrast', body: 'Try rim widths that frame your features.' }],
      tryOnGuidance: { topStyles: ['Round', 'Aviator', 'Oval', 'Browline'], note: 'Try these directions on your photo.' },
    },
  },
}

function guardIsolation() {
  if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_MOCKS !== 'true' || process.env.TEST_MODE !== 'true') {
    throw new Error('Release E2E requires NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true')
  }
  if (process.env.PLAYWRIGHT_BASE_URL) {
    const url = new URL(process.env.PLAYWRIGHT_BASE_URL)
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      throw new Error('Release E2E refuses remote/production URL')
    }
  }
}

async function fakeSession(page: Page, session: typeof spentSession | null) {
  await page.route('**/api/auth/session', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: session ? JSON.stringify(session) : '{}',
    }),
  )
}

async function fakeTask(page: Page, unlocked = false) {
  await page.route(`**/api/face-analysis/${TASK_ID}`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(unlocked ? unlockedTask : lockedTask) }),
  )
}

test.beforeAll(guardIsolation)

test('@consumer-release 430x932: signed-out handoff restores the same image after Mock login', async ({ page }, info) => {
  test.setTimeout(75000)
  await page.setViewportSize({ width: 430, height: 932 })
  const token = 'consumer-fix-review-handoff'
  let signedIn = false
  await page.route('**/api/auth/session', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: signedIn ? JSON.stringify(freeSession) : '{}',
    }),
  )

  await page.goto(
    `/en/face-analysis?source=free-face-shape-detector&faceShape=oval&photoHandoff=${token}`,
    { waitUntil: 'domcontentloaded' },
  )
  await expect(page.getByTestId('detector-advisor-continuation')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in and continue with my result/i })).toBeVisible()

  // Seed exactly the same IndexedDB schema that the real free Detector uses.
  // Fetch a checked-in, non-customer sample photo from THIS mock web server.
  await page.evaluate(async (handoffId) => {
    const response = await fetch('/assets/face-analysis/model-face-square-report.jpg')
    if (!response.ok) throw new Error('Fixture portrait is not available')
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
          blob,
          name: 'synthetic-portrait.jpg',
          type: 'image/jpeg',
          lastModified: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000,
        })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); reject(tx.error) }
        tx.onabort = () => { db.close(); reject(tx.error) }
      }
    })
  }, token)

  // Simulate the SAME origin after an Auth0 callback. External Auth0 is never called.
  signedIn = true
  await page.reload({ waitUntil: 'domcontentloaded' })

  const photo = page.locator('img[src^="blob:"]').first()
  await expect(photo).toBeVisible({ timeout: 17000 })
  const naturalWidth = await photo.evaluate(el => (el as HTMLImageElement).naturalWidth)
  expect(naturalWidth).toBeGreaterThan(50)
  const analyzeButton = page.getByRole('button', { name: /analyze my face/i })
  await expect(analyzeButton).toBeEnabled()
  await expect.poll(() => new URL(page.url()).searchParams.has('photoHandoff')).toBe(false)
  await page.screenshot({ path: info.outputPath('01-restored-portrait-mobile-430.png') })
  await page.screenshot({ path: info.outputPath('01-restored-portrait-mobile-430-full.png'), fullPage: true })

  // Consumed means it cannot silently be restored again on refresh.
  const stillInIndexedDb = await page.evaluate(async (id) => {
    return new Promise<boolean>((resolve, reject) => {
      const open = indexedDB.open('visutry-local-handoffs', 1)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result
        const tx = db.transaction('face-analysis-photos', 'readonly')
        const get = tx.objectStore('face-analysis-photos').get(id)
        get.onsuccess = () => { resolve(Boolean(get.result)); db.close() }
        get.onerror = () => { reject(get.error); db.close() }
      }
    })
  }, token)
  expect(stillInIndexedDb).toBe(false)
  await info.attach('handoff-verification.json', {
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({
      actualNextJs: true,
      mockAuth: true,
      imageWidth: naturalWidth,
      tokenCleaned: true,
      idbConsumedExactlyOnce: true,
      paidAiCalled: false,
      productionDataWritten: false,
    }, null, 2)),
  })
})

for (const viewport of [
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const) {
  test(`@consumer-release ${viewport.name}: one $2.99 unlock visible at first fold and existing checkout works`, async ({ page }, info) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await fakeSession(page, spentSession)
    await fakeTask(page)

    let checkoutCount = 0
    let requestBody: Record<string, unknown> | null = null
    await page.route('**/api/payment/create-session', async route => {
      checkoutCount += 1
      requestBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { sessionId: 'cs_mock_consumer_review', url: `${new URL(page.url()).origin}${checkoutUrl}` },
        }),
      })
    })

    // The real checkout redirects off-site. Keep navigation local and synthetic:
    // middleware may add /en before the mock path, both forms are accepted.
    await page.route('**/mock/checkout/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body><h1>Mock Checkout</h1></body></html>',
      }),
    )

    await page.goto(`/en/face-analysis?taskId=${TASK_ID}`, { waitUntil: 'domcontentloaded' })
    const earlyOffer = page.getByTestId('face-analysis-primary-unlock')
    await expect(earlyOffer).toBeVisible()
    const unlock = earlyOffer.getByRole('link', { name: /Unlock This Report/ })
    await expect(unlock).toBeVisible()
    await expect(page.getByRole('link', { name: /Unlock This Report/ })).toHaveCount(1)
    const viewportResult = await unlock.evaluate((el, widthHeight) => {
      const box = el.getBoundingClientRect()
      return {
        top: box.top, bottom: box.bottom, viewportHeight: widthHeight.height,
        scrollY: window.scrollY,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }
    }, viewport)
    console.log('UNLOCK_FIRST_FOLD', viewport.name, JSON.stringify(viewportResult))
    expect(viewportResult.top).toBeGreaterThanOrEqual(0)
    expect(viewportResult.bottom).toBeLessThanOrEqual(viewport.height)
    expect(viewportResult.scrollY).toBe(0)
    expect(viewportResult.documentWidth).toBeLessThanOrEqual(viewport.width)

    await page.screenshot({ path: info.outputPath(`02-locked-${viewport.name}-viewport.png`) })
    await page.screenshot({ path: info.outputPath(`02-locked-${viewport.name}-full.png`), fullPage: true })
    await unlock.click()
    const paywall = page.getByRole('dialog', { name: 'Unlock your full eyewear report' })
    await expect(paywall).toBeVisible()
    const confirm = paywall.getByRole('button', { name: /Unlock for \$2\.99/ })
    await expect(confirm).toBeEnabled()
    await page.screenshot({ path: info.outputPath(`03-paywall-${viewport.name}.png`) })
    await Promise.all([page.waitForURL(url => url.pathname.endsWith(checkoutUrl)), confirm.click()])
    await expect(page.getByRole('heading', { name: 'Mock Checkout' })).toBeVisible()
    expect(checkoutCount).toBe(1)
    expect(requestBody).toEqual(expect.objectContaining({
      productType: 'CREDITS_PACK',
      unlockTaskId: TASK_ID,
      locale: 'en',
    }))
    await info.attach(`first-fold-${viewport.name}.json`, {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(viewportResult, null, 2)),
    })
  })
}

test('@consumer-release desktop: already unlocked report never shows an unlock offer', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await fakeSession(page, paidSession)
  await fakeTask(page, true)
  await page.route(/\/api\/face-analysis\/top-picks-try-on(\?|$)/, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }),
  )
  await page.goto(`/en/face-analysis?taskId=${TASK_ID}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Frames to Wear')).toBeVisible()
  await expect(page.getByTestId('face-analysis-primary-unlock')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /try top picks on your photo/i })).toBeEnabled()
  await page.screenshot({ path: info.outputPath('04-unlocked-no-paywall-desktop.png') })
})
