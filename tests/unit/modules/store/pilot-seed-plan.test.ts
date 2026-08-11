import { buildPilotSeedPlan } from '@/modules/store/application/pilot-seed-plan'
import type { PilotCatalogRow, PilotExperienceConfig } from '@/modules/store/application/pilot-delivery-kit'

const catalog: PilotCatalogRow[] = [
  {
    externalId: 'frame-1', sku: 'sku-1', name: 'Frame One', brand: 'Example', productUrl: 'https://example.com/1', imageUrl: 'https://example.com/1.jpg', productType: 'SUNGLASSES', status: 'ACTIVE', variant: null, color: null, price: null, currency: null, shape: 'rectangle', material: null, lensWidthMm: null, bridgeWidthMm: null, templeLengthMm: null, frameWidthMm: null, widthClass: null, styleTags: [], collectionTags: [], sourceNotes: null,
  },
  {
    externalId: 'frame-2', sku: 'sku-2', name: 'Frame Two', brand: 'Example', productUrl: 'https://example.com/2', imageUrl: 'https://example.com/2.jpg', productType: 'SUNGLASSES', status: 'ACTIVE', variant: null, color: null, price: null, currency: null, shape: 'round', material: null, lensWidthMm: null, bridgeWidthMm: null, templeLengthMm: null, frameWidthMm: null, widthClass: null, styleTags: [], collectionTags: [], sourceNotes: null,
  },
]

const experiences: PilotExperienceConfig[] = [
  { experienceSlug: 'default', type: 'STORE', name: 'Store', status: 'ACTIVE', catalogSelection: 'ALL_ACTIVE' },
  { experienceSlug: 'campaign', type: 'CAMPAIGN', name: 'Campaign', status: 'ACTIVE', catalogSelection: ['frame-1'] },
]

describe('pilot seed dry-run plan', () => {
  it('reports create/update/deactivate and ExperienceFrame plans without mutating state', () => {
    const plan = buildPilotSeedPlan({
      catalog,
      experiences,
      snapshot: {
        merchant: { id: 'merchant-1' },
        frames: [
          { sku: 'sku-1', externalId: 'frame-1', source: 'CSV', status: 'ACTIVE' },
          { sku: 'old-sku', externalId: 'old-frame', source: 'CSV', status: 'ACTIVE' },
        ],
        experiences: [{ slug: 'default', type: 'STORE', status: 'ACTIVE', frameCount: 2 }],
      },
    })
    expect(plan.merchant).toEqual({ action: 'UPDATE', id: 'merchant-1' })
    expect(plan.frames).toEqual({ create: 1, update: 1, deactivate: 1 })
    expect(plan.experiences).toEqual({ create: 1, update: 1 })
    expect(plan.experienceFrames).toEqual([
      { slug: 'default', type: 'STORE', action: 'REPLACE', selectedFrameCount: 2 },
      { slug: 'campaign', type: 'CAMPAIGN', action: 'CREATE', selectedFrameCount: 1 },
    ])
    expect(plan.errors).toEqual([])
    expect(plan.warnings).toContain('1 active CSV frame(s) would be deactivated because they are absent from the incoming catalog')
  })

  it('reports non-CSV source ownership as a dry-run error', () => {
    const plan = buildPilotSeedPlan({
      catalog: [catalog[0]],
      experiences: [experiences[0]],
      snapshot: { merchant: { id: 'merchant-1' }, frames: [{ sku: 'sku-1', externalId: 'frame-1', source: 'MANUAL', status: 'ACTIVE' }], experiences: [] },
    })
    expect(plan.errors[0]).toContain('sku-1 (MANUAL)')
  })
})
