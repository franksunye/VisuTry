import {
  PUBLIC_DISCOVERY_CACHE,
  publicDiscoveryCacheNamespace,
  publicDiscoveryCacheKey,
  publicDiscoveryCacheTags,
} from '@/lib/store-discovery-cache'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { revalidatePath, revalidateTag } from 'next/cache'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }))

describe('public discovery cache contract', () => {
  it('separates Store/Campaign and locale cache keys', () => {
    expect(publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical' })).toEqual([
      expect.stringMatching(/^public-discovery:/), 'public-experience-discovery', 'en', 'luna-optical', 'store',
    ])
    expect(publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' })).toEqual([
      expect.stringMatching(/^public-discovery:/), 'public-experience-discovery', 'en', 'luna-optical', 'petite-fit',
    ])
    expect(publicDiscoveryCacheKey({ locale: 'de', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' })).not.toEqual(
      publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' }),
    )
  })

  it('keeps persistent discovery namespaces separate across app environments and databases', () => {
    const local = publicDiscoveryCacheNamespace({
      APP_ENV: 'local',
      VISUTRY_DATABASE_IDENTITY: 'local:visutry_local',
    })
    const preview = publicDiscoveryCacheNamespace({
      APP_ENV: 'preview',
      VISUTRY_DATABASE_IDENTITY: 'neon:preview-branch',
    })
    const production = publicDiscoveryCacheNamespace({
      APP_ENV: 'production',
      VISUTRY_DATABASE_IDENTITY: 'neon:production-branch',
    })

    expect(new Set([local, preview, production]).size).toBe(3)
    expect(local).not.toContain('postgresql://')
    expect(preview).not.toContain('postgresql://')
    expect(production).not.toContain('postgresql://')
  })

  it('uses granular merchant/catalog/experience tags and conservative TTLs', () => {
    expect(publicDiscoveryCacheTags('luna-optical', 'petite-fit')).toEqual([
      'public-discovery:merchant:luna-optical',
      'public-discovery:merchant-catalog:luna-optical',
      'public-discovery:experience:luna-optical:petite-fit',
    ])
    expect(PUBLIC_DISCOVERY_CACHE.storeRevalidateSeconds).toBe(604800)
    expect(PUBLIC_DISCOVERY_CACHE.campaignRevalidateSeconds).toBe(604800)
    expect(PUBLIC_DISCOVERY_CACHE.sitemapRevalidateSeconds).toBe(604800)
  })

  it('maps semantic writes to the smallest correct invalidation fanout', async () => {
    await withPublicDiscoveryInvalidation({
      target: { kind: 'merchant', merchantSlug: 'luna-optical' },
      mutation: async () => 'merchant-updated',
    })
    expect(revalidateTag).toHaveBeenCalledTimes(3)
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:merchant:luna-optical')
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:sitemap')
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:route-admission')
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/luna-optical')
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]/c/[merchantSlug]/[experienceSlug]', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemaps/dynamic.xml')

    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'catalog', merchantSlug: 'luna-optical' },
      mutation: async () => 'catalog-updated',
    })
    expect(revalidateTag).toHaveBeenCalledTimes(4)
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:merchant-catalog:luna-optical')
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/luna-optical')
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]/c/[merchantSlug]/[experienceSlug]', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemaps/dynamic.xml')

    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' },
      mutation: async () => 'experience-updated',
    })
    expect(revalidateTag).toHaveBeenCalledTimes(4)
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:experience:luna-optical:petite-fit')
    expect(revalidatePath).toHaveBeenCalledWith('/en/c/luna-optical/petite-fit')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemaps/dynamic.xml')
  })

  it('does not invalidate when the mutation rejects', async () => {
    jest.clearAllMocks()
    await expect(withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' },
      mutation: async () => { throw new Error('write failed') },
    })).rejects.toThrow('write failed')
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('supports idempotent mutations without invalidating when no row changed', async () => {
    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: null },
      mutation: async () => ({ created: false }),
      invalidate: (result) => result.created,
    })
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
