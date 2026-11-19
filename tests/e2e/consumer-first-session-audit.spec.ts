/**
 * Consumer first-session UX forensic capture.
 * Renders actual Next.js/React components against deterministic test fixtures.
 * NO production DB, Stripe charge, paid AI provider, or third-party authentication.
 *
 * A screenshot is an observed mock-state UI, not a production conversion result.
 */
import { test, expect } from '@playwright/test'

const TASK_ID = 'consumer-ux-audit-locked-01'
const SCREEN_SIZES = [
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const

const basicResult = {
  faceShape: 'square',
  faceShapeDisplayName: 'Square Face',
  confidence: 0.89,
  summary: 'An angular jawline and broadly balanced face width suggest a square facial outline.',
  keyFeatures: ['Angular jawline', 'Broad cheek area', 'Balanced face proportions'],
  analysisSource: 'ai-assisted',
}
const baseTask = {
  id: TASK_ID,
  status: 'completed',
  detectedShape: 'square',
  confidence: 0.89,
  basicResult,
  createdAt: '2026-11-19T08:00:00.000Z',
  progress: 100,
  errorMessage: null,
}
const lockedTask = {
  success: true,
  data: {
    ...baseTask,
    reportUnlocked: false,
    userImageUrl: '',
    fullResult: null,
    lockedTeaser: {
      bestFrames: ['Round frames', 'Aviator frames'],
      framesToAvoid: ['Boxy square frames'],
      catalogRecommendedStyles: ['Round', 'Aviator'],
    },
  },
}
const unlockedTask = {
  success: true,
  data: {
    ...baseTask,
    reportUnlocked: true,
    userImageUrl: '/assets/face-analysis/model-face-square-report.jpg',
    lockedTeaser: null,
    fullResult: {
      ...basicResult,
      bestFrames: ['Round frames', 'Aviator frames', 'Oval frames', 'Browline frames'],
      framesToAvoid: ['Boxy square frames'],
      overview: {
        summary: 'Softer curves can balance strong facial angles.',
        strengths: ['Angular jawline', 'Balanced proportions', 'Distinctive facial outline'],
        disclaimer: 'Styling guidance is estimated from a single photo, not a medical measurement.',
      },
      geometry: { status: 'not_measured' },
      metrics: [],
      frameRecommendations: [
        { type: 'round', displayName: 'Round', score: 91, reason: 'Balances facial angles', stylingNote: 'Consider rounded rims.' },
        { type: 'aviator', displayName: 'Aviator', score: 88, reason: 'Softens geometric lines', stylingNote: 'Try lighter metal rims.' },
      ],
      avoidRecommendations: [
        { type: 'square', displayName: 'Square', score: 44, reason: 'May exaggerate facial angles', stylingNote: 'Try softer corners.' },
      ],
      styleTips: [
        { title: 'Frame shape', body: 'Explore rounded edges as a starting point.' },
        { title: 'Contrast', body: 'Test both thin metal and bolder acetate.' },
      ],
      tryOnGuidance: {
        topStyles: ['Round', 'Aviator', 'Oval', 'Browline'],
        note: 'Try these directions on your uploaded photo.',
      },
    },
  },
}
const userSession = (paid: boolean) => ({
  expires: '2099-01-01T00:00:00.000Z',
  user: {
    id: 'audit-fixture-user',
    name: 'Synthetic Shopper',
    email: 'shopper@example.test',
    role: 'USER',
    freeTrialsUsed: 1,
    creditsPurchased: paid ? 30 : 0,
    creditsUsed: 0,
    isPremium: false,
    isPremiumActive: false,
    remainingTrials: paid ? 30 : 0,
    premiumUsageCount: 0,
    premiumExpiresAt: null,
    currentSubscriptionType: null,
  },
})

test.beforeAll(() => {
  if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_MOCKS !== 'true' || process.env.TEST_MODE !== 'true') {
    throw new Error('Forensic capture requires NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true')
  }
  if (process.env.PLAYWRIGHT_BASE_URL) {
    const target = new URL(process.env.PLAYWRIGHT_BASE_URL)
    if (!['127.0.0.1', 'localhost'].includes(target.hostname)) {
      throw new Error('Forensic capture refuses remote production or Preview URL')
    }
  }
})

for (const size of SCREEN_SIZES) {
  test(`@consumer-audit ${size.name}: Detector upload and unauthenticated Advisor landing`, async ({ page }, testInfo) => {
    test.setTimeout(95000)
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.route('**/api/auth/session', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )
    await page.goto('/en/face-shape-detector', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('input[type=file]').first()).toBeAttached()
    await page.screenshot({ path: testInfo.outputPath('01-detector-upload-viewport.png') })
    await page.screenshot({ path: testInfo.outputPath('01-detector-upload-full.png'), fullPage: true })

    // Public, checked-in sample asset: no real customer portrait, no paid AI provider.
    await page.locator('input[type=file]').first()
      .setInputFiles('public/assets/face-analysis/model-face-square-report.jpg')
    let detectorOutcome = 'RESULT'
    try {
      await page.getByTestId('face-shape-result-summary').waitFor({ state: 'visible', timeout: 30000 })
    } catch {
      detectorOutcome = 'NO_RESULT_WITHIN_30S'
    }
    await page.screenshot({ path: testInfo.outputPath('02-detector-after-upload-viewport.png') })
    await page.screenshot({ path: testInfo.outputPath('02-detector-after-upload-full.png'), fullPage: true })
    await testInfo.attach('detector-outcome.json', {
      body: Buffer.from(JSON.stringify({
        outcome: detectorOutcome,
        title: await page.title(),
        source: 'VisuTry actual /en/face-shape-detector component',
        viewport: size,
        note: 'MediaPipe local/remote assets are not mocked; check screenshot for any runtime error.',
      }, null, 2)),
      contentType: 'application/json',
    })

    // Navigate using the actual continuation URL shape. Auth0 is deliberately NOT called.
    await page.goto(
      '/en/face-analysis?source=free-face-shape-detector&faceShape=square&photoHandoff=synthetic-handoff',
      { waitUntil: 'domcontentloaded' },
    )
    await expect(page.locator('body')).toContainText(/Face Analysis|Face Shape|Glasses Advisor/i)
    const signInCta = page.getByRole('button', { name: /get personalized advice/i })
    await expect(signInCta).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('03-advisor-guest-viewport.png') })
    await page.screenshot({ path: testInfo.outputPath('03-advisor-guest-full.png'), fullPage: true })
    await testInfo.attach('guest-cta.json', {
      body: Buffer.from(JSON.stringify({
        secondCtaVisible: await signInCta.isVisible(),
        source: 'Actual unauthenticated FaceAnalysisGate and FaceAnalysisLanding',
        note: 'This screenshot proves the extra CTA, not a measured conversion loss.',
      }, null, 2)),
      contentType: 'application/json',
    })
  })

  test(`@consumer-audit ${size.name}: locked report then contextual $2.99 paywall`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.route('**/api/auth/session', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(userSession(false)) }),
    )
    await page.route(`**/api/face-analysis/${TASK_ID}`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lockedTask) }),
    )
    await page.goto(`/en/face-analysis?taskId=${TASK_ID}`, { waitUntil: 'domcontentloaded' })
    const unlock = page.getByRole('link', { name: /Unlock This Report/ })
    await expect(unlock).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('04-locked-report-viewport.png') })
    await page.screenshot({ path: testInfo.outputPath('04-locked-report-full.png'), fullPage: true })
    await unlock.click()
    const dialog = page.getByRole('dialog', { name: 'Unlock your full eyewear report' })
    await expect(dialog).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('05-paywall-viewport.png') })
    await page.screenshot({ path: testInfo.outputPath('05-paywall-full.png'), fullPage: true })
    await expect(dialog.getByRole('button', { name: /Unlock for \$2\.99/ })).toBeEnabled()
  })

  test(`@consumer-audit ${size.name}: server-unlocked report and next Try-On step`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.route('**/api/auth/session', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(userSession(true)) }),
    )
    await page.route(`**/api/face-analysis/${TASK_ID}`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(unlockedTask) }),
    )
    // Top picks recovery reads are allowed only as mocked, empty test state.
    await page.route('**/api/face-analysis/top-picks-try-on/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }),
    )
    await page.goto(`/en/face-analysis?taskId=${TASK_ID}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Frames to Wear/i })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('06-unlocked-report-viewport.png') })
    await page.screenshot({ path: testInfo.outputPath('06-unlocked-report-full.png'), fullPage: true })
    // Merely inspect downstream CTA; do NOT submit any model generation.
    const button = page.getByRole('button', { name: /Try top picks on your photo/i })
    await expect(button).toBeVisible()
    await testInfo.attach('paid-followup.json', {
      body: Buffer.from(JSON.stringify({
        source: 'Actual unlocked FaceAnalysisResult with synthetic server-verified task fixture',
        tryOnCtaVisible: await button.isVisible(),
        purchasePerformed: false,
        aiGenerationPerformed: false,
      }, null, 2)),
      contentType: 'application/json',
    })
  })
}
