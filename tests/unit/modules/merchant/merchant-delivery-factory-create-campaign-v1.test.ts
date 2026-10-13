import {
  planFactoryDraftCampaignCreation,
} from '@/modules/merchant/domain/merchant-delivery-factory-create-campaign-v1'
import type { MerchantFactoryDryRunV1 } from '@/modules/merchant/domain/merchant-delivery-factory-v1'

const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-1'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['frame-1'] },
  campaigns: [{ slug: 'fall', name: 'Fall', presentationMode: 'EDITORIAL_FIRST', selectedFrameIds: ['frame-1'] }],
}
function plan(): MerchantFactoryDryRunV1 {
  return {
    version: 1, merchantSlug: 'store-a', merchantId: 'tenant-a',
    classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [], warnings: [],
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'CAMPAIGN', target: 'fall', action: 'CREATE_DRAFT', changedFields: ['name'] },
    ],
  }
}
it('prepares only one approved Draft Campaign, never its Catalog selection', () => {
  expect(planFactoryDraftCampaignCreation({ proposal: manifest, plan: plan(), slug: 'fall' })).toMatchObject({
    slug: 'fall', name: 'Fall', pending: ['selectedFrameIds', 'journeyPolicy', 'deliveryPolicy'],
  })
})
it('permits pending Draft Store configuration while creating one Draft Campaign', () => {
  const p = plan(); p.steps[1].action = 'UPDATE_DRAFT'
  p.steps[1].changedFields = ['headline', 'selectedFrameIds']
  expect(planFactoryDraftCampaignCreation({ proposal: manifest, plan: p, slug: 'fall' }))
    .toMatchObject({ slug: 'fall', name: 'Fall' })
})
it('rejects live-resource changes, existing Campaign, missing selected product and injected approval', () => {
  const live = plan(); live.steps[1].action = 'HUMAN_REVIEW_REQUIRED'
  expect(() => planFactoryDraftCampaignCreation({ proposal: manifest, plan: live, slug: 'fall' })).toThrow()
  const existing = plan(); existing.steps[2].action = 'NO_CHANGE'
  expect(() => planFactoryDraftCampaignCreation({ proposal: manifest, plan: existing, slug: 'fall' })).toThrow()
  expect(() => planFactoryDraftCampaignCreation({ proposal: manifest, plan: plan(), slug: 'other' })).toThrow()
  expect(() => planFactoryDraftCampaignCreation({
    proposal: { ...manifest, campaigns: [{ ...manifest.campaigns[0], selectedFrameIds: [] }] },
    plan: plan(), slug: 'fall',
  })).toThrow()
  expect(() => planFactoryDraftCampaignCreation({
    proposal: { ...manifest, approved: true }, plan: plan(), slug: 'fall',
  })).toThrow()
})
