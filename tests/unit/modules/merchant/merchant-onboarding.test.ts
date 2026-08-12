import { validateCatalogFrame } from '@/modules/merchant/application/merchant-onboarding'

describe('merchant onboarding catalog validation', () => {
  it('accepts a complete active frame', () => {
    expect(validateCatalogFrame({
      id: 'frame-a', sku: 'SKU-A', name: 'A', imageUrl: 'https://cdn.example/a.jpg', shape: 'round', widthClass: 'M', status: 'ACTIVE',
    })).toEqual({ valid: true, issues: [], warnings: [] })
  })

  it('returns deterministic blockers without inventing data', () => {
    expect(validateCatalogFrame({
      id: 'frame-a', sku: null, name: 'A', imageUrl: null, shape: '', widthClass: null, status: 'DRAFT',
    })).toEqual({ valid: false, issues: ['MISSING_SKU', 'MISSING_IMAGE_URL', 'MISSING_SHAPE'], warnings: ['FRAME_NOT_ACTIVE'] })
  })
})
