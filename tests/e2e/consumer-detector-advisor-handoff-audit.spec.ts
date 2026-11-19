/**
 * Source-real in-browser journey: MediaPipe detector -> actual CTA click ->
 * guest Advisor -> mock Auth0 return -> IndexedDB photo restored ->
 * real analysis submit client flow with mocked API completion.
 * No real external AI, auth, payment or production writes.
 */
import { test, expect } from '@playwright/test'

test('@consumer-audit mobile-430: real Detector CTA preserves photo through mocked login and Advisor submit', async ({ page }, info) => {
  test.setTimeout(120000)
  if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_MOCKS !== 'true' || process.env.TEST_MODE !== 'true') {
    throw new Error('Must use isolated NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true')
  }

  await page.setViewportSize({ width: 430, height: 932 })
  let loggedIn = false
  let postedAnalysis = false
  const syntheticSession = {
    expires: '2099-01-01T00:00:00.000Z',
    user: {
      id: 'synthetic-advisor-handoff',
      name: 'Synthetic Shopper',
      email: 'synthetic-shopper@example.test',
      role: 'USER',
      freeTrialsUsed: 0,
      creditsPurchased: 0,
      creditsUsed: 0,
      isPremium: false,
      isPremiumActive: false,
      remainingTrials: 1,
      premiumUsageCount: 0,
      currentSubscriptionType: null,
    },
  }

  const completedTask = {
    id: 'audit-full-continuation-01',
    status: 'completed',
    detectedShape: 'round',
    confidence: 0.9,
    basicResult: {
      faceShape: 'round',
      faceShapeDisplayName: 'Round Face',
      confidence: 0.9,
      summary: 'Softer cheeks and curved jawline suggest a round outline.',
      keyFeatures: ['Rounded cheeks', 'Soft jawline', 'Balanced features'],
      analysisSource: 'ai-assisted',
    },
    userImageUrl: '',
    fullResult: null,
    lockedTeaser: { bestFrames: ['Rectangle', 'Browline'], framesToAvoid: ['Round frames'] },
    reportUnlocked: false,
    createdAt: '2026-11-19T08:00:00Z',
    progress: 100,
    errorMessage: null,
  }

  await page.route('**/api/auth/session', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: loggedIn ? JSON.stringify(syntheticSession) : '{}',
    }),
  )
  await page.route('**/api/face-analysis/submit', async route => {
    postedAnalysis = true
    if (route.request().method() !== 'POST') throw new Error('Expected analysis POST')
    const raw = route.request().postDataBuffer()
    if (!raw || raw.length < 1000 || !raw.toString('utf8').includes('userImage')) {
      throw new Error('Handoff photo missing from mock analysis POST')
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { status: 'completed', task: completedTask } }),
    })
  })
  await page.route('**/api/face-analysis/audit-full-continuation-01', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: completedTask }) }),
  )

  await page.goto('/en/face-shape-detector', { waitUntil: 'domcontentloaded' })
  await page.locator('input[type=file]').first()
    .setInputFiles('public/assets/face-analysis/model-face-square-report.jpg')

  await expect(page.getByTestId('face-shape-result-summary')).toBeVisible({ timeout: 40000 })
  const resultName = await page.getByTestId('face-shape-result-summary').locator('h3').first().innerText()
  await page.screenshot({ path: info.outputPath('07-detector-actual-result.png') })

  // Real React onClick must set the IndexedDB handoff and navigate.
  const continueButton = page.getByTestId('face-shape-result-summary')
    .getByRole('button', { name: /See frames that suit my face/i })
  await expect(continueButton).toBeVisible()
  await Promise.all([
    page.waitForURL(url => url.pathname.endsWith('/face-analysis') && url.searchParams.has('photoHandoff'), { timeout: 20000 }),
    continueButton.click(),
  ])
  const pendingId = new URL(page.url()).searchParams.get('photoHandoff')
  expect(pendingId).toBeTruthy()
  const inspectHandoff = async () => page.evaluate(async (token) => {
    return await new Promise<string>(resolve => {
      const request = indexedDB.open('visutry-local-handoffs', 1)
      request.onerror = () => resolve('open-error')
      request.onsuccess = () => {
        const db = request.result
        try {
          const tx = db.transaction('face-analysis-photos', 'readonly')
          const get = tx.objectStore('face-analysis-photos').get(token)
          get.onsuccess = () => { resolve(get.result ? 'present' : 'missing'); db.close() }
          get.onerror = () => { resolve('read-error'); db.close() }
        } catch {
          resolve('transaction-error')
          db.close()
        }
      }
    })
  }, pendingId || '')
  const handoffBeforeLogin = await inspectHandoff()
  console.log('HANDOFF_BEFORE_LOGIN', handoffBeforeLogin)
  expect(handoffBeforeLogin).toBe('present')
  await expect(page.getByRole('button', { name: /Get personalized advice/i })).toBeVisible()
  await page.screenshot({ path: info.outputPath('08-advisor-guest-after-real-click.png') })

  // Deliberately do NOT access Auth0. Simulate completed Auth0 callback using
  // an authenticated NextAuth session with the same browser origin and IndexedDB.
  loggedIn = true
  await page.reload({ waitUntil: 'domcontentloaded' })
  const restoredPhoto = page.locator('img[src^="blob:"]').first()
  try {
    await expect(restoredPhoto).toBeVisible({ timeout: 12000 })
  } catch (error) {
    const handoffAfterLogin = await inspectHandoff()
    console.log('HANDOFF_RESTORE_DIAGNOSTIC', JSON.stringify({
      handoffBeforeLogin,
      handoffAfterLogin,
      tokenStillInUrl: new URL(page.url()).searchParams.has('photoHandoff'),
      authenticatedWorkspaceVisible: await page.getByRole('button', { name: /Analyze My Face/i }).count() > 0,
    }))
    await page.screenshot({ path: info.outputPath('09-advisor-photo-restoration-failed.png') })
    throw error
  }
  await expect(page).toHaveURL(/face-analysis/)
  const imgDetails = await restoredPhoto.evaluate(img => ({
    naturalWidth: (img as HTMLImageElement).naturalWidth,
    naturalHeight: (img as HTMLImageElement).naturalHeight,
  }))
  expect(imgDetails.naturalWidth).toBeGreaterThan(10)
  await page.screenshot({ path: info.outputPath('09-advisor-photo-restored.png') })

  // Perform user's real Start Analysis click and intercept only the API boundary.
  const start = page.getByRole('button', { name: /Analyze My Face|Start Analysis|Analyze Photo/i })
  await expect(start).toBeVisible()
  await start.click()
  await expect.poll(() => postedAnalysis, { timeout: 25000 }).toBe(true)
  await expect(page.getByText('Your AI Face Shape Report')).toBeVisible({ timeout: 20000 })
  await page.screenshot({ path: info.outputPath('10-advisor-completed-locked-report.png') })

  await info.attach('real-continuation-contract.json', {
    body: Buffer.from(JSON.stringify({
      outcome: 'PASS',
      faceShape: resultName,
      photoHandoffSaved: Boolean(pendingId),
      photoRestoredNaturalWidth: imgDetails.naturalWidth,
      analysisPostObservedWithUserImage: postedAnalysis,
      chargedStripe: false,
      calledExternalAI: false,
      auth0Invoked: false,
      notes: 'Auth0 return and completed report are synthetic; everything before API request executes actual client code.',
    }, null, 2)),
    contentType: 'application/json',
  })
})
