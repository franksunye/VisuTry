import { getDiscoverContent } from '@/modules/store/application/get-discover-content'
import { DISCOVER_FEATURED_EXPERIENCES, DISCOVER_MERCHANT_SLUGS } from '@/config/discover'

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
  source: 'IMPORT' as const,
  externalId: null,
  enrichmentStatus: 'PENDING' as const,
  status: 'ACTIVE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
})

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
    const runtime = {
      merchants: { findBySlug: jest.fn(async (slug: string) => merchants.get(slug as typeof DISCOVER_MERCHANT_SLUGS[number]) ?? null) },
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
  })
})
