import { test, expect } from '@playwright/test'

const TASK_ID = 'e2e-forensic-task-1'
const captureKey = 'visutry-paywall-e2e-capture'

function assertRevenueTestIsolation() {
  if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_MOCKS !== 'true' || process.env.TEST_MODE !== 'true') {
    throw new Error('Revenue Critical E2E requires NODE_ENV=test, ENABLE_MOCKS=true, and TEST_MODE=true')
  }

  const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL
  if (!configuredBaseUrl) return

  const baseUrl = new URL(configuredBaseUrl)
  if (!['127.0.0.1', 'localhost'].includes(baseUrl.hostname) || !['3001', '3002'].includes(baseUrl.port)) {
    throw new Error(`Revenue Critical E2E refuses non-local base URL: ${configuredBaseUrl}`)
  }
}

test.beforeAll(() => {
  assertRevenueTestIsolation()
})

const sessionFixture = {
  expires: '2099-01-01T00:00:00.000Z',
  user: {
    id: 'e2e-forensic-user',
    name: 'Forensic User',
    email: 'forensic@example.test',
    image: null,
    role: 'USER',
    freeTrialsUsed: 1,
    creditsPurchased: 0,
    creditsUsed: 0,
    isPremium: false,
    isPremiumActive: false,
    remainingTrials: 0,
    premiumUsageCount: 0,
    premiumExpiresAt: null,
    currentSubscriptionType: null,
  },
}

const taskFixture = {
  success: true,
  data: {
    id: TASK_ID,
    status: 'completed',
    userImageUrl: '',
    detectedShape: 'oval',
    confidence: 0.92,
    basicResult: {
      faceShape: 'oval',
      faceShapeDisplayName: 'Oval Face',
      confidence: 0.92,
      summary: 'A balanced face shape.',
      keyFeatures: ['Balanced proportions', 'Soft jawline'],
    },
    fullResult: null,
    lockedTeaser: {
      bestFrames: ['Round frames', 'Aviator frames'],
      framesToAvoid: ['Very narrow frames'],
    },
    reportUnlocked: false,
    createdAt: '2026-08-21T00:00:00.000Z',
    progress: 100,
  },
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    const state = JSON.parse(localStorage.getItem(key) || '{"events":[]}')
    const save = () => localStorage.setItem(key, JSON.stringify(state))
    const capture = (value: unknown) => {
      const eventArgs = Array.isArray(value)
        ? value
        : value && typeof value === 'object' && 'length' in value
          ? Array.from(value as ArrayLike<unknown>)
          : null
      if (eventArgs?.[0] === 'event') state.events.push(eventArgs)
      if (value && typeof value === 'object' && (value as { event?: string }).event) state.events.push(value)
      save()
    }

    window.dataLayer = window.dataLayer || []
    const originalPush = window.dataLayer.push.bind(window.dataLayer)
    window.dataLayer.push = (...values) => {
      values.forEach(capture)
      return originalPush(...values)
    }
    save()
  }, captureKey)

  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessionFixture) })
  })
  await page.route(`**/api/face-analysis/${TASK_ID}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taskFixture) })
  })
})

test('@critical @revenue-critical real locked report CTA opens paywall and starts checkout', async ({ page }, testInfo) => {
  let createSessionBody: Record<string, unknown> | null = null
  let createSessionCount = 0
  const analyticsConsoleEvents: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('purchase_intent_clicked') || message.text().includes('begin_checkout')) {
      analyticsConsoleEvents.push(message.text())
    }
  })

  await page.route('**/api/payment/create-session', async (route) => {
    createSessionCount += 1
    createSessionBody = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: 'cs_mock_e2e',
          url: `${new URL(page.url()).origin}/mock/checkout/cs_mock_e2e`,
        },
      }),
    })
  })

  await page.goto(`/en/face-analysis?taskId=${TASK_ID}`, { waitUntil: 'domcontentloaded' })
  const reportCta = page.getByRole('link', { name: /Unlock This Report/ })
  await expect(reportCta).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('locked-report-before-paywall.png') })

  await reportCta.click()
  const dialog = page.getByRole('dialog', { name: 'Unlock your full eyewear report' })
  await expect(dialog).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('paywall-open.png') })

  if (testInfo.project.name.endsWith('mobile')) {
    await dialog.press('PageDown')
  }

  const button = dialog.getByRole('button', { name: 'Unlock for $2.99' })
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()

  const geometry = await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="conversion-paywall-overlay"]')
    const button = Array.from(overlay?.querySelectorAll('button') || []).find((node) => /Unlock for/.test(node.textContent || ''))
    const boundary = overlay?.previousElementSibling as (HTMLElement & { inert?: boolean }) | undefined
    const rect = button?.getBoundingClientRect()
    const hit = rect ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null
    return {
      viewport: { width: innerWidth, height: innerHeight },
      enabled: !!button && !button.disabled,
      focusable: !!button && button.tabIndex >= 0,
      pointerEvents: button ? getComputedStyle(button).pointerEvents : null,
      opacity: button ? getComputedStyle(button).opacity : null,
      inViewport: !!rect && rect.top >= 0 && rect.bottom <= innerHeight,
      hitSameButton: hit === button,
      boundaryInert: boundary?.inert === true,
      bodyOverflow: getComputedStyle(document.body).overflow,
    }
  })

  expect(geometry).toMatchObject({
    enabled: true,
    focusable: true,
    pointerEvents: 'auto',
    opacity: '1',
    inViewport: true,
    hitSameButton: true,
    boundaryInert: true,
    bodyOverflow: 'hidden',
  })

  await Promise.all([
    page.waitForURL(/\/mock\/checkout\/cs_mock_e2e/),
    button.click(),
  ])
  await expect.poll(() => createSessionCount).toBe(1)
  expect(createSessionBody).toEqual(expect.objectContaining({
    productType: 'CREDITS_PACK',
    unlockTaskId: TASK_ID,
    locale: 'en',
  }))
  const submittedBody = createSessionBody as unknown as Record<string, unknown>
  expect(String(submittedBody.successUrl)).toContain(`conversion_task_id=${TASK_ID}`)
  expect(String(submittedBody.cancelUrl)).toContain(`conversion_task_id=${TASK_ID}`)

  expect(analyticsConsoleEvents.some((event) => event.includes('purchase_intent_clicked'))).toBe(true)
  expect(analyticsConsoleEvents.some((event) => event.includes('begin_checkout'))).toBe(true)
})
