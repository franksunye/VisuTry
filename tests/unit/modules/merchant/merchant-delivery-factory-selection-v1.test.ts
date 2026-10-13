import { planFactoryDraftSelection } from '@/modules/merchant/domain/merchant-delivery-factory-selection-v1'
import type { MerchantFactoryDryRunV1 } from '@/modules/merchant/domain/merchant-delivery-factory-v1'
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['f1', 'f2'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['f2', 'f1'] },
  campaigns: [{ slug: 'fall', name: 'Fall', selectedFrameIds: ['f1'] }],
}
function plan(): MerchantFactoryDryRunV1 {
  return {
    version: 1, merchantId: 'm-a', merchantSlug: 'store-a',
    classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [], warnings: [],
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'STORE', target: 'default', action: 'UPDATE_DRAFT', changedFields: ['selectedFrameIds'] },
      { resource: 'CAMPAIGN', target: 'fall', action: 'NO_CHANGE', changedFields: [] },
    ],
  }
}
it('permits only a bounded Store selection change with other steps unchanged', () => {
  expect(planFactoryDraftSelection({ proposal: manifest, plan: plan(), target: { type: 'STORE' } }))
    .toMatchObject({ desiredFrameIds: ['f2', 'f1'], noChange: false })
})
it('permits only frame selection despite pending DRAFT copy or Campaign work', () => {
  const p = plan()
  p.steps[1].changedFields.push('headline')
  p.steps[2].action = 'CREATE_DRAFT'
  expect(planFactoryDraftSelection({ proposal: manifest, plan: p, target: { type: 'STORE' } }))
    .toMatchObject({ desiredFrameIds: ['f2', 'f1'], noChange: false })
  const copyOnly = plan()
  copyOnly.steps[1].changedFields = ['headline']
  expect(planFactoryDraftSelection({ proposal: manifest, plan: copyOnly, target: { type: 'STORE' } }))
    .toMatchObject({ noChange: true })
})
it('blocks live-impacting plans, Catalog blockers and injected approval', () => {
  const p2 = plan(); p2.steps[1].action = 'HUMAN_REVIEW_REQUIRED'
  expect(() => planFactoryDraftSelection({ proposal: manifest, plan: p2, target: { type: 'STORE' } })).toThrow()
  const p3 = plan(); p3.blockers.push('unsafe frame')
  expect(() => planFactoryDraftSelection({ proposal: manifest, plan: p3, target: { type: 'STORE' } })).toThrow()
  const p4 = plan(); p4.steps[2].action = 'HUMAN_REVIEW_REQUIRED'
  expect(() => planFactoryDraftSelection({ proposal: manifest, plan: p4, target: { type: 'STORE' } })).toThrow()
  expect(() => planFactoryDraftSelection({
    proposal: { ...manifest, approved: true }, plan: plan(), target: { type: 'STORE' },
  })).toThrow()
})
it('allows independently approved Draft Campaign selection only when Store is unchanged', () => {
  const p = plan()
  p.steps[1].action = 'NO_CHANGE'; p.steps[1].changedFields = []
  p.steps[2].action = 'UPDATE_DRAFT'; p.steps[2].changedFields = ['selectedFrameIds']
  expect(planFactoryDraftSelection({
    proposal: manifest, plan: p, target: { type: 'CAMPAIGN', slug: 'fall' },
  })).toMatchObject({ desiredFrameIds: ['f1'], noChange: false })
})
