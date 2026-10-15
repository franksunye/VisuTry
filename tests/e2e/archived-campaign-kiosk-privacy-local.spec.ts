import { expect, test, type APIResponse, type BrowserContext, type Page, type Response } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import { prisma } from '@/lib/prisma'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const guardedLocalRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.ARCHIVED_CAMPAIGN_KIOSK_PRIVACY_E2E === '1'
  && /^local:127\.0\.0\.1:\d+\/[A-Za-z0-9_-]+$/.test(process.env.VISUTRY_DATABASE_IDENTITY || '')
  && /^http:\/\/127\.0\.0\.1:3\d{3}$/.test(baseUrl)

async function data<T>(response: APIResponse | Response, status: number, label: string): Promise<T> {
  const body = await response.json() as { success?: boolean; data?: T; error?: string; message?: string }
  expect(response.status(), `${label}: ${body.error || body.message || 'unexpected status'}`).toBe(status)
  expect(body.success, label).toBe(true)
  return body.data as T
}

type Shopper = { context: BrowserContext; page: Page; sessionId: string; photoAssetId: string; token: string }
type LegacyKioskSession = { context: BrowserContext; page: Page; sessionId: string; photoAssetId: string }

test('archived Campaign permits privacy reset for existing Kiosk and Result sessions only', async ({ page, browser }) => {
  test.setTimeout(360_000)
  test.skip(!guardedLocalRun, 'Requires a marked disposable Local PostgreSQL database, mock media, and loopback Chromium.')

  const evidenceDir = process.env.ARCHIVED_CAMPAIGN_KIOSK_EVIDENCE_DIR || '/tmp/visutry-archived-campaign-kiosk-privacy'
  mkdirSync(evidenceDir, { recursive: true })
  const merchant = await prisma.merchant.findUnique({ where: { slug: 'local-qa-pilot' }, select: { id: true, classification: true, slug: true } })
  expect(merchant).toMatchObject({ classification: 'TEST', slug: 'local-qa-pilot' })
  const merchantId = merchant!.id

  const csrf = await page.request.get('/api/auth/csrf').then((response) => response.json()) as { csrfToken: string }
  const login = await page.request.post('/api/auth/callback/mock-credentials', {
    form: { email: 'test@example.com', qaIdentity: 'existing', type: 'free', csrfToken: csrf.csrfToken, callbackUrl: '/en/merchant', json: 'true' },
  })
  expect(login.ok()).toBe(true)

  const runId = Date.now().toString(36)
  const sku = `ARCHIVED-KIOSK-${runId}`
  const catalogPath = `/api/merchant/${encodeURIComponent(merchantId)}/catalog`
  const imported = await data<{ ids: string[]; created: number; updated: number }>(await page.request.post(catalogPath, { data: { approved: true, frames: [{
    sku, name: 'Archived Kiosk Privacy Frame', brand: 'Local QA',
    imageUrl: '/assets/glasses-presets/large-round-classic.jpg',
    productUrl: `https://merchant.example.test/archived-kiosk-frame/${runId}`,
    price: 12900, currency: 'USD', shape: 'round', source: 'MANUAL', enrichmentStatus: 'NOT_REQUIRED',
  }] } }), 200, 'Create Local TEST frame')
  expect(imported).toMatchObject({ created: 1, updated: 0 })
  const catalog = await data<{ items: Array<{ id: string; sku: string | null; status: string; presentation: { state: string } }> }>(
    await page.request.get(`${catalogPath}?readiness=all&limit=100&search=${encodeURIComponent(sku)}`), 200, 'Read persisted TEST frame',
  )
  const persistedFrame = catalog.items.find((item) => item.sku === sku)
  expect(persistedFrame).toMatchObject({ status: 'ACTIVE', presentation: { state: 'READY' } })
  const frameId = persistedFrame?.id
  expect(frameId).toBeTruthy()

  const campaignsPath = `/api/merchant/${encodeURIComponent(merchantId)}/campaigns`
  const created = await data<{ id: string }>(await page.request.post(campaignsPath, {
    data: { name: `Archived Kiosk Privacy ${runId}`, headline: 'A local eyewear edit' },
  }), 201, 'Create TEST Campaign draft')
  const campaignPath = `${campaignsPath}/${encodeURIComponent(created.id)}`
  await data(await page.request.put(`${campaignPath}/products`, { data: { frameIds: [frameId] } }), 200, 'Select TEST frame')
  await data(await page.request.patch(campaignPath, { data: {
    journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
    deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 900 },
  } }), 200, 'Enable TEST Kiosk delivery')
  await data(await page.request.post(`${campaignPath}/publish`, { data: { approved: true } }), 200, 'Publish TEST Campaign')
  const campaign = await data<{ publicPath: string; status: string }>(await page.request.get(campaignPath), 200, 'Read TEST Campaign')
  expect(campaign.status).toBe('ACTIVE')
  const [, , , merchantSlug, campaignSlug] = new URL(campaign.publicPath, baseUrl).pathname.split('/')
  const shoppers: Shopper[] = []
  const legacyKioskSessions: LegacyKioskSession[] = []

  async function createKioskShopper(name: 'manual' | 'idle'): Promise<Shopper> {
    const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 900 } })
    const kiosk = await context.newPage()
    await kiosk.goto(`${campaign.publicPath}/kiosk`, { waitUntil: 'networkidle' })
    await expect(kiosk.getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
    const sessionResponse = kiosk.waitForResponse((response) => response.url().endsWith('/api/store/sessions') && response.request().method() === 'POST')
    await kiosk.getByRole('button', { name: /I understand.*continue/i }).click()
    const session = await data<{ merchantSessionId: string }>(await sessionResponse, 200, `Create ${name} Kiosk session`)
    // Exercise the real signed session/photo/recommendation HTTP routes with
    // this Chromium context's HttpOnly capability. The unrelated in-browser
    // MediaPipe analysis is not part of the archived-reset privacy boundary.
    await data(await kiosk.request.post('/api/store/sessions/photo', { multipart: {
      merchantSlug, merchantSessionId: session.merchantSessionId, locale: 'en', deviceType: 'desktop',
      photo: { name: `${name}-shopper.jpg`, mimeType: 'image/jpeg', buffer: readFileSync('public/home/Sophia-try-on-glasses-screen.jpg') },
    } }), 200, `${name} photo upload`)
    const recommendation = await data<{ decisionResult?: { token?: string } }>(await kiosk.request.post('/api/store/sessions/recommend', {
      data: { merchantSlug, merchantSessionId: session.merchantSessionId, geometryAnalysis: { status: 'unavailable' }, locale: 'en', deviceType: 'desktop' },
    }), 200, `${name} recommendation`)
    const token = recommendation.decisionResult?.token
    expect(token).toBeTruthy()
    await kiosk.evaluate(({ slug, experienceSlug }) => {
      sessionStorage.setItem(`vt_store_session:${slug}:${experienceSlug}`, 'private shopper state')
    }, { slug: merchantSlug, experienceSlug: campaignSlug })
    await kiosk.goto(`/en/result/${encodeURIComponent(token!)}?deliveryProfile=kiosk`, { waitUntil: 'networkidle' })
    await expect(kiosk.getByRole('heading', { level: 1, name: 'Your campaign shortlist' })).toBeVisible()
    await expect(kiosk.getByRole('button', { name: 'New shopper' })).toBeVisible()
    const sessionRead = await prisma.merchantSession.findUnique({ where: { id: session.merchantSessionId }, select: { experienceId: true, photoAssetId: true, status: true } })
    expect(sessionRead).toMatchObject({ experienceId: created.id, status: 'ACTIVE' })
    expect(sessionRead?.photoAssetId).toBeTruthy()
    const shopper = { context, page: kiosk, sessionId: session.merchantSessionId, photoAssetId: sessionRead!.photoAssetId!, token: token! }
    shoppers.push(shopper)
    await kiosk.screenshot({ path: `${evidenceDir}/${name}-before-archive.png`, fullPage: true })
    return shopper
  }

  async function createLegacyKioskSession(): Promise<LegacyKioskSession> {
    const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 900 } })
    const kiosk = await context.newPage()
    await kiosk.goto(`${campaign.publicPath}/kiosk`, { waitUntil: 'networkidle' })
    await expect(kiosk.getByRole('button', { name: /I understand.*continue/i })).toBeVisible()
    const sessionResponse = kiosk.waitForResponse((response) => response.url().endsWith('/api/store/sessions') && response.request().method() === 'POST')
    await kiosk.getByRole('button', { name: /I understand.*continue/i }).click()
    const session = await data<{ merchantSessionId: string }>(await sessionResponse, 200, 'Create legacy Kiosk session')
    await data(await kiosk.request.post('/api/store/sessions/photo', { multipart: {
      merchantSlug, merchantSessionId: session.merchantSessionId, locale: 'en', deviceType: 'desktop',
      photo: { name: 'legacy-kiosk-shopper.jpg', mimeType: 'image/jpeg', buffer: readFileSync('public/home/Sophia-try-on-glasses-screen.jpg') },
    } }), 200, 'Upload legacy Kiosk photo')
    await kiosk.evaluate(({ slug, experienceSlug }) => {
      sessionStorage.setItem(`vt_store_session:${slug}:${experienceSlug}`, 'legacy kiosk private state')
    }, { slug: merchantSlug, experienceSlug: campaignSlug })
    const sessionRead = await prisma.merchantSession.findUnique({ where: { id: session.merchantSessionId }, select: { experienceId: true, photoAssetId: true, status: true } })
    expect(sessionRead).toMatchObject({ experienceId: created.id, status: 'ACTIVE' })
    expect(sessionRead?.photoAssetId).toBeTruthy()
    await expect(kiosk.getByRole('button', { name: 'Start over and clear this shopper' })).toBeVisible()
    const legacy = { context, page: kiosk, sessionId: session.merchantSessionId, photoAssetId: sessionRead!.photoAssetId! }
    legacyKioskSessions.push(legacy)
    await kiosk.screenshot({ path: `${evidenceDir}/legacy-kiosk-before-archive.png`, fullPage: true })
    return legacy
  }

  try {
    const manual = await createKioskShopper('manual')
    const idle = await createKioskShopper('idle')
    const legacyKiosk = await createLegacyKioskSession()
    const phoneContext = await browser.newContext({ baseURL: baseUrl, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    try {
      const phone = await phoneContext.newPage()
      await phone.goto(`/en/result/${encodeURIComponent(manual.token)}`, { waitUntil: 'networkidle' })
      await expect(phone.getByRole('heading', { level: 1, name: 'Your campaign shortlist' })).toBeVisible()
      expect(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      expect((await phone.request.post(`/api/store/results/${encodeURIComponent(manual.token)}/kiosk-reset`)).status()).toBe(404)

      await data(await page.request.post(`${campaignPath}/archive`, { data: { confirmed: true } }), 200, 'Archive TEST Campaign')
      const before = await Promise.all([
        prisma.merchantSession.count({ where: { merchantId, experienceId: created.id } }),
        prisma.merchantEvent.count({ where: { merchantId, experienceId: created.id } }),
        prisma.merchantIntent.count({ where: { merchantId, experienceId: created.id } }),
        prisma.tryOnTask.count({ where: { merchantId, merchantSessionId: { in: shoppers.map((shopper) => shopper.sessionId) } } }),
        prisma.merchantUsageLedger.count({ where: { merchantId, merchantSessionId: { in: shoppers.map((shopper) => shopper.sessionId) } } }),
      ])
      expect((await page.request.post('/api/store/sessions', { data: { merchantSlug, experienceSlug: campaignSlug, locale: 'en' } })).status()).toBe(409)
      const unauthorized = await manual.page.request.post('/api/store/sessions/kiosk-reset', { data: {
        merchantSlug, experienceSlug: campaignSlug, merchantSessionId: idle.sessionId,
      } })
      expect(unauthorized.status()).toBe(403)

      const legacyReset = legacyKiosk.page.waitForResponse((response) => response.url().endsWith('/api/store/sessions/kiosk-reset') && response.request().method() === 'POST')
      await legacyKiosk.page.getByRole('button', { name: 'Start over and clear this shopper' }).click()
      expect((await legacyReset).status()).toBe(200)
      await expect(legacyKiosk.page).toHaveURL(new RegExp(`/en/c/${merchantSlug}/${campaignSlug}/kiosk\\?kioskReset=`))
      await expect(legacyKiosk.page.getByRole('status')).toContainText('Campaign ended')
      await expect(legacyKiosk.page.getByRole('button', { name: 'I understand and continue' })).toHaveCount(0)
      await legacyKiosk.page.screenshot({ path: `${evidenceDir}/archived-kiosk-session-route-cleared.png`, fullPage: true })

      await manual.page.reload({ waitUntil: 'networkidle' })
      await expect(manual.page.getByRole('button', { name: 'Clear this shopper' })).toBeVisible()
      await manual.page.screenshot({ path: `${evidenceDir}/archived-kiosk-manual-before-clear.png`, fullPage: true })
      const manualReset = manual.page.waitForResponse((response) => response.url().includes(`/api/store/results/${encodeURIComponent(manual.token)}/kiosk-reset`) && response.request().method() === 'POST')
      await manual.page.getByRole('button', { name: 'Clear this shopper' }).click()
      expect((await manualReset).status()).toBe(200)
      await expect(manual.page).toHaveURL(new RegExp(`/en/c/${merchantSlug}/${campaignSlug}\\?`))
      await expect(manual.page.getByRole('status')).toContainText('Campaign ended')
      await expect(manual.page.getByRole('heading', { name: 'Your campaign shortlist' })).toHaveCount(0)
      await manual.page.screenshot({ path: `${evidenceDir}/archived-kiosk-manual-cleared.png`, fullPage: true })

      await idle.page.clock.install()
      await idle.page.reload({ waitUntil: 'networkidle' })
      await expect(idle.page.getByRole('button', { name: 'Clear this shopper' })).toBeVisible()
      const idleReset = idle.page.waitForResponse((response) => response.url().includes(`/api/store/results/${encodeURIComponent(idle.token)}/kiosk-reset`) && response.request().method() === 'POST')
      await idle.page.clock.fastForward(900_000)
      expect((await idleReset).status()).toBe(200)
      await expect(idle.page).toHaveURL(new RegExp(`/en/c/${merchantSlug}/${campaignSlug}\\?`))
      await expect(idle.page.getByRole('heading', { name: 'Your campaign shortlist' })).toHaveCount(0)
      await idle.page.screenshot({ path: `${evidenceDir}/archived-kiosk-idle-cleared.png`, fullPage: true })

      for (const shopper of [...shoppers, ...legacyKioskSessions]) {
        const session = await prisma.merchantSession.findUnique({ where: { id: shopper.sessionId }, select: { status: true, photoAssetId: true } })
        expect(session).toMatchObject({ status: 'EXPIRED', photoAssetId: null })
        const asset = await prisma.storeAsset.findUnique({ where: { id: shopper.photoAssetId }, select: { deletedAt: true, retentionStatus: true } })
        expect(asset?.retentionStatus).toBe('DELETED')
        expect(asset?.deletedAt).not.toBeNull()
        const cookies = await shopper.context.cookies(baseUrl)
        expect(cookies.some((cookie) => cookie.name === 'vt_store_cap' || cookie.name === 'vt_store_visitor')).toBe(false)
        expect(await shopper.page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('vt_store_')))).toEqual([])
      }
      await phone.reload({ waitUntil: 'networkidle' })
      await expect(phone.getByRole('heading', { level: 1, name: 'Your campaign shortlist' })).toBeVisible()
      await expect(phone.getByRole('button', { name: 'Clear this shopper' })).toHaveCount(0)
      await phone.screenshot({ path: `${evidenceDir}/archived-phone-result-retained.png`, fullPage: true })

      const after = await Promise.all([
        prisma.merchantSession.count({ where: { merchantId, experienceId: created.id } }),
        prisma.merchantEvent.count({ where: { merchantId, experienceId: created.id } }),
        prisma.merchantIntent.count({ where: { merchantId, experienceId: created.id } }),
        prisma.tryOnTask.count({ where: { merchantId, merchantSessionId: { in: shoppers.map((shopper) => shopper.sessionId) } } }),
        prisma.merchantUsageLedger.count({ where: { merchantId, merchantSessionId: { in: shoppers.map((shopper) => shopper.sessionId) } } }),
      ])
      expect(after).toEqual(before)
    } finally {
      await phoneContext.close()
    }
  } finally {
    await Promise.all(shoppers.map((shopper) => shopper.context.close()))
    await prisma.$disconnect()
  }
})
