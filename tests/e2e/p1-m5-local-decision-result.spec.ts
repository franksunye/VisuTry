import { expect, test } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const isLocalDecisionResultRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_M5_LOCAL_DECISION_RESULT_E2E === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

test.describe('P1-M5 Local canonical Decision Result', () => {
  test('survives a clean cross-device browser context through the QR result URL', async ({ page, request, browser }) => {
    test.skip(!isLocalDecisionResultRun, 'Run against the guarded Local PostgreSQL environment.')

    const evidenceDir = '/tmp/visutry-p1-m5-decision-result'
    mkdirSync(evidenceDir, { recursive: true })
    const browserErrors: string[] = []
    const serverErrors: string[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
    page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`) })

    const sessionResponse = await request.post('/api/store/sessions', {
      data: { merchantSlug: 'local-qa-pilot', locale: 'en', deviceType: 'desktop' },
    })
    test.skip(sessionResponse.status() === 404, 'Run the Local Live Pulse E2E first to provision local-qa-pilot.')
    expect(sessionResponse.status()).toBe(200)
    const sessionPayload = await sessionResponse.json() as { data: { merchantSessionId: string } }
    const merchantSessionId = sessionPayload.data.merchantSessionId

    const photoResponse = await request.post('/api/store/sessions/photo', {
      multipart: {
        merchantSlug: 'local-qa-pilot',
        merchantSessionId,
        locale: 'en',
        deviceType: 'desktop',
        photo: {
          name: 'local-decision-result-shopper.jpg',
          mimeType: 'image/jpeg',
          buffer: readFileSync('public/home/Sophia-try-on-glasses-screen.jpg'),
        },
      },
    })
    expect(photoResponse.status()).toBe(200)

    const recommendationResponse = await request.post('/api/store/sessions/recommend', {
      data: {
        merchantSlug: 'local-qa-pilot',
        merchantSessionId,
        measuredShape: 'oval',
        faceAspectRatio: 1.2,
        geometryAnalysis: { status: 'measured', measuredShape: 'oval', measuredConfidence: 0.9, qualityScore: 90 },
        locale: 'en',
        deviceType: 'desktop',
        clientActionId: `p1-m5:${Date.now()}`,
      },
    })
    expect(recommendationResponse.status()).toBe(200)
    const recommendationPayload = await recommendationResponse.json() as { data: { frames: Array<{ id: string }>; decisionResult?: { token: string } } }
    const token = recommendationPayload.data.decisionResult?.token
    expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    const frameId = recommendationPayload.data.frames[0]?.id
    expect(frameId).toBeTruthy()

    const selectionResponse = await request.post('/api/store/sessions/select-frames', {
      data: { merchantSlug: 'local-qa-pilot', merchantSessionId, frameIds: [frameId], locale: 'en', deviceType: 'desktop', clientActionId: `p1-m5-select:${Date.now()}` },
    })
    expect(selectionResponse.status()).toBe(200)

    const tryOnResponse = await request.post('/api/store/sessions/try-on', {
      data: {
        merchantSlug: 'local-qa-pilot',
        merchantSessionId,
        merchantFrameId: frameId,
        batchId: `p1-m5-batch:${Date.now()}`,
        clientSubmissionId: `p1-m5-submit:${Date.now()}`,
        locale: 'en',
        deviceType: 'desktop',
      },
    })
    expect(tryOnResponse.status()).toBe(200)
    const tryOnPayload = await tryOnResponse.json() as { data: { taskId: string; status: string } }
    expect(tryOnPayload.data.status.toLowerCase()).toBe('completed')

    const pollResponse = await request.post('/api/store/sessions/try-on/poll', {
      data: { merchantSlug: 'local-qa-pilot', merchantSessionId, taskId: tryOnPayload.data.taskId, locale: 'en', deviceType: 'desktop' },
    })
    expect(pollResponse.status()).toBe(200)
    const pollPayload = await pollResponse.json() as { data: { status: string } }
    expect(pollPayload.data.status.toLowerCase()).toBe('completed')

    const resultApiResponse = await request.get(`/api/store/results/${token}`)
    expect(resultApiResponse.status()).toBe(200)
    const resultJson = await resultApiResponse.json() as { data: { merchant: { name: string }; recommendation: unknown; selectedFrameIds: string[]; tryOnResults: Array<{ imageUrl: string; assetRef: string }> } }
    expect(resultJson.data.merchant.name).toBeTruthy()
    expect(resultJson.data.recommendation).toBeTruthy()
    expect(resultJson.data.selectedFrameIds).toContain(frameId)
    expect(resultJson.data.tryOnResults).toHaveLength(1)
    const resultAssetResponse = await request.get(resultJson.data.tryOnResults[0].imageUrl)
    expect(resultAssetResponse.status()).toBe(200)
    expect(resultAssetResponse.headers()['content-type']).toMatch(/^image\//)
    expect(JSON.stringify(resultJson)).not.toContain('userImageUrl')
    expect(JSON.stringify(resultJson)).not.toContain('data:image')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/en/result/${token}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1, name: /result/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /curated shortlist/i })).toBeVisible()
    await expect(page.getByText(/canonical result/i).first()).toBeVisible()
    await page.screenshot({ path: `${evidenceDir}/result-desktop.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    const cleanContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const cleanPage = await cleanContext.newPage()
    const cleanErrors: string[] = []
    cleanPage.on('pageerror', (error) => cleanErrors.push(error.message))
    cleanPage.on('console', (message) => { if (message.type() === 'error') cleanErrors.push(message.text()) })
    await cleanPage.goto(`/en/result/${token}`, { waitUntil: 'networkidle' })
    await expect(cleanPage.getByRole('heading', { level: 1, name: /result/i })).toBeVisible()
    const completedTryOn = cleanPage.locator('img[src*="/api/store/results/"]')
    await expect(completedTryOn).toBeVisible()
    await expect.poll(() => completedTryOn.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    await expect(cleanPage.getByText(/No session storage is required/i)).toBeVisible()
    await expect(cleanPage.getByRole('img', { name: /scan to open/i })).toBeVisible()
    await cleanPage.screenshot({ path: `${evidenceDir}/result-mobile-clean-context.png`, fullPage: true })
    expect(await cleanPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(cleanErrors).toEqual([])
    await cleanContext.close()

    // Reuse the same MerchantSession for a new photo/recommendation cycle.
    // The old bearer link must be revoked, and no prior downstream state may
    // be present in the new canonical Result.
    const nextPhotoResponse = await request.post('/api/store/sessions/photo', {
      multipart: {
        merchantSlug: 'local-qa-pilot',
        merchantSessionId,
        locale: 'en',
        deviceType: 'desktop',
        photo: {
          name: 'local-decision-result-shopper-b.jpg',
          mimeType: 'image/jpeg',
          buffer: readFileSync('public/home/Ethan-try-on-glasses-screen.jpg'),
        },
      },
    })
    expect(nextPhotoResponse.status()).toBe(200)
    const nextRecommendationResponse = await request.post('/api/store/sessions/recommend', {
      data: {
        merchantSlug: 'local-qa-pilot',
        merchantSessionId,
        measuredShape: 'round',
        faceAspectRatio: 1.05,
        geometryAnalysis: { status: 'measured', measuredShape: 'round', measuredConfidence: 0.82, qualityScore: 84 },
        locale: 'en',
        deviceType: 'desktop',
        clientActionId: `p1-m5-cycle-b:${Date.now()}`,
      },
    })
    expect(nextRecommendationResponse.status()).toBe(200)
    const nextRecommendationPayload = await nextRecommendationResponse.json() as { data: { decisionResult?: { token: string } } }
    const nextToken = nextRecommendationPayload.data.decisionResult?.token
    expect(nextToken).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    expect(nextToken).not.toBe(token)
    expect((await request.get(`/api/store/results/${token}`)).status()).toBe(404)
    const nextResultResponse = await request.get(`/api/store/results/${nextToken}`)
    expect(nextResultResponse.status()).toBe(200)
    const nextResult = await nextResultResponse.json() as { data: { faceFit: { faceShape: string }; selectedFrameIds: string[]; favoriteFrameIds: string[]; compare: unknown; tryOnResults: unknown[] } }
    expect(nextResult.data.faceFit.faceShape).toBe('round')
    expect(nextResult.data.selectedFrameIds).toEqual([])
    expect(nextResult.data.favoriteFrameIds).toEqual([])
    expect(nextResult.data.compare).toBeNull()
    expect(nextResult.data.tryOnResults).toEqual([])

    expect(await request.get(`/api/store/results/${token}tampered`).then((response) => response.status())).toBe(404)
    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
  })
})
