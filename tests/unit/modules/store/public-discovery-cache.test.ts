import {
  PUBLIC_DISCOVERY_CACHE,
  publicDiscoveryCacheNamespace,
  publicDiscoveryCacheKey,
  publicDiscoveryCacheTags,
} from '@/lib/store-discovery-cache'
import {
  invalidatePublicDiscovery,
  withPublicDiscoveryInvalidation,
} from '@/modules/store/application/public-discovery-invalidation'
import { revalidatePath, revalidateTag } from 'next/cache'

jest.mock('@/lib/cloudflare-public-html-purge', () => ({
  purgePublicHtmlTags: jest.fn(async (tags: readonly string[]) => ({ attempted: true, success: true, urlCount: 0, tagCount: tags.length })),
}))
import { purgePublicHtmlTags } from '@/lib/cloudflare-public-html-purge'
import { publicEdgePathsForRouteMembership } from '@/modules/store/application/public-edge-paths'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }))

describe('public discovery cache contract', () => {
  it('separates Store/Campaign and locale cache keys', () => {
    expect(publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical' })).toEqual([
      expect.stringMatching(/^public-discovery:/), 'public-experience-discovery-v2', 'en', 'luna-optical', 'store',
    ])
    expect(publicDiscoveryCacheKey({ locale: 'en', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' })).toEqual([
      expect.stringMatching(/^public-discovery:/), 'public-experience-discovery-v2', 'en', 'luna-optical', 'petite-fit',
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
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:merchant:luna-optical', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:sitemap', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:route-admission', { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/luna-optical')
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/luna-optical/kiosk')
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]/c/[merchantSlug]/[experienceSlug]', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]/c/[merchantSlug]/[experienceSlug]/kiosk', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemaps/dynamic.xml')

    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'catalog', merchantSlug: 'luna-optical' },
      mutation: async () => 'catalog-updated',
    })
    expect(revalidateTag).toHaveBeenCalledTimes(4)
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:merchant-catalog:luna-optical', { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/luna-optical')
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/luna-optical/kiosk')
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]/c/[merchantSlug]/[experienceSlug]', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]/c/[merchantSlug]/[experienceSlug]/kiosk', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemaps/dynamic.xml')

    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' },
      mutation: async () => 'experience-updated',
    })
    expect(revalidateTag).toHaveBeenCalledTimes(4)
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:experience:luna-optical:petite-fit', { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith('/en/c/luna-optical/petite-fit')
    expect(revalidatePath).toHaveBeenCalledWith('/en/c/luna-optical/petite-fit/kiosk')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemaps/dynamic.xml')
  })

  it('supports a cache-only Store invalidation across canonical Next and Cloudflare boundaries', async () => {
    jest.clearAllMocks()
    const result = await invalidatePublicDiscovery({
      target: { kind: 'store', merchantSlug: 'visutry-demo-optical' },
    })

    expect(result).toMatchObject({
      merchantSlug: 'visutry-demo-optical',
      scope: 'STORE',
      tags: [
        'public-discovery:merchant:visutry-demo-optical',
        'public-discovery:sitemap',
        'public-discovery:route-admission',
        'public-discovery:merchant-catalog:visutry-demo-optical',
        'public-discovery:experience:visutry-demo-optical:store',
      ],
      paths: expect.arrayContaining([
        '/en/store/visutry-demo-optical',
        '/en/store/visutry-demo-optical/kiosk',
        '/[locale]/c/[merchantSlug]/[experienceSlug]',
        '/sitemaps/dynamic.xml',
      ]),
      publicHtmlPurge: { attempted: true, success: true, tagCount: 1 },
    })
    expect(revalidateTag).toHaveBeenCalledTimes(5)
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/visutry-demo-optical')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemaps/dynamic.xml')
    expect(purgePublicHtmlTags).toHaveBeenCalledWith([
      'visutry:public-html:store:en:visutry-demo-optical',
    ])
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

  it('unions before/after exact Store/Campaign Cache-Tags after a committed write', async () => {
    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'catalog', merchantSlug: 'luna-optical' },
      edgeTags: {
        before: ['visutry:public-html:store:en:luna-optical', 'visutry:public-html:campaign:en:luna-optical:old-campaign'],
        after: ['visutry:public-html:store:en:luna-optical', 'visutry:public-html:campaign:en:luna-optical:new-campaign'],
      },
      mutation: async () => 'catalog-updated',
    })
    expect(purgePublicHtmlTags).toHaveBeenCalledWith([
      'visutry:public-html:store:en:luna-optical',
      'visutry:public-html:campaign:en:luna-optical:old-campaign',
      'visutry:public-html:campaign:en:luna-optical:new-campaign',
    ])
  })

  it('purges caller-supplied before and after public route membership tags', async () => {
    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'catalog', merchantSlug: 'luna-optical' },
      edgeTags: {
        before: ['visutry:public-html:store:en:luna-optical', 'visutry:public-html:campaign:en:luna-optical:old-campaign'],
        after: ['visutry:public-html:store:en:luna-optical', 'visutry:public-html:campaign:en:luna-optical:new-campaign'],
      },
      mutation: async () => 'catalog-updated',
    })
    expect(purgePublicHtmlTags).toHaveBeenCalledWith([
      'visutry:public-html:store:en:luna-optical',
      'visutry:public-html:campaign:en:luna-optical:old-campaign',
      'visutry:public-html:campaign:en:luna-optical:new-campaign',
    ])
  })

  it('maps only admitted Store/Campaign members to exact EN edge paths', () => {
    expect(publicEdgePathsForRouteMembership('luna-optical', {
      store: true,
      campaigns: ['petite-fit', 'invalid_slug'],
    })).toEqual([
      '/en/store/luna-optical',
      '/en/c/luna-optical/petite-fit',
    ])
  })

  it('purges both old and new Campaign URLs when a slug changes', async () => {
    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: 'old-campaign' },
      mutation: async () => ({ slug: 'new-campaign' }),
    })
    expect(purgePublicHtmlTags).toHaveBeenCalledWith([
      'visutry:public-html:campaign:en:luna-optical:old-campaign',
      'visutry:public-html:campaign:en:luna-optical:new-campaign',
    ])
  })

  it('does not construct a Campaign tag for a Store result slug', async () => {
    jest.clearAllMocks()
    await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: null },
      mutation: async () => ({ slug: 'store' }),
    })
    expect(purgePublicHtmlTags).toHaveBeenCalledWith([
      'visutry:public-html:store:en:luna-optical',
    ])
  })
})
