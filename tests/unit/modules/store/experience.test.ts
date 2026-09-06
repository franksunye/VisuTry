import { getPublicMerchantProfile } from '@/modules/store/application/get-public-merchant'
import { resolveMerchantExperience } from '@/modules/store/application/resolve-experience'
import { createStoreSession } from '@/modules/store/application/create-store-session'
import { recordCompareStarted } from '@/modules/store/application/record-compare-started'
import { createPrismaExperienceRepository } from '@/modules/store/infrastructure/prisma/experience-repository'
import { createMerchantSessionCapability, experienceContainsFrame } from '@/modules/store/domain'
import { prisma } from '@/lib/prisma'
import type {
  ExperienceRecord,
  MerchantFrameRecord,
  MerchantRepository,
} from '@/modules/store/application'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: { count: jest.fn() },
    experience: { findFirst: jest.fn() },
  },
}))

const now = new Date()

function experience(overrides: Partial<ExperienceRecord> = {}): ExperienceRecord {
  return {
    id: 'experience-1',
    merchantId: 'merchant-1',
    type: 'CAMPAIGN',
    slug: 'petite-fit',
    name: 'Petite Fit',
    status: 'ACTIVE',
    headline: 'Find smaller-face frames',
    description: null,
    heroAssetUrl: null,
    primaryCtaType: 'PRODUCT_OR_COLLECTION',
    primaryCtaLabel: 'View frame',
    primaryCtaUrl: null,
    secondaryCtaType: null,
    secondaryCtaLabel: null,
    secondaryCtaUrl: null,
    offerLabel: null,
    offerCode: null,
    offerTerms: null,
    startAt: null,
    endAt: null,
    referenceData: true,
    defaultSource: 'visutry-reference-pilot',
    defaultCampaign: 'petite-fit',
    referenceMetadata: null,
    frameIds: ['frame-1'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function frame(id: string): MerchantFrameRecord {
  return {
    id,
    merchantId: 'merchant-1',
    sku: id,
    name: id,
    brand: null,
    variant: null,
    imageUrl: null,
    imageAssetId: null,
    productUrl: 'https://example.com/product',
    price: null,
    currency: null,
    shape: 'round',
    material: null,
    color: null,
    widthClass: 'narrow',
    lensWidthMm: null,
    bridgeWidthMm: null,
    templeLengthMm: null,
    frameWidthMm: null,
    styleTags: [],
    collectionTags: [],
    sourceNotes: null,
    source: 'CSV',
    externalId: id,
    enrichmentStatus: 'APPROVED',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  }
}

function merchant(): MerchantRepository {
  return {
    findBySlug: jest.fn().mockResolvedValue({
      id: 'merchant-1',
      slug: 'ello-sunglasses',
      name: 'ello sunglasses',
      logoUrl: null,
      websiteUrl: null,
      contactEmail: null,
      accentColor: '#1D4ED8',
      status: 'ACTIVE',
      referenceData: true,
      pilotType: 'REFERENCE',
      tryOnEnabled: true,
      compareEnabled: true,
      maxCompareFrames: 2,
      inquiryEnabled: false,
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
      createdAt: now,
      updatedAt: now,
    }),
    findById: jest.fn(),
    listAllAdmin: jest.fn(),
  }
}

describe('Experience foundation', () => {
  it('resolves Campaign slugs through the Campaign-only repository contract', async () => {
    const store = experience({ type: 'STORE', slug: 'default', name: 'Default Store' })
    const campaign = experience({ type: 'CAMPAIGN', slug: 'petite-fit' })
    const findDefaultStore = jest.fn().mockResolvedValue(store)
    const findActiveCampaignByMerchantAndSlug = jest.fn().mockResolvedValue(campaign)

    const result = await resolveMerchantExperience({
      merchant: { id: 'merchant-1' } as never,
      experiences: {
        findDefaultStore,
        hasAnyByMerchant: jest.fn().mockResolvedValue(true),
        findByMerchantAndId: jest.fn(),
        findActiveCampaignByMerchantAndSlug,
      },
      slug: 'petite-fit',
    })

    expect(result?.type).toBe('CAMPAIGN')
    expect(findActiveCampaignByMerchantAndSlug).toHaveBeenCalledWith('merchant-1', 'petite-fit')
    expect(findDefaultStore).not.toHaveBeenCalled()
  })

  it('never resolves an active Store through the Campaign route', async () => {
    await expect(
      resolveMerchantExperience({
        merchant: { id: 'merchant-1' } as never,
        experiences: {
          findDefaultStore: jest.fn().mockResolvedValue(experience({ type: 'STORE', slug: 'default' })),
          hasAnyByMerchant: jest.fn().mockResolvedValue(true),
          findByMerchantAndId: jest.fn(),
          findActiveCampaignByMerchantAndSlug: jest.fn().mockResolvedValue(null),
        },
        slug: 'default',
      }),
    ).rejects.toMatchObject({ code: 'EXPERIENCE_NOT_FOUND', httpStatus: 404 })
  })

  it('resolves the active Store only through the Store default lookup', async () => {
    const store = experience({ type: 'STORE', slug: 'default' })
    const findDefaultStore = jest.fn().mockResolvedValue(store)

    const result = await resolveMerchantExperience({
      merchant: { id: 'merchant-1' } as never,
      experiences: {
        findDefaultStore,
        hasAnyByMerchant: jest.fn().mockResolvedValue(true),
        findByMerchantAndId: jest.fn(),
        findActiveCampaignByMerchantAndSlug: jest.fn(),
      },
    })

    expect(result?.type).toBe('STORE')
    expect(findDefaultStore).toHaveBeenCalledWith('merchant-1')
  })

  it('rejects the Store route when the merchant has only Campaign experiences', async () => {
    await expect(
      resolveMerchantExperience({
        merchant: { id: 'merchant-1' } as never,
        experiences: {
          findDefaultStore: jest.fn().mockResolvedValue(null),
          hasAnyByMerchant: jest.fn().mockResolvedValue(true),
          findByMerchantAndId: jest.fn(),
          findActiveCampaignByMerchantAndSlug: jest.fn().mockResolvedValue(
            experience({ type: 'CAMPAIGN', slug: 'petite-fit' }),
          ),
        },
      }),
    ).rejects.toMatchObject({ code: 'EXPERIENCE_NOT_FOUND', httpStatus: 404 })
  })

  it('queries only active Campaign experiences for Campaign slugs', async () => {
    const findFirst = prisma.experience.findFirst as jest.Mock
    findFirst.mockResolvedValue(null)

    await createPrismaExperienceRepository().findActiveCampaignByMerchantAndSlug(
      'merchant-1',
      'petite-fit',
    )

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        merchantId: 'merchant-1',
        slug: 'petite-fit',
        type: 'CAMPAIGN',
        status: 'ACTIVE',
      },
    }))
  })

  it('resolves an active campaign with merchant tenant scope', async () => {
    const result = await resolveMerchantExperience({
      merchant: { id: 'merchant-1' } as never,
      experiences: {
        findDefaultStore: jest.fn(),
        hasAnyByMerchant: jest.fn().mockResolvedValue(true),
        findByMerchantAndId: jest.fn(),
        findActiveCampaignByMerchantAndSlug: jest.fn().mockResolvedValue(experience()),
      },
      slug: 'petite-fit',
    })

    expect(result?.id).toBe('experience-1')
    expect(experienceContainsFrame(result!, 'frame-1')).toBe(true)
    expect(experienceContainsFrame(result!, 'frame-2')).toBe(false)
  })

  it('rejects an experience returned from another merchant', async () => {
    await expect(
      resolveMerchantExperience({
        merchant: { id: 'merchant-1' } as never,
        experiences: {
          findDefaultStore: jest.fn(),
          hasAnyByMerchant: jest.fn().mockResolvedValue(true),
          findByMerchantAndId: jest.fn(),
          findActiveCampaignByMerchantAndSlug: jest.fn().mockResolvedValue(
            experience({ merchantId: 'merchant-2' }),
          ),
        },
        slug: 'petite-fit',
      }),
    ).rejects.toMatchObject({ code: 'EXPERIENCE_NOT_FOUND', httpStatus: 404 })
  })

  it('does not silently use merchant-wide catalog when experiences exist without a Store', async () => {
    await expect(
      resolveMerchantExperience({
        merchant: { id: 'merchant-1' } as never,
        experiences: {
          findDefaultStore: jest.fn().mockResolvedValue(null),
          hasAnyByMerchant: jest.fn().mockResolvedValue(true),
          findByMerchantAndId: jest.fn(),
          findActiveCampaignByMerchantAndSlug: jest.fn(),
        },
      }),
    ).rejects.toMatchObject({ code: 'EXPERIENCE_NOT_FOUND' })

    await expect(
      resolveMerchantExperience({
        merchant: { id: 'legacy-merchant' } as never,
        experiences: {
          findDefaultStore: jest.fn().mockResolvedValue(null),
          hasAnyByMerchant: jest.fn().mockResolvedValue(false),
          findByMerchantAndId: jest.fn(),
          findActiveCampaignByMerchantAndSlug: jest.fn(),
        },
      }),
    ).resolves.toBeNull()
  })

  it('returns only the selected catalog frames for a campaign profile', async () => {
    const profile = await getPublicMerchantProfile({
      merchants: merchant(),
      experiences: {
        findDefaultStore: jest.fn(),
        hasAnyByMerchant: jest.fn().mockResolvedValue(true),
        findByMerchantAndId: jest.fn(),
        findActiveCampaignByMerchantAndSlug: jest.fn().mockResolvedValue(experience()),
      },
      frames: {
        findActiveByMerchant: jest.fn().mockResolvedValue([frame('frame-1'), frame('frame-2')]),
        findActiveByMerchantAndExperience: jest.fn().mockResolvedValue([frame('frame-1')]),
        findByMerchantAndId: jest.fn(),
        findActiveByMerchantAndId: jest.fn(),
      },
      slug: 'ello-sunglasses',
      experienceSlug: 'petite-fit',
    })

    expect(profile.experience?.slug).toBe('petite-fit')
    expect(profile.activeFrameCount).toBe(1)
    expect(profile.featuredFrames[0]?.id).toBe('frame-1')
    expect(profile).not.toHaveProperty('contactEmail')
  })

  it('persists the selected experience and first-touch campaign on session creation', async () => {
    const sessionCreate = jest.fn().mockResolvedValue({
      id: 'session-1',
      merchantId: 'merchant-1',
      experienceId: 'experience-1',
      referenceData: true,
      capabilityTokenHash: 'hash',
      anonymousVisitorId: null,
      photoAssetId: null,
      locale: 'en',
      status: 'ACTIVE',
      source: 'visutry-reference-pilot',
      medium: null,
      campaign: 'petite-fit',
      referrer: null,
      landingUrl: null,
      aiAgentSource: null,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + 60_000),
    })
    const analytics = { write: jest.fn().mockResolvedValue(undefined) }
    const result = await createStoreSession({
      merchants: merchant(),
      sessions: {
        create: sessionCreate,
        findByMerchantAndId: jest.fn(),
        touch: jest.fn(),
        markExpired: jest.fn(),
        attachPhotoAsset: jest.fn(),
      },
      experiences: {
        findDefaultStore: jest.fn().mockResolvedValue(experience({ type: 'STORE', slug: 'default' })),
        hasAnyByMerchant: jest.fn().mockResolvedValue(true),
        findByMerchantAndId: jest.fn(),
        findActiveCampaignByMerchantAndSlug: jest.fn(),
      },
      usage: { countCommerceSessions: jest.fn().mockResolvedValue(0), record: jest.fn() } as never,
      analytics,
      slug: 'ello-sunglasses',
      locale: 'en',
      acquisition: { source: 'visutry', medium: 'internal', surface: 'face-analysis', campaign: 'declared-campaign' },
    })

    expect(result.experienceId).toBe('experience-1')
    expect(sessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      experienceId: 'experience-1',
      source: 'visutry',
      medium: 'internal',
      campaign: 'declared-campaign',
      acquisitionSurface: 'face-analysis',
    }))
    expect(analytics.write).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'merchant_page_viewed',
      merchantId: 'merchant-1',
      sessionId: 'session-1',
    }))
  })

  it('rejects compare requests for a frame outside the authoritative session Experience', async () => {
    const capability = createMerchantSessionCapability()
    await expect(
      recordCompareStarted({
        merchants: merchant(),
        sessions: {
          create: jest.fn(),
          findByMerchantAndId: jest.fn().mockResolvedValue({
            id: 'session-1',
            merchantId: 'merchant-1',
            experienceId: 'experience-1',
            anonymousVisitorId: null,
            photoAssetId: null,
            capabilityTokenHash: capability.tokenHash,
            locale: 'en',
            status: 'ACTIVE',
            referenceData: true,
            source: 'reference',
            medium: null,
            campaign: 'declared-campaign',
            referrer: null,
            landingUrl: null,
            aiAgentSource: null,
            createdAt: now,
            lastActiveAt: now,
            expiresAt: new Date(now.getTime() + 60_000),
          }),
          touch: jest.fn(),
          markExpired: jest.fn(),
          attachPhotoAsset: jest.fn(),
        },
        experiences: {
          findDefaultStore: jest.fn(),
          hasAnyByMerchant: jest.fn(),
          findByMerchantAndId: jest.fn().mockResolvedValue(experience({ frameIds: ['frame-1', 'frame-2'] })),
          findActiveCampaignByMerchantAndSlug: jest.fn(),
        },
        events: { appendIdempotent: jest.fn(), listByMerchant: jest.fn() },
        slug: 'ello-sunglasses',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        clientActionId: 'compare-1',
        frameIds: ['frame-4', 'frame-2'],
      }),
    ).rejects.toMatchObject({ code: 'FRAME_INACTIVE', httpStatus: 409 })
  })
})
