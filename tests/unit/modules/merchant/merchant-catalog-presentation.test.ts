import { resolveMerchantCatalogPresentation } from '@/modules/merchant/domain/merchant-catalog-presentation'

describe('merchant catalog presentation', () => {
  it('keeps importable shape-pending products reviewable rather than invalid', () => {
    const presentation = resolveMerchantCatalogPresentation({
      id: 'frame-a',
      sku: null,
      externalId: 'external-a',
      name: 'Round frame',
      imageUrl: 'https://cdn.example.test/frame.jpg',
      productUrl: 'https://shop.example.test/products/round',
      shape: null,
      source: 'EXTERNAL',
      status: 'ACTIVE',
      enrichmentStatus: 'PENDING',
    })

    expect(presentation.state).toBe('NEEDS_REVIEW')
    expect(presentation.label).toBe('Needs enrichment')
    expect(presentation.issueCodes).toEqual(expect.arrayContaining(['MISSING_SHAPE', 'ENRICHMENT_PENDING']))
  })

  it('uses attention for broken identity or image data', () => {
    const presentation = resolveMerchantCatalogPresentation({ id: 'frame-b', name: 'Broken frame', status: 'ACTIVE' })

    expect(presentation.state).toBe('NEEDS_ATTENTION')
    expect(presentation.issueSummary).toBe('Add a product URL, SKU, or external identity')
  })
})

