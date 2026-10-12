import {
  buildMerchantFactoryDryRunV1,
  merchantDeliveryManifestV1Schema,
  type FactorySnapshotV1,
} from '@/modules/merchant/domain/merchant-delivery-factory-v1'

const proposed = {
  version: 1,
  merchantSlug: 'store-alpha',
  classification: 'TEST',
  catalog: { sourceMethod: 'CSV', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Store Alpha', logoAssetUrl: null },
  store: {
    name: 'Store Alpha',
    headline: 'Find a better fit',
    description: null,
    presentationMode: 'PRODUCT_FIRST',
    journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] },
    deliveryPolicy: { kioskEnabled: false, kioskIdleTimeoutSeconds: 120 },
    selectedFrameIds: ['frame-a'],
  },
  campaigns: [{
    slug: 'fall-edit',
    name: 'Fall Edit',
    headline: 'New eyewear',
    description: null,
    presentationMode: 'EDITORIAL_FIRST',
    selectedFrameIds: ['frame-a'],
  }],
}

function fixture(merchantSlug = 'store-alpha'): FactorySnapshotV1 {
  return {
    merchantId: merchantSlug + '-id',
    merchantSlug,
    classification: 'TEST',
    brandDisplayName: 'Store Alpha',
    logoAssetUrl: null,
    activeFrameIds: ['frame-a'],
    store: {
      id: merchantSlug + '-store',
      status: 'DRAFT',
      name: 'Store Alpha',
      headline: 'Old headline',
      description: null,
      presentationMode: 'PRODUCT_FIRST',
      journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] },
      deliveryPolicy: { kioskEnabled: false, kioskIdleTimeoutSeconds: 120 },
      selectedFrameIds: ['frame-a'],
    },
    campaigns: [],
  }
}

describe('Merchant Delivery Factory v1 pure manifest and diff', () => {
  it('proposes only changed Draft Store fields and new private Campaign, without applying', () => {
    const snapshot = fixture()
    const immutable = JSON.stringify(snapshot)
    const plan = buildMerchantFactoryDryRunV1(proposed, snapshot)
    expect(plan).toMatchObject({
      version: 1, classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
      merchantId: 'store-alpha-id', blockers: [], canApply: false, releaseReady: false,
    })
    expect(plan.steps).toEqual([
      { resource: 'BRAND', target: 'store-alpha', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'STORE', target: 'default', action: 'UPDATE_DRAFT', changedFields: ['headline'] },
      { resource: 'CAMPAIGN', target: 'fall-edit', action: 'CREATE_DRAFT',
        changedFields: expect.arrayContaining(['name', 'selectedFrameIds']) },
    ])
    expect(JSON.stringify(snapshot)).toBe(immutable)
  })

  it('is deterministic and idempotent against equivalent persisted Drafts, for two independent tenant fixtures', () => {
    for (const name of ['store-alpha', 'store-beta']) {
      const manifest = { ...proposed, merchantSlug: name }
      const snapshot = fixture(name)
      snapshot.brandDisplayName = manifest.brand.displayName
      snapshot.store!.headline = manifest.store.headline
      snapshot.campaigns = [{
        id: name + '-campaign',
        status: 'DRAFT',
        slug: 'fall-edit',
        name: 'Fall Edit',
        headline: 'New eyewear',
        description: null,
        presentationMode: 'EDITORIAL_FIRST',
        journeyPolicy: null,
        deliveryPolicy: null,
        selectedFrameIds: ['frame-a'],
      }]
      const a = buildMerchantFactoryDryRunV1(manifest, snapshot)
      const b = buildMerchantFactoryDryRunV1(manifest, snapshot)
      expect(a).toEqual(b)
      expect(a.blockers).toEqual([])
      expect(a.steps.every(step => step.action === 'NO_CHANGE')).toBe(true)
      expect(a.canApply).toBe(false)
    }
  })

  it('accepts canonical commercial classifications but flags classification changes for Human review', () => {
    for (const classification of ['REAL', 'POSSIBLE_EXTERNAL', 'INTERNAL', 'AUTOMATION', 'REFERENCE'] as const) {
      const manifest = { ...proposed, classification }
      const snapshot = fixture()
      const plan = buildMerchantFactoryDryRunV1(manifest, snapshot)
      expect(plan.blockers).toContain('Merchant classification changes are Human-only and require independent verification')
      expect(plan.canApply).toBe(false)
    }
    expect(() => merchantDeliveryManifestV1Schema.parse({ ...proposed, classification: 'LIVE' })).toThrow()
  })

  it('never mutates an Active Store, even when the requested copy differs', () => {
    const snapshot = fixture()
    snapshot.store!.status = 'ACTIVE'
    const plan = buildMerchantFactoryDryRunV1(proposed, snapshot)
    expect(plan.steps[1]).toMatchObject({
      action: 'HUMAN_REVIEW_REQUIRED', changedFields: ['headline'],
    })
    expect(plan.blockers[0]).toContain('separate authenticated Human action')
    expect(plan.canApply).toBe(false)
  })

  it('refuses a foreign tenant and cross-merchant or inactive frame references', () => {
    expect(() => buildMerchantFactoryDryRunV1(proposed, fixture('store-beta'))).toThrow('FACTORY_TENANT_MISMATCH')
    const snapshot = fixture()
    snapshot.activeFrameIds = []
    const plan = buildMerchantFactoryDryRunV1(proposed, snapshot)
    expect(plan.blockers).toEqual(expect.arrayContaining([
      'Catalog resource is missing, inactive, or not tenant-owned: frame-a',
      'Selected frame is not active and tenant-owned: frame-a',
    ]))
  })

  it('requires Human brand/media review and never auto-deletes extra Catalog or Campaign items', () => {
    const snapshot = fixture()
    snapshot.activeFrameIds.push('existing-extra')
    snapshot.campaigns.push({
      id: 'old-campaign', slug: 'old', status: 'ACTIVE',
      name: 'Existing', headline: null, description: null, presentationMode: null,
      journeyPolicy: null, deliveryPolicy: null, selectedFrameIds: [],
    })
    const manifest = { ...proposed, brand: { displayName: 'Updated Brand', logoAssetUrl: 'https://cdn.example.test/logo.png' } }
    const plan = buildMerchantFactoryDryRunV1(manifest, snapshot)
    expect(plan.steps[0]).toMatchObject({
      action: 'HUMAN_REVIEW_REQUIRED', changedFields: ['displayName', 'logoAssetUrl'],
    })
    expect(plan.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('additional active resources'),
      expect.stringContaining('Existing Campaign old'),
    ]))
    expect(plan.canApply).toBe(false)
  })

  it.each([
    { ...proposed, version: 2 },
    { ...proposed, merchantSlug: '../other' },
    { ...proposed, adminToken: 'must-not-be-accepted' },
    { ...proposed, store: { ...proposed.store, journeyPolicy: { enabledStages: ['TRY_ON'] } } },
    { ...proposed, store: { ...proposed.store, deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 5 } } },
    { ...proposed, store: { ...proposed.store, selectedFrameIds: ['frame-a', 'frame-a'] } },
    { ...proposed, campaigns: [proposed.campaigns[0], proposed.campaigns[0]] },
  ])('rejects malformed or unsafe proposed data before generating any plan', (bad) => {
    expect(() => merchantDeliveryManifestV1Schema.parse(bad)).toThrow()
  })
})
