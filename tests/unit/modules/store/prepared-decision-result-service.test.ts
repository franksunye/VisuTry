import { prisma } from '@/lib/prisma'
import {
  createDecisionResultAssetRef,
  getDecisionResultView,
  resolveDecisionResultAsset,
} from '@/modules/store/application/decision-result-service'
import type { PreparedDemoDecisionResultReference } from '@/modules/store/domain/decision-result'

jest.mock('@vercel/blob', () => ({ get: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    decisionResultShare: { findUnique: jest.fn() },
    tryOnTask: { findMany: jest.fn() },
    merchantFrame: { findFirst: jest.fn() },
  },
}))

const token = 'private-prepared-demo-result-token'
const future = new Date(Date.now() + 60_000)
const reference: PreparedDemoDecisionResultReference = {
  source: 'PREPARED_DEMO',
  sourceRef: {
    assetKey: 'visutry-demo-v1-vt-rowan-local-qa',
    provenanceId: 'prepared-demo-local-qa-rowan-v1',
    manifestVersion: '1',
    shopperProfileId: 'visutry-demo-shopper-v1',
    shopperProfileVersion: '1',
  },
  frameId: 'rowan-frame-id',
  status: 'PREPARED',
  presentedAt: new Date().toISOString(),
}

function shareFor(overrides: { classification?: string | null; pilotType?: string | null; commercialExceptionCode?: string | null } = {}) {
  return {
    expiresAt: future,
    revokedAt: null,
    result: {
      id: 'decision-result-1',
      merchantId: 'demo-merchant-id',
      merchantSessionId: 'demo-session-id',
      expiresAt: future,
      payload: { tryOnResults: [reference] },
      merchant: {
        id: 'demo-merchant-id',
        slug: 'visutry-demo-optical',
        name: 'VisuTry Demo Optical',
        status: 'ACTIVE',
        accentColor: null,
        websiteUrl: null,
        classification: Object.prototype.hasOwnProperty.call(overrides, 'classification') ? overrides.classification : 'TEST',
        pilotType: Object.prototype.hasOwnProperty.call(overrides, 'pilotType') ? overrides.pilotType : 'DEMO',
        planCode: null,
        commercialStatus: null,
        commercialExceptionCode: Object.prototype.hasOwnProperty.call(overrides, 'commercialExceptionCode') ? overrides.commercialExceptionCode : 'VISUTRY_DEMO',
      },
      experience: null,
    },
  }
}

describe('PREPARED_DEMO Decision Result private delivery', () => {
  const originalEnv = {
    appEnv: process.env.APP_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    runtime: process.env.VISUTRY_LOCAL_DEMO_RUNTIME,
  }

  beforeEach(() => {
    process.env.APP_ENV = 'local'
    delete process.env.VERCEL_ENV
    process.env.VISUTRY_LOCAL_DEMO_RUNTIME = '1'
    jest.clearAllMocks()
    ;(prisma.decisionResultShare.findUnique as jest.Mock).mockResolvedValue(shareFor())
    ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.merchantFrame.findFirst as jest.Mock).mockResolvedValue({
      name: 'VT Rowan',
      sku: 'VT-DEMO-001',
      productUrl: null,
    })
  })

  afterAll(() => {
    if (originalEnv.appEnv === undefined) delete process.env.APP_ENV
    else process.env.APP_ENV = originalEnv.appEnv
    if (originalEnv.vercelEnv === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = originalEnv.vercelEnv
    if (originalEnv.runtime === undefined) delete process.env.VISUTRY_LOCAL_DEMO_RUNTIME
    else process.env.VISUTRY_LOCAL_DEMO_RUNTIME = originalEnv.runtime
  })

  it('returns the prepared item through the existing token-scoped result and media routes', async () => {
    const view = await getDecisionResultView(token)
    expect(view?.tryOnResults).toEqual([expect.objectContaining({
      source: 'PREPARED_DEMO',
      disclosure: 'LOCAL_QA_FIXTURE',
      frameId: 'rowan-frame-id',
      sku: 'VT-DEMO-001',
      imageUrl: `/api/store/results/${encodeURIComponent(token)}/try-on/${createDecisionResultAssetRef(token, reference)}`,
    })])

    const media = await resolveDecisionResultAsset({
      token,
      assetRef: createDecisionResultAssetRef(token, reference),
    })
    expect(media?.contentType).toBe('image/svg+xml')
    expect(media?.body.toString()).toContain('QA FIXTURE')
    expect(media?.body.toString()).toContain('NOT A TRY-ON IMAGE')
  })

  it('does not deliver prepared references to a merchant missing any explicit Demo marker', async () => {
    ;(prisma.decisionResultShare.findUnique as jest.Mock).mockResolvedValue(shareFor({ pilotType: null }))
    expect(await getDecisionResultView(token)).toMatchObject({ tryOnResults: [] })
    expect(await resolveDecisionResultAsset({
      token,
      assetRef: createDecisionResultAssetRef(token, reference),
    })).toBeNull()
    expect(prisma.merchantFrame.findFirst).not.toHaveBeenCalled()
  })

  it('preserves share revocation/expiry as the gate for prepared bytes', async () => {
    ;(prisma.decisionResultShare.findUnique as jest.Mock).mockResolvedValue({
      ...shareFor(),
      revokedAt: new Date(),
    })
    expect(await getDecisionResultView(token)).toBeNull()
    expect(await resolveDecisionResultAsset({
      token,
      assetRef: createDecisionResultAssetRef(token, reference),
    })).toBeNull()
  })
})
