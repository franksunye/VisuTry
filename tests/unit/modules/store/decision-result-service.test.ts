import { prisma } from '@/lib/prisma'
import { MockBlob } from '@/lib/mocks/blob'
import { hashSessionCapability } from '@/modules/store/domain/session'
import { getDecisionResultView, resolveDecisionResultAsset } from '@/modules/store/application/decision-result-service'

jest.mock('@vercel/blob', () => ({ get: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    decisionResultShare: { findUnique: jest.fn() },
    tryOnTask: { findFirst: jest.fn(), findMany: jest.fn() },
    merchantFrame: { findMany: jest.fn(), findFirst: jest.fn() },
  },
}))

describe('Local Decision Result media resolution', () => {
  const uploaded: string[] = []

  afterEach(async () => {
    if (uploaded.length) await MockBlob.del(uploaded.splice(0))
    jest.clearAllMocks()
  })

  it('streams the durable Local mock Blob bytes without fetching the synthetic provider URL', async () => {
    const token = `local-result-${Date.now()}-token`
    const taskId = 'local-result-task'
    const frameId = 'local-result-frame'
    const pathname = `tryon/result/local/${Date.now()}.png`
    const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII=', 'base64')
    const stored = await MockBlob.put(pathname, bytes, { contentType: 'image/png' })
    uploaded.push(stored.url)
    const future = new Date(Date.now() + 60_000)

    ;(prisma.decisionResultShare.findUnique as jest.Mock).mockResolvedValue({
      expiresAt: future,
      revokedAt: null,
      result: {
        id: 'local-result-record',
        merchantId: 'local-result-merchant',
        merchantSessionId: 'local-result-session',
        expiresAt: future,
        payload: {
          tryOnResults: [{ taskId, frameId, status: 'COMPLETED', completedAt: new Date().toISOString() }],
        },
        merchant: {
          id: 'local-result-merchant',
          slug: 'visutry-demo-optical',
          name: 'VisuTry Demo Optical',
          status: 'ACTIVE',
          planCode: null,
          commercialStatus: null,
          createdAt: new Date(),
        },
        experience: null,
      },
    })
    ;(prisma.tryOnTask.findFirst as jest.Mock).mockResolvedValue({
      id: taskId,
      merchantFrameId: frameId,
      resultImageUrl: stored.url,
      metadata: { resultPathname: pathname, resultAssetAccessMode: 'PUBLIC_TEMPORARY' },
      expiresAt: future,
    })

    const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch')
    const fetchSpy = jest.fn()
    Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: fetchSpy })
    try {
      const result = await resolveDecisionResultAsset({
        token,
        assetRef: hashSessionCapability(`${token}:${taskId}`).slice(0, 32),
      })
      expect(result).toMatchObject({ body: bytes, contentType: 'image/png', expiresAt: future })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch)
      else delete (global as { fetch?: typeof fetch }).fetch
    }
  })

  it('keeps an archived private result readable while removing every current conversion destination', async () => {
    const future = new Date(Date.now() + 60_000)
    const frameId = 'archived-frame'
    const taskId = 'archived-task'
    ;(prisma.decisionResultShare.findUnique as jest.Mock).mockResolvedValue({
      expiresAt: future,
      revokedAt: null,
      result: {
        id: 'archived-result',
        merchantId: 'archived-merchant',
        merchantSessionId: 'archived-session',
        expiresAt: future,
        payload: {
          journey: { experienceId: 'archived-campaign', experienceType: 'CAMPAIGN', experienceSlug: 'spring-edit', enabledStages: ['RECOMMENDATION', 'TRY_ON', 'COMPARE'] },
          faceFit: null,
          recommendation: { rankingVersion: 'store-rank-v2', frames: [{ frameId, sku: 'A-1', name: 'Aster', imageUrl: 'https://cdn.example.test/aster.jpg', productUrl: 'https://shop.example.test/aster', score: 90, reason: 'A considered fit.' }] },
          selectedFrameIds: [frameId],
          favoriteFrameIds: [],
          tryOnResults: [{ source: 'LIVE_TRYON', taskId, frameId, status: 'COMPLETED', completedAt: new Date().toISOString() }],
          compare: { startedAt: new Date().toISOString(), frameIds: [frameId] },
        },
        merchant: {
          id: 'archived-merchant', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE',
          logoUrl: null, accentColor: null, websiteUrl: null, referenceData: false,
          classification: 'TEST', pilotType: 'DEMO', planCode: null, commercialStatus: null,
          commercialExceptionCode: null, createdAt: new Date(),
        },
        experience: {
          id: 'archived-campaign', type: 'CAMPAIGN', status: 'ARCHIVED', slug: 'spring-edit', name: 'Spring edit',
          primaryCtaType: 'LINK', primaryCtaLabel: 'Shop now', primaryCtaUrl: 'https://shop.example.test/sale',
          secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null,
          deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 60 },
        },
      },
    })
    ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue([{
      id: taskId, merchantFrameId: frameId, resultImageUrl: 'https://blob.example.test/result.png',
      expiresAt: future, metadata: {}, merchantFrame: { name: 'Aster', sku: 'A-1', productUrl: 'https://shop.example.test/aster' },
    }])
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([{
      id: frameId, name: 'Aster', imageUrl: 'https://cdn.example.test/aster.jpg', productUrl: 'https://shop.example.test/aster',
    }])

    const result = await getDecisionResultView('opaque-archived-token')

    expect(result?.experience).toMatchObject({ status: 'ARCHIVED', primaryCta: null, secondaryCta: null })
    expect(result?.recommendation?.frames).toMatchObject([{ name: 'Aster', productUrl: null }])
    expect(result?.tryOnResults).toMatchObject([{ name: 'Aster', imageUrl: expect.stringContaining('/api/store/results/'), productUrl: null }])
    expect(result?.compareFrames).toMatchObject([{ name: 'Aster', productUrl: null }])
  })
})
