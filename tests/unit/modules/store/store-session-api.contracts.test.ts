import { parseCreateSessionRequest } from '@/modules/store/contracts'
import { getPublicMerchantProfile } from '@/modules/store/application/get-public-merchant'
import { StoreDomainError } from '@/modules/store/domain'

describe('STORE-2 contracts and merchant resolution', () => {
  it('requires merchantSlug for session creation', () => {
    expect(parseCreateSessionRequest({}).ok).toBe(false)
    const ok = parseCreateSessionRequest({ merchantSlug: 'luna-optical', locale: 'en' })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.data.merchantSlug).toBe('luna-optical')
  })

  it('hides inactive merchants behind shopper-safe unavailable error', async () => {
    await expect(
      getPublicMerchantProfile({
        merchants: {
          findBySlug: async () => ({
            id: 'm1',
            slug: 'luna-optical',
            name: 'Luna',
            logoUrl: null,
            websiteUrl: null,
            contactEmail: null,
            accentColor: null,
            status: 'SUSPENDED',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          findById: async () => null,
          listAllAdmin: async () => [],
        },
        frames: {
          findActiveByMerchant: async () => [],
          findByMerchantAndId: async () => null,
          findActiveByMerchantAndId: async () => null,
        },
        slug: 'luna-optical',
      }),
    ).rejects.toBeInstanceOf(StoreDomainError)
  })

  it('returns public profile without contact email', async () => {
    const profile = await getPublicMerchantProfile({
      merchants: {
        findBySlug: async () => ({
          id: 'm1',
          slug: 'luna-optical',
          name: 'Luna Optical',
          logoUrl: 'https://example.com/logo.png',
          websiteUrl: 'https://example.com',
          contactEmail: 'secret@example.com',
          accentColor: '#1F4B5A',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findById: async () => null,
        listAllAdmin: async () => [],
      },
      frames: {
        findActiveByMerchant: async () =>
          Array.from({ length: 16 }).map((_, i) => ({
            id: `f${i}`,
            merchantId: 'm1',
            sku: `SKU-${i}`,
            name: `Frame ${i}`,
            imageUrl: null,
            imageAssetId: null,
            productUrl: null,
            price: 1000,
            currency: 'usd',
            shape: 'round',
            material: null,
            color: null,
            widthClass: null,
            styleTags: [],
            source: 'SEED' as const,
            externalId: null,
            enrichmentStatus: 'APPROVED' as const,
            status: 'ACTIVE' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        findByMerchantAndId: async () => null,
        findActiveByMerchantAndId: async () => null,
      },
      slug: 'luna-optical',
    })

    expect(profile.name).toBe('Luna Optical')
    expect(profile.activeFrameCount).toBe(16)
    expect(profile.featuredFrames).toHaveLength(4)
    expect(profile.featuredFrames[0]).toEqual({
      id: 'f0',
      name: 'Frame 0',
      imageUrl: null,
      shape: 'round',
      color: null,
    })
    expect(profile).not.toHaveProperty('contactEmail')
  })
})
