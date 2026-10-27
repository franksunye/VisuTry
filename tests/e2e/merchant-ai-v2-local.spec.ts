import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { prisma } from '@/lib/prisma'

const localV2 = process.env.APP_ENV === 'local'
  && process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_M5_LOCAL_DECISION_RESULT_E2E === '1'
  && process.env.VISUTRY_DATABASE_IDENTITY === 'local:127.0.0.1:5439/visutry_local_container_e2e'
  && /^http:\/\/127\.0\.0\.1:3003$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

test.describe('M1b local v2 real Store API budget + browser contract', () => {
  test('Store settles twice; replay and Compare do not charge; Campaign shares the exhausted limit', async ({ page, request }) => {
    test.skip(!localV2, 'Run only in the isolated M1b container fixture with ENFORCE')
    test.setTimeout(180_000)
    const suffix = Date.now().toString(36)
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'ello-sunglasses' }, select: { id: true, entitlementVersion: true, pricingVersion: true },
    })
    expect(merchant?.entitlementVersion).toBe('v2')
    expect(merchant?.pricingVersion).toBe('v2-container-e2e')
    const merchantId = merchant!.id

    for (const path of ['/en/store/ello-sunglasses', '/en/c/ello-sunglasses/petite-fit']) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('body')).not.toContainText(/application error|internal server error/i)
    }

    const startSession = async (experienceSlug?: string) => {
      const created = await request.post('/api/store/sessions', {
        data: { merchantSlug: 'ello-sunglasses', ...(experienceSlug ? { experienceSlug } : {}), locale: 'en', deviceType: 'desktop' },
      })
      expect(created.status(), await created.text()).toBe(200)
      const payload = await created.json() as { data: { merchantSessionId: string } }
      const sessionId = payload.data.merchantSessionId
      const photo = await request.post('/api/store/sessions/photo', {
        multipart: {
          merchantSlug: 'ello-sunglasses', merchantSessionId: sessionId,
          locale: 'en', deviceType: 'desktop',
          photo: { name: 'm1b-synthetic-shopper.jpg', mimeType: 'image/jpeg', buffer: readFileSync('public/home/Sophia-try-on-glasses-screen.jpg') },
        },
      })
      expect(photo.status(), await photo.text()).toBe(200)
      const recommended = await request.post('/api/store/sessions/recommend', {
        data: {
          merchantSlug: 'ello-sunglasses', merchantSessionId: sessionId,
          measuredShape: 'oval', faceAspectRatio: 1.2,
          geometryAnalysis: { status: 'measured', measuredShape: 'oval', measuredConfidence: 0.9, qualityScore: 90 },
          locale: 'en', deviceType: 'desktop', clientActionId: `m1b-rec-${suffix}-${experienceSlug || 'store'}`,
        },
      })
      expect(recommended.status(), await recommended.text()).toBe(200)
      const reco = await recommended.json() as { data: { frames: Array<{ id: string }> } }
      const frames = reco.data.frames.slice(0, 2).map((f) => f.id)
      expect(frames.length).toBe(2)
      const selected = await request.post('/api/store/sessions/select-frames', {
        data: { merchantSlug: 'ello-sunglasses', merchantSessionId: sessionId,
          frameIds: frames, clientActionId: `m1b-select-${suffix}-${experienceSlug || 'store'}`,
          locale: 'en', deviceType: 'desktop' },
      })
      expect(selected.status(), await selected.text()).toBe(200)
      return { sessionId, frames }
    }

    const store = await startSession()
    const batchId = `m1b-local-batch-${suffix}`
    const submit = async (sessionId: string, frameId: string, clientSubmissionId: string, batch = batchId) => {
      return request.post('/api/store/sessions/try-on', {
        data: { merchantSlug: 'ello-sunglasses', merchantSessionId: sessionId,
          merchantFrameId: frameId, batchId: batch, clientSubmissionId,
          locale: 'en', deviceType: 'desktop' },
      })
    }
    const poll = async (sessionId: string, taskId: string) => {
      const res = await request.post('/api/store/sessions/try-on/poll', {
        data: { merchantSlug: 'ello-sunglasses', merchantSessionId: sessionId, taskId, locale: 'en', deviceType: 'desktop' },
      })
      expect(res.status(), await res.text()).toBe(200)
      return res.json() as Promise<{ data: { status: string } }>
    }

    const firstKey = `m1b-first-${suffix}`
    const first = await submit(store.sessionId, store.frames[0]!, firstKey)
    expect(first.status(), await first.text()).toBe(200)
    const firstTask = (await first.json() as { data: { taskId: string } }).data.taskId
    expect((await poll(store.sessionId, firstTask)).data.status.toUpperCase()).toBe('COMPLETED')

    // Same logical request: same task, no second provider/hold/ledger.
    const replay = await submit(store.sessionId, store.frames[0]!, firstKey)
    expect(replay.status(), await replay.text()).toBe(200)
    expect((await replay.json() as { data: { taskId: string } }).data.taskId).toBe(firstTask)

    const second = await submit(store.sessionId, store.frames[1]!, `m1b-second-${suffix}`)
    expect(second.status(), await second.text()).toBe(200)
    const secondTask = (await second.json() as { data: { taskId: string } }).data.taskId
    expect(secondTask).not.toBe(firstTask)
    expect((await poll(store.sessionId, secondTask)).data.status.toUpperCase()).toBe('COMPLETED')

    const beforeCompare = await prisma.merchantAiRenderReservation.count({ where: { merchantId } })
    const compared = await request.post('/api/store/sessions/compare', {
      data: { merchantSlug: 'ello-sunglasses', merchantSessionId: store.sessionId,
        frameIds: store.frames, clientActionId: `m1b-compare-${suffix}`, locale: 'en', deviceType: 'desktop' },
    })
    expect(compared.status(), await compared.text()).toBe(200)
    expect(await prisma.merchantAiRenderReservation.count({ where: { merchantId } })).toBe(beforeCompare)

    // Another Campaign session must be unable to exceed the SAME merchant
    // budget; it may still browse and use non-generative Recommendation.
    const campaign = await startSession('petite-fit')
    const denied = await submit(campaign.sessionId, campaign.frames[0]!, `m1b-denied-${suffix}`, `m1b-campaign-${suffix}`)
    expect(denied.status(), await denied.text()).toBe(429)
    const holds = await prisma.merchantAiRenderReservation.findMany({
      where: { merchantId }, select: { status: true, tryOnTaskId: true },
    })
    expect(holds).toHaveLength(2)
    expect(holds.every((hold) => hold.status === 'SETTLED' && Boolean(hold.tryOnTaskId))).toBe(true)
    expect(await prisma.merchantUsageLedger.count({
      where: { merchantId, kind: 'RENDER_SUCCESS' },
    })).toBe(2)
    expect(await prisma.merchantUsageLedger.count({
      where: { merchantId, kind: 'RENDER_ATTEMPT' },
    })).toBe(2)
    console.log(JSON.stringify({
      result: 'PASS', m1bLocalV2RealApi: true,
      storeSuccessfulRenders: 2, sameKeyReplayNoExtraTask: true,
      compareNoGeneration: true, campaignBudgetShared: true,
      noExternalProviderSpend: true,
    }))
  })
})
