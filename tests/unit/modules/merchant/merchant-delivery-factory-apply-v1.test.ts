import {
  MerchantFactoryApplyError,
  planFactoryDraftStoreApplyV1,
} from '@/modules/merchant/domain/merchant-delivery-factory-apply-v1'
import type { MerchantFactoryDryRunV1 } from '@/modules/merchant/domain/merchant-delivery-factory-v1'

const proposal = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Store A' },
  store: { name: 'New Store name', selectedFrameIds: ['frame-a'],
    journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
    deliveryPolicy: { kioskEnabled: false, kioskIdleTimeoutSeconds: 120 },
  },
  campaigns: [],
}
const plan = (): MerchantFactoryDryRunV1 => ({
  version: 1, classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
  merchantId: 'merchant-a', merchantSlug: 'store-a',
  steps: [
    { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE', changedFields: [] },
    { resource: 'STORE', target: 'default', action: 'UPDATE_DRAFT', changedFields: ['name', 'journeyPolicy'] },
  ],
  blockers: [], warnings: [], canApply: false, releaseReady: false,
})

describe('Factory single Draft Store Apply eligibility (pure)', () => {
  it('selects only six safe configuration fields, never Catalog selection or live status', () => {
    expect(planFactoryDraftStoreApplyV1({ proposal, plan: plan() })).toMatchObject({
      merchantSlug: 'store-a', noChange: false,
      changedFields: ['name', 'journeyPolicy'],
      store: { name: 'New Store name', journeyPolicy: proposal.store.journeyPolicy },
    })
    const serialized = JSON.stringify(planFactoryDraftStoreApplyV1({ proposal, plan: plan() }).store)
    expect(serialized).not.toMatch(/selectedFrameIds|status|campaigns|logoAssetUrl|approved/)
  })

  it.each([
    ['inactive catalog', () => { const p = plan(); p.blockers = ['Catalog resource is missing']; return p }],
    ['unreviewed Brand', () => { const p = plan(); p.steps[0].action = 'HUMAN_REVIEW_REQUIRED'; return p }],
    ['new Store', () => { const p = plan(); p.steps[1].action = 'CREATE_DRAFT'; return p }],
    ['live Store', () => { const p = plan(); p.steps[1].action = 'HUMAN_REVIEW_REQUIRED'; return p }],
    ['changed selected frames', () => { const p = plan(); p.steps[1].changedFields = ['selectedFrameIds']; return p }],
    ['changed Hero', () => { const p = plan(); p.steps[1].changedFields = ['heroAssetUrl']; return p }],
    ['stale tenant plan', () => { const p = plan(); p.merchantSlug = 'foreign'; return p }],
    ['forged write authorization', () => { const p = plan(); return { ...p, canApply: true } as unknown as MerchantFactoryDryRunV1 }],
    ['additional Campaign creation', () => {
      const p = plan(); p.steps.push({ resource: 'CAMPAIGN', target: 'fall',
        action: 'CREATE_DRAFT', changedFields: ['name'] }); return p
    }],
  ])('denies %s before any Store write', (_label, makePlan) => {
    expect(() => planFactoryDraftStoreApplyV1({ proposal, plan: makePlan() }))
      .toThrow(MerchantFactoryApplyError)
  })

  it('refuses a zero-product Store even if Plan has no blockers', () => {
    const empty = {
      ...proposal,
      catalog: { sourceMethod: 'MANUAL', expectedFrameIds: [] },
      store: { ...proposal.store, selectedFrameIds: [] },
    }
    expect(() => planFactoryDraftStoreApplyV1({ proposal: empty, plan: plan() }))
      .toThrow(MerchantFactoryApplyError)
  })

  it('accepts an already-matched Store as a no-write replay candidate', () => {
    const p = plan()
    p.steps[1] = { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] }
    expect(planFactoryDraftStoreApplyV1({ proposal, plan: p }).noChange).toBe(true)
  })

  it('rejects injected approved: true in strict manifest, not a write permission', () => {
    expect(() => planFactoryDraftStoreApplyV1({
      proposal: { ...proposal, approved: true }, plan: plan(),
    })).toThrow()
  })
})
