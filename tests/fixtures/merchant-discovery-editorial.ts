import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'

/** Synthetic public-read fixture; never used as Production merchant data. */
export function makeCanaryEditorialDiscovery(): PublicExperienceDiscovery {
  const date = new Date('2026-11-21T00:00:00.000Z')
  return {
    merchant: {
      id: 'canary-merchant', slug: 'visutry-demo', name: 'VisuTry Demo', logoUrl: null,
      websiteUrl: null, accentColor: '#123456',
      generativeTryOnAvailable: false, referenceData: false, pilotType: 'LIVE', updatedAt: date,
    },
    experience: {
      id: 'canary-campaign', merchantId: 'canary-merchant', type: 'CAMPAIGN', slug: 'everyday-fit',
      name: 'Everyday Fit', status: 'ACTIVE', headline: 'The original Campaign headline',
      description: 'The original Campaign description.', heroAssetUrl: null,
      primaryHandoff: null, secondaryHandoff: null,
      deliveryPolicy: { kioskEnabled: false, kioskIdleTimeoutSeconds: 120 },
      referenceData: false, updatedAt: date,
    },
    frames: ['round', 'rectangle', 'oval', 'browline', 'aviator', 'cat-eye'].map((shape) => ({
      id: `canary-${shape}`, name: `Canary ${shape}`, brand: 'VisuTry',
      imageUrl: `https://cdn.example.test/canary-${shape}.jpg`,
      productUrl: `https://www.visutry.com/en/demo/frames/${shape}`, price: null, currency: null, shape,
      material: shape === 'round' ? 'acetate appearance' : null,
      color: shape === 'round' ? 'black' : null,
      widthClass: null, updatedAt: date,
    })),
    experiencePolicy: { tryOnEnabled: false, compareEnabled: false, maxCompareFrames: 2, inquiryEnabled: false },
    guestSponsoredTryOnLimit: null,
    visibility: 'PUBLIC_INDEX',
    lastModified: date,
  }
}
