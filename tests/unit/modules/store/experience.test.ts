import { getPublicMerchantProfile } from '@/modules/store/application/get-public-merchant'
import { resolveMerchantExperience } from '@/modules/store/application/resolve-experience'
import { createStoreSession } from '@/modules/store/application/create-store-session'
import { experienceContainsFrame } from '@/modules/store/domain'
import type {
  ExperienceRecord,
  MerchantFrameRecord,
  MerchantRepository,
} from '@/modules/store/application'

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
  it('resolves an active campaign with merchant tenant scope', async () => {
    const result = await resolveMerchantExperience({
      merchant: { id: 'merchant-1' } as never,
      experiences: {
        findDefaultStore: jest.fn(),
        findByMerchantAndId: jest.fn(),
        findActiveByMerchantAndSlug: jest.fn().mockResolvedValue(experience()),
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
          findByMerchantAndId: jest.fn(),
          findActiveByMerchantAndSlug: jest.fn().mockResolvedValue(
            experience({ merchantId: 'merchant-2' }),
          ),
        },
        slug: 'petite-fit',
      }),
    ).rejects.toMatchObject({ code: 'EXPERIENCE_NOT_FOUND', httpStatus: 404 })
  })

  it('returns only the selected catalog frames for a campaign profile', async () => {
    const profile = await getPublicMerchantProfile({
      merchants: merchant(),
      experiences: {
        findDefaultStore: jest.fn(),
        findByMerchantAndId: jest.fn(),
        findActiveByMerchantAndSlug: jest.fn().mockResolvedValue(experience()),
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
        findByMerchantAndId: jest.fn(),
        findActiveByMerchantAndSlug: jest.fn(),
      },
      events: { appendIdempotent: jest.fn().mockResolvedValue({ created: true }), listByMerchant: jest.fn() },
      usage: { countCommerceSessions: jest.fn().mockResolvedValue(0), record: jest.fn() } as never,
      slug: 'ello-sunglasses',
      locale: 'en',
    })

    expect(result.experienceId).toBe('experience-1')
    expect(sessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      experienceId: 'experience-1',
      campaign: 'petite-fit',
    }))
  })
})
