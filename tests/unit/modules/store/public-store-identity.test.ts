import { getPublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'

const CANARY_ID = 'cmsq1vcg3000049fy2ngsqplk'
const CANARY_STORE_ID = 'cmsq1ve9t000749fyxqwr4xj4'
const OPTICAL_ID = 'bde10238-b0ec-485c-baf6-cb3b8dd71810'
const now = new Date('2026-10-10T00:00:00.000Z')

const canary = {
  id: CANARY_ID, slug: 'visutry-demo', name: 'VisuTry Demo', status: 'ACTIVE',
  classification: 'REAL', pilotType: 'LIVE', sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
  websiteUrl: null, logoUrl: null, accentColor: null, referenceData: false, updatedAt: now,
}
const optical = {
  id: OPTICAL_ID, slug: 'visutry-demo-optical', name: 'VisuTry Demo Optical', status: 'ACTIVE',
  classification: 'TEST', pilotType: 'DEMO', commercialExceptionCode: 'VISUTRY_DEMO',
  sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
  websiteUrl: null, logoUrl: null, accentColor: null, referenceData: false, updatedAt: now,
}
const stores: Record<string, Record<string, unknown>> = {
  [CANARY_ID]: {
    id: CANARY_STORE_ID, merchantId: CANARY_ID, type: 'STORE', slug: 'store',
    status: 'ACTIVE', name: 'VisuTry Demo Store', headline: 'VisuTry Demo',
    description: null, heroAssetUrl: null, referenceData: false, updatedAt: now,
  },
  [OPTICAL_ID]: {
    id: 'optical-store-fixture', merchantId: OPTICAL_ID, type: 'STORE', slug: 'store',
    status: 'ACTIVE', name: 'VisuTry Demo Optical Store', headline: 'Demo Optical',
    description: null, heroAssetUrl: null, referenceData: false, updatedAt: now,
  },
}
const campaign = {
  id: 'canary-campaign-fixture', merchantId: CANARY_ID, type: 'CAMPAIGN',
  slug: 'everyday-fit', status: 'ACTIVE', name: 'Everyday Fit',
  headline: 'Everyday Fit', description: null, heroAssetUrl: null,
  referenceData: false, updatedAt: now,
}

function repositories() {
  const merchants = {
    findPublicBySlug: jest.fn(async (slug: string) =>
      slug === canary.slug ? canary : slug === optical.slug ? optical : null),
  }
  const experiences = {
    findPublicStoreByMerchant: jest.fn(async (merchantId: string) => stores[merchantId] ?? null),
    findPublicCampaignByMerchantAndSlug: jest.fn(async (merchantId: string, slug: string) =>
      merchantId === CANARY_ID && slug === 'everyday-fit' ? campaign : null),
  }
  const frames = {
    findPublicActiveByMerchantAndExperience: jest.fn(async (merchantId: string) =>
      Array.from({ length: 4 }, (_, index) => ({
        id: merchantId + '-frame-' + index, name: 'Test frame ' + index,
        brand: 'Fixture', imageUrl: 'https://example.test/frame.jpg',
        productUrl: 'https://example.test/product', price: 10000, currency: 'usd',
        shape: 'round', material: 'acetate', color: 'black',
        widthClass: 'medium', updatedAt: now,
      }))),
  }
  return { merchants, experiences, frames }
}

describe('independent public Store identity: Canary vs Demo Optical', () => {
  it.each([
    ['visutry-demo', CANARY_ID, CANARY_STORE_ID],
    ['visutry-demo-optical', OPTICAL_ID, 'optical-store-fixture'],
  ])('resolves %s to its own merchant %s and Store %s', async (slug, merchantId, storeId) => {
    const repositoriesForRead = repositories()
    const discovery = await getPublicExperienceDiscovery({
      ...repositoriesForRead, slug,
    } as never)

    expect(discovery).toMatchObject({
      merchant: { id: merchantId, slug },
      experience: { id: storeId, merchantId, type: 'STORE' },
    })
    expect(repositoriesForRead.experiences.findPublicStoreByMerchant)
      .toHaveBeenCalledWith(merchantId)
  })

  it('preserves the Canary Campaign under the Canary merchant only', async () => {
    const repositoriesForRead = repositories()
    const discovery = await getPublicExperienceDiscovery({
      ...repositoriesForRead, slug: 'visutry-demo', experienceSlug: 'everyday-fit',
    } as never)

    expect(discovery).toMatchObject({
      merchant: { id: CANARY_ID, slug: 'visutry-demo' },
      experience: { id: 'canary-campaign-fixture', merchantId: CANARY_ID, type: 'CAMPAIGN' },
    })
    expect(repositoriesForRead.experiences.findPublicCampaignByMerchantAndSlug)
      .toHaveBeenCalledWith(CANARY_ID, 'everyday-fit')
  })

  it('fails closed if a Store repository returns a different tenant Experience', async () => {
    const repositoriesForRead = repositories()
    repositoriesForRead.experiences.findPublicStoreByMerchant
      .mockResolvedValueOnce(stores[OPTICAL_ID])
    const discovery = await getPublicExperienceDiscovery({
      ...repositoriesForRead, slug: 'visutry-demo',
    } as never)
    expect(discovery).toBeNull()
  })
})
