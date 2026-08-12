import { buildPublicExperienceSitemapEntries } from '@/lib/store-discovery-sitemap'

const now = new Date('2026-08-12T00:00:00.000Z')
const later = new Date('2026-08-13T00:00:00.000Z')

function frames(count = 4) {
  return Array.from({ length: count }, (_, index) => ({
    productUrl: `https://merchant.example.test/frame-${index}`,
    updatedAt: now,
  }))
}

function experience(overrides: Record<string, unknown> = {}) {
  return {
    type: 'CAMPAIGN' as const,
    slug: 'petite-fit',
    name: 'Petite Fit',
    status: 'ACTIVE' as const,
    headline: 'Best glasses for petite faces',
    referenceData: false,
    updatedAt: now,
    frames: frames(),
    ...overrides,
  }
}

describe('public discovery sitemap contract', () => {
  it('includes indexable live entries and excludes reference, thin, and private entries', () => {
    const entries = buildPublicExperienceSitemapEntries({
      baseUrl: 'https://www.visutry.com',
      merchants: [
        {
          slug: 'live-merchant',
          name: 'Live Merchant',
          websiteUrl: 'https://merchant.example.test',
          pilotType: 'LIVE',
          referenceData: false,
          sponsoredUsagePolicyKey: null,
          updatedAt: now,
          experiences: [experience()],
        },
        {
          slug: 'reference-merchant',
          name: 'Reference Merchant',
          websiteUrl: 'https://reference.example.test',
          pilotType: 'REFERENCE',
          referenceData: true,
          sponsoredUsagePolicyKey: null,
          updatedAt: now,
          experiences: [experience({ slug: 'reference-edit', referenceData: true })],
        },
        {
          slug: 'thin-merchant',
          name: 'Thin Merchant',
          websiteUrl: 'https://thin.example.test',
          pilotType: 'LIVE',
          referenceData: false,
          sponsoredUsagePolicyKey: null,
          updatedAt: now,
          experiences: [experience({ slug: 'thin-edit', frames: frames(3) })],
        },
        {
          slug: 'private-merchant',
          name: 'Private Merchant',
          websiteUrl: 'https://private.example.test',
          pilotType: 'LIVE',
          referenceData: false,
          sponsoredUsagePolicyKey: null,
          updatedAt: now,
          experiences: [experience({ slug: 'draft-edit', status: 'DRAFT' })],
        },
      ],
    })

    expect(entries).toHaveLength(1)
    expect(entries[0].url).toBe('https://www.visutry.com/en/c/live-merchant/petite-fit')
    expect(entries[0].lastModified).toEqual(now)
  })

  it('prefers the active Store and uses the latest merchant/experience/frame date', () => {
    const entries = buildPublicExperienceSitemapEntries({
      baseUrl: 'https://www.visutry.com',
      merchants: [{
        slug: 'live-merchant',
        name: 'Live Merchant',
        websiteUrl: 'https://merchant.example.test',
        pilotType: 'LIVE',
        referenceData: false,
        sponsoredUsagePolicyKey: null,
        updatedAt: now,
        experiences: [
          experience({ type: 'STORE', slug: 'store', updatedAt: later }),
          experience({ type: 'STORE', slug: 'old-store', status: 'ARCHIVED' }),
        ],
      }],
    })

    expect(entries).toHaveLength(1)
    expect(entries[0].url).toBe('https://www.visutry.com/en/store/live-merchant')
    expect(entries[0].lastModified).toEqual(later)
  })
})
