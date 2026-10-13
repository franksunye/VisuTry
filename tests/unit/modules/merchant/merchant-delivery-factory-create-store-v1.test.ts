import {
  planFactoryDraftStoreCreation,
  MerchantFactoryCreateStoreConflict,
} from '@/modules/merchant/domain/merchant-delivery-factory-create-store-v1'
import type { MerchantFactoryDryRunV1 } from '@/modules/merchant/domain/merchant-delivery-factory-v1'

const manifest = {
  version: 1,
  merchantSlug: 'store-a',
  classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-1'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', headline: 'Find a frame', selectedFrameIds: ['frame-1'] },
  campaigns: [],
}
function plan(): MerchantFactoryDryRunV1 {
  return {
    version: 1, classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    merchantId: 'tenant-a', merchantSlug: 'store-a',
    blockers: [], warnings: [], canApply: false, releaseReady: false,
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'STORE', target: 'default', action: 'CREATE_DRAFT', changedFields: ['name', 'selectedFrameIds'] },
    ],
  }
}
describe('Factory approved Draft Store creation preflight', () => {
  it('allows a single new private Store shell without implying frame selection or publication', () => {
    expect(planFactoryDraftStoreCreation({ proposal: manifest, plan: plan() })).toMatchObject({
      name: 'Store A', headline: 'Find a frame',
      pending: ['selectedFrameIds', 'presentationMode', 'journeyPolicy', 'deliveryPolicy'],
    })
  })
  it('does not block a Store shell merely because another DRAFT Campaign remains pending', () => {
    const p = plan()
    p.steps.push({ resource: 'CAMPAIGN', target: 'fall', action: 'CREATE_DRAFT', changedFields: ['name'] })
    expect(planFactoryDraftStoreCreation({ proposal: manifest, plan: p }))
      .toMatchObject({ name: 'Store A', pending: expect.arrayContaining(['selectedFrameIds']) })
  })
  it('fails closed on an existing, live or ambiguous Store, or other proposed work', () => {
    for (const action of ['UPDATE_DRAFT', 'HUMAN_REVIEW_REQUIRED', 'NO_CHANGE'] as const) {
      const p = plan()
      p.steps[1].action = action
      expect(() => planFactoryDraftStoreCreation({ proposal: manifest, plan: p })).toThrow(MerchantFactoryCreateStoreConflict)
    }
    const p = plan()
    p.steps[0].action = 'HUMAN_REVIEW_REQUIRED'
    expect(() => planFactoryDraftStoreCreation({ proposal: manifest, plan: p })).toThrow()
  })
  it('rejects blockers, empty selected Catalog, wrong merchant slug and injected approval', () => {
    const p = plan(); p.blockers.push('foreign frame')
    expect(() => planFactoryDraftStoreCreation({ proposal: manifest, plan: p })).toThrow()
    expect(() => planFactoryDraftStoreCreation({
      proposal: { ...manifest, store: { ...manifest.store, selectedFrameIds: [] } }, plan: plan(),
    })).toThrow()
    expect(() => planFactoryDraftStoreCreation({ proposal: { ...manifest, merchantSlug: 'foreign' }, plan: plan() })).toThrow()
    expect(() => planFactoryDraftStoreCreation({ proposal: { ...manifest, approved: true }, plan: plan() })).toThrow()
  })
})
