import {
  mapGeometryToShopperSignals,
  preferredWidthFromAspectRatio,
  normalizeFaceShape,
  rankMerchantFrames,
} from '@/modules/store/domain'
import { recommendMerchantFrames } from '@/modules/store/application/recommend-frames'
import { createMerchantSessionCapability } from '@/modules/store/domain'
import type {
  MerchantEventRepository,
  MerchantFrameRecord,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
} from '@/modules/store/application'

describe('Store signal mapping', () => {
  it('normalizes face shapes and width preferences', () => {
    expect(normalizeFaceShape('Square')).toBe('square')
    expect(normalizeFaceShape('unknown')).toBeNull()
    expect(preferredWidthFromAspectRatio(1.5)).toBe('narrow')
    expect(preferredWidthFromAspectRatio(1.1)).toBe('wide')
    expect(preferredWidthFromAspectRatio(1.25)).toBe('medium')
  })

  it('builds ranking signals with style hints from face shape', () => {
    const signals = mapGeometryToShopperSignals({
      measuredShape: 'square',
      faceAspectRatio: 1.15,
    })
    expect(signals.faceShape).toBe('square')
    expect(signals.preferredWidthClass).toBe('wide')
    expect(signals.styleHints).toEqual(
      expect.arrayContaining(['round', 'oval', 'aviator']),
    )
  })
})

describe('recommendMerchantFrames', () => {
  const capability = createMerchantSessionCapability()

  const frames: MerchantFrameRecord[] = [
    {
      id: 'f-round',
      merchantId: 'm1',
      sku: 'R1',
      name: 'Round',
      brand: 'Brand A',
      imageUrl: 'https://example.com/r.jpg',
      imageAssetId: null,
      productUrl: 'https://example.com/r',
      price: 10000,
      currency: 'usd',
      shape: 'round',
      material: 'metal',
      color: 'gold',
      widthClass: 'wide',
      styleTags: ['classic'],
      source: 'SEED',
      externalId: 'R1',
      enrichmentStatus: 'APPROVED',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'f-rect',
      merchantId: 'm1',
      sku: 'X1',
      name: 'Rect',
      brand: 'Brand B',
      imageUrl: 'https://example.com/x.jpg',
      imageAssetId: null,
      productUrl: 'https://example.com/x',
      price: 11000,
      currency: 'usd',
      shape: 'rectangle',
      material: 'acetate',
      color: 'black',
      widthClass: 'medium',
      styleTags: ['minimal'],
      source: 'SEED',
      externalId: 'X1',
      enrichmentStatus: 'APPROVED',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'f-other',
      merchantId: 'm2',
      sku: 'O1',
      name: 'Leak',
      brand: 'Other Brand',
      imageUrl: null,
      imageAssetId: null,
      productUrl: null,
      price: null,
      currency: null,
      shape: 'round',
      material: null,
      color: null,
      widthClass: null,
      styleTags: [],
      source: 'SEED',
      externalId: 'O1',
      enrichmentStatus: 'APPROVED',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  function repos() {
    const merchants: MerchantRepository = {
      findBySlug: async () => ({
        id: 'm1',
        slug: 'luna-optical',
        name: 'Luna',
        logoUrl: null,
        websiteUrl: null,
        contactEmail: null,
        accentColor: '#123',
        status: 'ACTIVE',
        planCode: null,
        commercialStage: null,
        pricingVersion: null,
        entitlementVersion: null,
        commerceSessionAllowance: null,
        standardRenderAllowance: null,
        premiumRenderAllowance: null,
        campaignAllowance: null,
        entitlementEffectiveFrom: null,
        billingPeriodEnd: null,
        commercialExceptionCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findById: async () => null,
      listAllAdmin: async () => [],
    }
    const frameRepo: MerchantFrameRepository = {
      findActiveByMerchant: async (merchantId) =>
        frames.filter((f) => f.merchantId === merchantId && f.status === 'ACTIVE'),
      findByMerchantAndId: async () => null,
      findActiveByMerchantAndId: async () => null,
    }
    const sessions: MerchantSessionRepository = {
      create: jest.fn(),
      findByMerchantAndId: jest.fn().mockResolvedValue({
        id: 's1',
        merchantId: 'm1',
        anonymousVisitorId: null,
        photoAssetId: 'a1',
        capabilityTokenHash: capability.tokenHash,
        locale: 'en',
        status: 'ACTIVE',
        source: null,
        medium: null,
        campaign: null,
        referrer: null,
        landingUrl: null,
        aiAgentSource: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      }),
      touch: jest.fn(),
      markExpired: jest.fn(),
      attachPhotoAsset: jest.fn(),
    }
    const events: MerchantEventRepository = {
      appendIdempotent: jest.fn().mockResolvedValue({
        record: {},
        created: true,
      }),
      listByMerchant: async () => [],
    }
    return { merchants, frameRepo, sessions, events }
  }

  it('returns merchant-only shortlist with reasons and ranking version', async () => {
    const { merchants, frameRepo, sessions, events } = repos()
    const result = await recommendMerchantFrames({
      merchants,
      frames: frameRepo,
      sessions,
      events,
      slug: 'luna-optical',
      merchantSessionId: 's1',
      capabilityToken: capability.token,
      signals: {
        status: 'measured',
        measuredShape: 'square',
        alternativeShapes: ['oval'],
        measuredConfidence: 0.84,
        qualityScore: 88,
        faceAspectRatio: 1.12,
        jawToCheekWidth: 0.83,
        foreheadToCheekWidth: 0.88,
      },
    })

    expect(result.frames.length).toBeGreaterThan(0)
    expect(result.frames.every((f) => f.id !== 'f-other')).toBe(true)
    expect(result.frames.map((frame) => frame.productBrand)).toEqual(
      expect.arrayContaining(['Brand A', 'Brand B']),
    )
    expect(result.frames[0]?.reason).toBeTruthy()
    expect(result.rankingVersion).toMatch(/^store-rank-/)
    expect(events.appendIdempotent).toHaveBeenCalled()
    expect(events.appendIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'merchant_recommendation_completed',
        metadata: expect.objectContaining({
          topMatchScore: expect.any(Number),
          averageMatchScore: expect.any(Number),
          geometryQualityBand: 'high',
          signalCount: expect.any(Number),
          primaryFaceShape: 'square',
          usedAlternativeShape: expect.any(Boolean),
        }),
      }),
    )

    // Deterministic for same signals
    const again = rankMerchantFrames(
      frames.filter((f) => f.merchantId === 'm1').map((f) => ({
        id: f.id,
        merchantId: f.merchantId,
        name: f.name,
        shape: f.shape,
        material: f.material,
        color: f.color,
        widthClass: f.widthClass,
        styleTags: f.styleTags,
      })),
      result.signalsUsed,
      { merchantId: 'm1', limit: 6 },
    )
    expect(again.frames.map((f) => f.frameId)).toEqual(result.frames.map((f) => f.id))
  })

  it('rejects recommend without capability', async () => {
    const { merchants, frameRepo, sessions, events } = repos()
    await expect(
      recommendMerchantFrames({
        merchants,
        frames: frameRepo,
        sessions,
        events,
        slug: 'luna-optical',
        merchantSessionId: 's1',
        capabilityToken: null,
        signals: {},
      }),
    ).rejects.toMatchObject({ code: 'SESSION_UNAUTHORIZED' })
  })
})
