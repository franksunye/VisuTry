import {
  PUBLIC_DISCOVERY_CACHE,
  publicDiscoveryCacheKey,
  publicDiscoveryCacheTags,
} from '@/lib/store-discovery-cache'

describe('public discovery cache contract', () => {
  it('separates Store/Campaign and locale cache keys', () => {
    expect(publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical' })).toEqual([
      'public-experience-discovery', 'en', 'luna-optical', 'store',
    ])
    expect(publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' })).toEqual([
      'public-experience-discovery', 'en', 'luna-optical', 'petite-fit',
    ])
    expect(publicDiscoveryCacheKey({ locale: 'de', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' })).not.toEqual(
      publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' }),
    )
  })

  it('uses granular merchant/catalog/experience tags and conservative TTLs', () => {
    expect(publicDiscoveryCacheTags('luna-optical', 'petite-fit')).toEqual([
      'public-discovery:merchant:luna-optical',
      'public-discovery:merchant-catalog:luna-optical',
      'public-discovery:experience:luna-optical:petite-fit',
    ])
    expect(PUBLIC_DISCOVERY_CACHE.storeRevalidateSeconds).toBe(1800)
    expect(PUBLIC_DISCOVERY_CACHE.campaignRevalidateSeconds).toBe(300)
    expect(PUBLIC_DISCOVERY_CACHE.sitemapRevalidateSeconds).toBe(1800)
  })
})
