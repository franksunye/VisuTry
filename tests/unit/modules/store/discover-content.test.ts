import { getDiscoverContent, type DiscoverRuntime } from '@/modules/store/application/get-discover-content'
import { DISCOVER_FEATURED_EXPERIENCES, DISCOVER_MERCHANT_SLUGS } from '@/config/discover'
import type { ExperienceRecord, MerchantFrameRecord, MerchantRecord } from '@/modules/store/application/ports/repositories'

const makeMerchant = (slug: string, referenceData = true) => ({
  id: `merchant-${slug}`,
  slug,
  name: slug,
  logoUrl: null,
  websiteUrl: null,
  contactEmail: null,
  accentColor: '#334155',
  status: 'ACTIVE' as const,
  pilotType: referenceData ? 'REFERENCE' : null,
  referenceData,
  defaultSource: null,
  defaultCampaign: null,
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
  createdAt: new Date(),
  updatedAt: new Date(),
})

const makeExperience = (merchantId: string, slug: string, type: 'STORE' | 'CAMPAIGN' = 'CAMPAIGN') => ({
  id: `experience-${slug}`,
  merchantId,
  type,
  slug,
  name: slug,
  status: 'ACTIVE' as const,
  headline: `${slug} headline`,
  description: `${slug} description`,
  heroAssetUrl: null,
  primaryCtaType: null,
  primaryCtaLabel: null,
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
  defaultSource: null,
  defaultCampaign: null,
  referenceMetadata: null,
  frameIds: [`frame-${slug}`],
  createdAt: new Date(),
  updatedAt: new Date(),
})

const makeFrame = (merchantId: string, slug: string) => ({
  id: `frame-${slug}`,
  merchantId,
  sku: null,
  name: `${slug} frame`,
  brand: null,
  variant: null,
  imageUrl: `https://cdn.example.test/${slug}.jpg`,
  imageAssetId: null,
  productUrl: null,
  price: null,
  currency: null,
  shape: 'round',
  material: null,
  color: null,
  widthClass: null,
  styleTags: [],
  collectionTags: [],
  sourceNotes: null,
  source: 'CSV' as const,
  externalId: null,
  enrichmentStatus: 'PENDING' as const,
  status: 'ACTIVE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
})

function makeLearningRuntime(input: {
  merchant?: Partial<MerchantRecord>
  experience?: Partial<ExperienceRecord>
  transformFrames?: (frames: MerchantFrameRecord[]) => MerchantFrameRecord[]
} = {}): DiscoverRuntime {
  const merchant: MerchantRecord = {
    ...makeMerchant('visutry-demo', false), pilotType: 'LIVE',
    websiteUrl: null,
    ...input.merchant,
  }
  const allFrames = ['round', 'rectangle', 'oval', 'aviator'].map((shape) => ({
    ...makeFrame(merchant.id, shape), shape, productUrl: `https://www.visutry.com/en/demo/frames/${shape}`,
  }))
  const experience: ExperienceRecord = {
    ...makeExperience(merchant.id, 'everyday-fit'), referenceData: false,
    frameIds: allFrames.map((frame) => frame.id),
    ...input.experience,
  }
  return {
    merchants: { findBySlug: jest.fn(async (slug) => slug === 'visutry-demo' ? merchant : null) },
    experiences: {
      findActiveCampaignByMerchantAndSlug: jest.fn(async () => experience),
      findDefaultStore: jest.fn(async () => null),
    },
    frames: { findActiveByMerchantAndExperience: jest.fn(async () => input.transformFrames?.(allFrames) ?? allFrames) },
  }
}

describe('Discover content contract', () => {
  it('resolves only active, catalog-backed curated Experiences and all active merchants', async () => {
    const merchants = new Map(
      DISCOVER_MERCHANT_SLUGS.map((slug) => [slug, makeMerchant(slug)]),
    )
    const experiences = new Map(
      DISCOVER_FEATURED_EXPERIENCES.map(({ merchantSlug, experienceSlug }) => [
        `${merchantSlug}:${experienceSlug}`,
        makeExperience(merchants.get(merchantSlug)!.id, experienceSlug),
      ]),
    )
    const stores = new Map(
      DISCOVER_MERCHANT_SLUGS.map((slug) => [
        slug,
        makeExperience(merchants.get(slug)!.id, 'default', 'STORE'),
      ]),
    )
    const findBySlug = jest.fn(async (slug: string) => merchants.get(slug as typeof DISCOVER_MERCHANT_SLUGS[number]) ?? null)
    const runtime = {
      merchants: { findBySlug },
      experiences: {
        findActiveCampaignByMerchantAndSlug: jest.fn(async (merchantId: string, slug: string) =>
          Array.from(experiences.values()).find((item) => item.merchantId === merchantId && item.slug === slug) ?? null),
        findDefaultStore: jest.fn(async (merchantId: string) =>
          Array.from(stores.values()).find((item) => item.merchantId === merchantId) ?? null),
      },
      frames: {
        findActiveByMerchantAndExperience: jest.fn(async (merchantId: string, experience: { slug: string }) => [makeFrame(merchantId, experience.slug)]),
      },
    } as never

    const content = await getDiscoverContent('en', runtime)

    expect(content.featured).toHaveLength(6)
    expect(content.featured.every((item) => item.href.includes('surface=discover'))).toBe(true)
    expect(content.featured.every((item) => item.href.includes('campaign=discover-featured'))).toBe(true)
    expect(content.merchants).toHaveLength(5)
    expect(content.merchants.every((item) => item.referenceData)).toBe(true)
    // Existing cards share five merchants; the separate learning example checks
    // its own current merchant state once and stays absent in this fixture.
    expect(findBySlug).toHaveBeenCalledTimes(DISCOVER_MERCHANT_SLUGS.length + 1)
    expect(content.learningExample).toBeNull()
    expect(content.demo).toEqual({
      href: '/en/store/visutry-demo-optical?source=visutry&medium=internal&surface=discover&campaign=canonical-demo',
      name: 'VisuTry Demo Optical',
      description: expect.any(String),
    })
  })

  it('deduplicates merchant reads only within one request, preserving live status on the next request', async () => {
    let active = true
    const findBySlug = jest.fn(async (slug: string) => ({
      ...makeMerchant(slug),
      status: active ? 'ACTIVE' as const : 'SUSPENDED' as const,
    }))
    const runtime = {
      merchants: { findBySlug },
      experiences: {
        findActiveCampaignByMerchantAndSlug: jest.fn(async (merchantId: string, slug: string) =>
          makeExperience(merchantId, slug)),
        findDefaultStore: jest.fn(async (merchantId: string) =>
          makeExperience(merchantId, 'default', 'STORE')),
      },
      frames: { findActiveByMerchantAndExperience: jest.fn(async (merchantId: string, experience: { slug: string }) =>
        [makeFrame(merchantId, experience.slug)]) },
    } as never

    const first = await getDiscoverContent('en', runtime)
    expect(first.merchants).toHaveLength(5)
    expect(findBySlug).toHaveBeenCalledTimes(6)

    active = false
    const second = await getDiscoverContent('en', runtime)
    expect(second.merchants).toHaveLength(0)
    expect(second.featured).toHaveLength(0)
    expect(findBySlug).toHaveBeenCalledTimes(12)
  })

  it('filters an inactive or empty curated Experience without hiding other merchants', async () => {
    const runtime = {
      merchants: { findBySlug: jest.fn(async (slug: string) => makeMerchant(slug as typeof DISCOVER_MERCHANT_SLUGS[number])) },
      experiences: {
        findActiveCampaignByMerchantAndSlug: jest.fn(async (merchantId: string, slug: string) =>
          slug === 'petite-fit' ? { ...makeExperience(merchantId, slug), status: 'ENDED' as const } : null),
        findDefaultStore: jest.fn(async (merchantId: string) => makeExperience(merchantId, 'default', 'STORE')),
      },
      frames: { findActiveByMerchantAndExperience: jest.fn(async () => []) },
    } as never

    const content = await getDiscoverContent('en', runtime)

    expect(content.featured).toHaveLength(0)
    expect(content.merchants).toHaveLength(5)
    expect(content.demo.href).toContain('/en/store/visutry-demo-optical')
  })

  it('offers the active public Canary as a separate, explicitly internal learning entry', async () => {
    const content = await getDiscoverContent('en', makeLearningRuntime())
    expect(content.learningExample).toMatchObject({
      headline: 'Everyday Fit: round or rectangular?',
      href: '/en/c/visutry-demo/everyday-fit?source=visutry&medium=internal&surface=discover&campaign=discover-canary-learning',
    })
    expect(content.learningExample?.description).toContain('not for sale')
    expect(content.demo.href).toContain('/en/store/visutry-demo-optical')
    expect(content.featured).toHaveLength(0)
  })

  it.each([
    ['suspended merchant', { merchant: { status: 'SUSPENDED' } }],
    ['merchant Reference', { merchant: { referenceData: true } }],
    ['Reference pilot', { merchant: { pilotType: 'REFERENCE' } }],
    ['different merchant', { merchant: { slug: 'visutry-demo-optical' } }],
    ['draft Campaign', { experience: { status: 'DRAFT' } }],
    ['ended Campaign', { experience: { status: 'ENDED' } }],
    ['archived Campaign', { experience: { status: 'ARCHIVED' } }],
    ['Reference Campaign', { experience: { referenceData: true } }],
    ['different tenant', { experience: { merchantId: 'another-tenant' } }],
    ['different Campaign', { experience: { slug: 'other-edit' } }],
  ] as const)('hides the learning entry for %s', async (_label, overrides) => {
    const content = await getDiscoverContent('en', makeLearningRuntime(overrides))
    expect(content.learningExample).toBeNull()
  })

  it('does not promote a thin catalog, a missing comparison, or cross-tenant frames', async () => {
    for (const transformFrames of [
      (frames: MerchantFrameRecord[]) => frames.slice(0, 2),
      (frames: MerchantFrameRecord[]) => frames.map((frame) => ({ ...frame, shape: 'round' })),
      (frames: MerchantFrameRecord[]) => frames.map((frame) => ({ ...frame, merchantId: 'another-tenant' })),
      (frames: MerchantFrameRecord[]) => frames.map((frame) => ({ ...frame, productUrl: null })),
    ]) {
      const content = await getDiscoverContent('en', makeLearningRuntime({ transformFrames }))
      expect(content.learningExample).toBeNull()
    }
  })

  it('does not add an English-only learning entry or its lookup to other locales', async () => {
    const runtime = makeLearningRuntime()
    const content = await getDiscoverContent('ja', runtime)
    expect(content.learningExample).toBeNull()
    expect(runtime.merchants.findBySlug).not.toHaveBeenCalledWith('visutry-demo')
    expect(content.demo.href).toContain('/ja/store/visutry-demo-optical')
  })
})
