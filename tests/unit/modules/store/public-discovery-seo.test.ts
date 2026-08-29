import {
  resolveExperienceSearchVisibility,
  visibilityToRobots,
} from '@/modules/store/domain/experience-search-visibility'
import {
  buildExperienceDiscoveryJsonLd,
  buildExperienceDiscoveryMetadata,
} from '@/lib/store-discovery-seo'
import { SITE_CONFIG } from '@/lib/seo'
import { getPublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'

const date = new Date('2026-08-12T00:00:00.000Z')

function frames(count = 4) {
  return Array.from({ length: count }, (_, index) => ({
    id: `frame-${index}`,
    name: `Frame ${index}`,
    brand: 'VisuTry Optical',
    imageUrl: `https://cdn.example.test/frame-${index}.jpg`,
    productUrl: `https://merchant.example.test/frame-${index}`,
    price: 12000,
    currency: 'usd',
    shape: 'round',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    updatedAt: date,
  }))
}

function visibilityInput(overrides: Record<string, unknown> = {}) {
  return {
    merchant: {
      name: 'VisuTry Optical',
      status: 'ACTIVE',
      websiteUrl: 'https://merchant.example.test',
      pilotType: 'LIVE',
      referenceData: false,
      sponsoredUsagePolicyKey: null,
    },
    experience: {
      type: 'CAMPAIGN' as const,
      name: 'Petite Fit',
      status: 'ACTIVE' as const,
      headline: 'Best glasses for petite faces',
      description: 'A factual frame edit.',
      referenceData: false,
    },
    frames: frames(),
    ...overrides,
  }
}

describe('ExperienceSearchVisibility', () => {
  it('indexes a live, approved merchant experience with a meaningful collection', () => {
    expect(resolveExperienceSearchVisibility(visibilityInput())).toBe('PUBLIC_INDEX')
  })

  it('indexes an explicitly VisuTry-owned experience', () => {
    expect(resolveExperienceSearchVisibility(visibilityInput({
      merchant: {
        ...visibilityInput().merchant,
        pilotType: null,
        sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
      },
    }))).toBe('PUBLIC_INDEX')
  })

  it('keeps reference experiences readable but noindex', () => {
    expect(resolveExperienceSearchVisibility(visibilityInput({
      merchant: { ...visibilityInput().merchant, pilotType: 'REFERENCE', referenceData: true },
      experience: { ...visibilityInput().experience, referenceData: true },
    }))).toBe('PUBLIC_NOINDEX')
  })

  it('keeps draft content private and historical content readable without indexing', () => {
    expect(resolveExperienceSearchVisibility(visibilityInput({
      experience: { ...visibilityInput().experience, status: 'DRAFT' },
    }))).toBe('PRIVATE')
    expect(resolveExperienceSearchVisibility(visibilityInput({
      experience: { ...visibilityInput().experience, status: 'ARCHIVED' },
    }))).toBe('PUBLIC_NOINDEX')
  })

  it('noindexes thin content instead of inflating the index', () => {
    expect(resolveExperienceSearchVisibility({ ...visibilityInput(), frames: frames(3) })).toBe('PUBLIC_NOINDEX')
    expect(visibilityToRobots('PUBLIC_NOINDEX')).toEqual({ index: false, follow: true })
    expect(visibilityToRobots('PRIVATE')).toEqual({ index: false, follow: false })
  })

  it('keeps aggregate visibility consistent with full frame input', () => {
    const aggregateInput = {
      ...visibilityInput(),
      frames: [],
      frameCount: 4,
      hasProductDestination: true,
    }
    expect(resolveExperienceSearchVisibility(aggregateInput)).toBe('PUBLIC_INDEX')
    expect(resolveExperienceSearchVisibility({ ...aggregateInput, frameCount: 3 })).toBe('PUBLIC_NOINDEX')
  })
})

function discovery(): PublicExperienceDiscovery {
  return {
    merchant: {
      id: 'merchant-1',
      slug: 'visutry-optical',
      name: 'VisuTry Optical',
      logoUrl: null,
      websiteUrl: 'https://merchant.example.test',
      accentColor: '#1f4b5a',
      generativeTryOnAvailable: true,
      referenceData: false,
      updatedAt: date,
    },
    experience: {
      id: 'experience-1',
      merchantId: 'merchant-1',
      type: 'CAMPAIGN',
      slug: 'petite-fit',
      name: 'Petite Fit',
      status: 'ACTIVE',
      headline: 'Best glasses for petite faces',
      description: 'A factual frame edit.',
      heroAssetUrl: null,
      referenceData: false,
      updatedAt: date,
    },
    frames: frames(),
    visibility: 'PUBLIC_INDEX',
    lastModified: date,
  }
}

describe('Store/Campaign discovery SEO', () => {
  it('uses factual merchant/campaign metadata and a clean canonical', () => {
    const metadata = buildExperienceDiscoveryMetadata({
      discovery: discovery(),
      locale: 'en',
      pathname: '/en/c/visutry-optical/petite-fit?utm_source=ignored',
    })

    expect(metadata.title).toBe('Best glasses for petite faces | VisuTry Optical')
    expect(metadata.description).toBe('A factual frame edit.')
    expect(metadata.alternates?.canonical).toBe(`${SITE_CONFIG.url}/en/c/visutry-optical/petite-fit`)
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
    expect(metadata.openGraph).toMatchObject({ type: 'website', url: metadata.alternates?.canonical })
  })

  it('emits collection, organization, item list, and breadcrumbs without commerce claims', () => {
    const jsonLd = buildExperienceDiscoveryJsonLd({
      discovery: discovery(),
      pathname: '/en/c/visutry-optical/petite-fit',
    })
    const graph = jsonLd['@graph'] as Array<Record<string, unknown>>
    const collection = graph.find((item) => item['@type'] === 'CollectionPage')!
    const organization = graph.find((item) => item['@type'] === 'Organization')!

    expect(collection).toBeDefined()
    expect(organization.name).toBe('VisuTry Optical')
    expect(collection.mainEntity).toMatchObject({ '@type': 'ItemList' })
    expect(graph.find((item) => item['@type'] === 'BreadcrumbList')).toBeDefined()
    expect(JSON.stringify(jsonLd)).not.toMatch(/Offer|Review|AggregateRating|availability/i)
  })

  it('resolves complete public discovery data without session/runtime services', async () => {
    const result = await getPublicExperienceDiscovery({
      slug: 'visutry-optical',
      experienceSlug: 'petite-fit',
      merchants: {
        findBySlug: jest.fn().mockResolvedValue({
          id: 'merchant-1',
          slug: 'visutry-optical',
          name: 'VisuTry Optical',
          logoUrl: null,
          websiteUrl: 'https://merchant.example.test',
          accentColor: null,
          status: 'ACTIVE',
          pilotType: 'LIVE',
          referenceData: false,
          sponsoredUsagePolicyKey: null,
          updatedAt: date,
        }),
      },
      experiences: {
        findPublicCampaignByMerchantAndSlug: jest.fn().mockResolvedValue({
          id: 'experience-1',
          merchantId: 'merchant-1',
          type: 'CAMPAIGN',
          slug: 'petite-fit',
          name: 'Petite Fit',
          status: 'ACTIVE',
          headline: 'Best glasses for petite faces',
          description: 'A factual frame edit.',
          heroAssetUrl: null,
          referenceData: false,
          frameIds: frames().map((frame) => frame.id),
          updatedAt: date,
        }),
        findActiveCampaignByMerchantAndSlug: jest.fn(),
        findDefaultStore: jest.fn(),
        hasAnyByMerchant: jest.fn(),
        findByMerchantAndId: jest.fn(),
      },
      frames: {
        findActiveByMerchantAndExperience: jest.fn().mockResolvedValue(frames()),
        findActiveByMerchant: jest.fn(),
      },
    } as never)

    expect(result?.visibility).toBe('PUBLIC_INDEX')
    expect(result?.merchant.name).toBe('VisuTry Optical')
    expect(result?.experience.headline).toBe('Best glasses for petite faces')
    expect(result?.frames[0]).toMatchObject({ name: 'Frame 0', productUrl: 'https://merchant.example.test/frame-0' })
  })
})
