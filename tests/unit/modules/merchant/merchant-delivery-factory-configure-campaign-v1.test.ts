import {
  planFactoryDraftCampaignConfiguration, MerchantFactoryCampaignConfigConflict,
} from '@/modules/merchant/domain/merchant-delivery-factory-configure-campaign-v1'
import type { MerchantFactoryDryRunV1 } from '@/modules/merchant/domain/merchant-delivery-factory-v1'
const manifest = {
  version: 1, merchantSlug: 'merchant-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'A', logoAssetUrl: null },
  store: { name: 'A Store', selectedFrameIds: ['frame-a'] },
  campaigns: [{
    slug: 'spring', name: 'Spring',
    headline: 'Choose frames', presentationMode: 'EDITORIAL_FIRST',
    journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
    selectedFrameIds: ['frame-a'],
  }],
}
function plan(): MerchantFactoryDryRunV1 {
  return { version: 1, merchantId: 'merchant-a', merchantSlug: 'merchant-a',
    classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL', canApply: false, releaseReady: false,
    blockers: [], warnings: [],
    steps: [
      { resource: 'BRAND', target: 'merchant-a', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'CAMPAIGN', target: 'spring', action: 'UPDATE_DRAFT', changedFields: ['headline', 'journeyPolicy', 'selectedFrameIds'] },
    ] }
}
it('approves only Campaign copy/Journey changes while Catalog selection remains pending', () => {
  const decision = planFactoryDraftCampaignConfiguration({ proposal: manifest, plan: plan(), slug: 'spring' })
  expect(decision).toMatchObject({
    noChange: false, changedFields: ['headline', 'journeyPolicy'],
    patch: { headline: 'Choose frames', journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] } },
  })
  expect(decision.patch).not.toHaveProperty('selectedFrameIds')
})
it('blocks live Campaign/foreign slug/injected approved manifest', () => {
  const p = plan(); p.steps[2].action = 'HUMAN_REVIEW_REQUIRED'
  expect(() => planFactoryDraftCampaignConfiguration({ proposal: manifest, plan: p, slug: 'spring' }))
    .toThrow(MerchantFactoryCampaignConfigConflict)
  expect(() => planFactoryDraftCampaignConfiguration({ proposal: manifest, plan: plan(), slug: 'wrong' })).toThrow()
  expect(() => planFactoryDraftCampaignConfiguration({ proposal: { ...manifest, approved: true }, plan: plan(), slug: 'spring' })).toThrow()
})
