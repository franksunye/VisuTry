import type { MerchantStoreWorkspace, MerchantStoreWorkspaceFrame } from '@/modules/merchant/application/merchant-store-workspace'
import { resolveMerchantStoreWorkspacePresentation } from '@/modules/merchant/application/merchant-store-workspace-presentation'

function frame(overrides: Partial<MerchantStoreWorkspaceFrame> = {}): MerchantStoreWorkspaceFrame {
  return {
    id: 'frame-a',
    sku: 'SKU-A',
    externalId: null,
    productUrl: null,
    name: 'Frame A',
    brand: 'North Star',
    imageUrl: 'https://cdn.example.test/frame-a.png',
    price: 12000,
    currency: 'USD',
    shape: 'round',
    source: 'MANUAL',
    status: 'ACTIVE',
    enrichmentStatus: 'APPROVED',
    validation: { valid: true, importReady: true, recommendationReady: true, enrichmentStatus: 'APPROVED', issues: [], importIssues: [], recommendationIssues: [], warnings: [] },
    storeReadiness: { storeEligible: true, issues: [] },
    ...overrides,
  }
}

function workspace(overrides: Partial<MerchantStoreWorkspace> = {}): MerchantStoreWorkspace {
  return {
    store: { id: 'store-a', slug: 'store-a', name: 'North Star Store', status: 'DRAFT', headline: null, description: null, publicPath: '/en/store/north-star', selectedFrameIds: ['frame-a'] },
    catalog: [frame()],
    ...overrides,
  }
}

describe('Merchant Store workspace presentation', () => {
  it('makes a healthy Draft preview the primary action and keeps Publish separate', () => {
    const result = resolveMerchantStoreWorkspacePresentation(workspace())

    expect(result).toMatchObject({ lifecycle: 'DRAFT', primaryAction: 'PREVIEW_STORE', canPreview: true, canPublish: true, selectedCount: 1 })
    expect(result.attention).toEqual([])
  })

  it('routes missing or ineligible selected products to Catalog and blocks publishing', () => {
    const result = resolveMerchantStoreWorkspacePresentation(workspace({
      store: { ...workspace().store!, selectedFrameIds: ['frame-a', 'frame-missing'] },
      catalog: [frame({ storeReadiness: { storeEligible: false, issues: ['MISSING_IMAGE_URL'] } })],
    }))

    expect(result.primaryAction).toBe('REVIEW_CATALOG')
    expect(result.attention.map((item) => item.code)).toEqual(['SELECTED_PRODUCT_MISSING', 'SELECTED_PRODUCT_INELIGIBLE'])
    expect(result.canPublish).toBe(false)
  })

  it('keeps a healthy Draft with no selected products as product-management work', () => {
    const result = resolveMerchantStoreWorkspacePresentation(workspace({
      store: { ...workspace().store!, selectedFrameIds: [] },
    }))

    expect(result.primaryAction).toBe('MANAGE_PRODUCTS')
    expect(result.attention[0]?.code).toBe('STORE_HAS_NO_PRODUCTS')
    expect(result.canPreview).toBe(false)
  })

  it('routes a missing Store with no Store-eligible products to Catalog', () => {
    const result = resolveMerchantStoreWorkspacePresentation(workspace({
      store: null,
      catalog: [frame({ storeReadiness: { storeEligible: false, issues: ['MISSING_IMAGE_URL'] } })],
    }))

    expect(result.primaryAction).toBe('REVIEW_CATALOG')
  })

  it('treats a Live Store as live-view work, never a republish action', () => {
    const result = resolveMerchantStoreWorkspacePresentation(workspace({
      store: { ...workspace().store!, status: 'ACTIVE' },
    }))

    expect(result).toMatchObject({ lifecycle: 'LIVE', primaryAction: 'VIEW_LIVE_STORE', canPreview: false, canPublish: false })
  })
})
