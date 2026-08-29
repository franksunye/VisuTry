import { publicMerchantFromDiscovery } from '@/modules/store/application/get-public-merchant'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'

const date = new Date('2026-08-12T00:00:00.000Z')

describe('publicMerchantFromDiscovery', () => {
  it('maps the RSC discovery subset without billing fields', () => {
    const discovery: PublicExperienceDiscovery = {
      merchant: {
        id: 'merchant-1',
        slug: 'ello-sunglasses',
        name: 'ello sunglasses',
        logoUrl: null,
        websiteUrl: 'https://ello.example',
        accentColor: '#1D4ED8',
        generativeTryOnAvailable: true,
        referenceData: true,
        pilotType: 'REFERENCE',
        updatedAt: date,
      },
      experience: {
        id: 'experience-1',
        merchantId: 'merchant-1',
        type: 'STORE',
        slug: 'store',
        name: 'Store',
        status: 'ACTIVE',
        headline: null,
        description: null,
        heroAssetUrl: null,
        presentationMode: null,
        referenceData: true,
        updatedAt: date,
      },
      frames: [{
        id: 'frame-1',
        name: 'Harper',
        brand: 'ello',
        imageUrl: null,
        productUrl: 'https://ello.example/harper',
        price: 12000,
        currency: 'usd',
        shape: 'round',
        material: 'acetate',
        color: 'black',
        widthClass: 'medium',
        updatedAt: date,
      }],
      experiencePolicy: {
        tryOnEnabled: true,
        compareEnabled: true,
        maxCompareFrames: 2,
        inquiryEnabled: false,
      },
      guestSponsoredTryOnLimit: 1,
      visibility: 'PUBLIC_NOINDEX',
      lastModified: date,
    }

    const profile = publicMerchantFromDiscovery(discovery)
    expect(profile.slug).toBe('ello-sunglasses')
    expect(profile.guestSponsoredTryOnLimit).toBe(1)
    expect(profile.experiencePolicy.maxCompareFrames).toBe(2)
    expect(profile.featuredFrames).toHaveLength(1)
    expect(profile.featuredFrames[0]?.productBrand).toBe('ello')
    expect(JSON.stringify(profile)).not.toMatch(/planCode|commerceSessionAllowance|standardRenderAllowance/i)
  })
})
