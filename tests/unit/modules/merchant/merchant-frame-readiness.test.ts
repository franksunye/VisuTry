import {
  isMerchantFrameRecommendationReady,
  validateMerchantFrameReadiness,
} from '@/modules/merchant/domain/merchant-frame-readiness'

const baseFrame = {
  id: 'frame-a',
  sku: null,
  externalId: 'shopify:product-1',
  name: 'Round frame',
  imageUrl: 'https://cdn.example.test/frame.jpg',
  productUrl: 'https://shop.example.test/products/round-frame',
  status: 'ACTIVE',
  source: 'EXTERNAL',
  shape: 'round',
}

describe('MerchantFrame recommendation readiness contract', () => {
  it('keeps stable-identity catalog importability separate from recommendation readiness', () => {
    const result = validateMerchantFrameReadiness({ ...baseFrame, shape: null })

    expect(result).toMatchObject({
      importReady: true,
      recommendationReady: false,
      enrichmentStatus: 'PENDING',
      importIssues: [],
      recommendationIssues: ['MISSING_SHAPE', 'ENRICHMENT_PENDING'],
    })
    expect(isMerchantFrameRecommendationReady({ ...baseFrame, shape: null })).toBe(false)
  })

  it('accepts a high-confidence enriched frame for recommendation', () => {
    const result = validateMerchantFrameReadiness({ ...baseFrame, enrichmentStatus: 'APPROVED' })

    expect(result).toMatchObject({ importReady: true, recommendationReady: true, enrichmentStatus: 'APPROVED' })
    expect(isMerchantFrameRecommendationReady({ ...baseFrame, enrichmentStatus: 'APPROVED' })).toBe(true)
  })

  it('keeps low-confidence enrichment review-required without blocking import', () => {
    const result = validateMerchantFrameReadiness({ ...baseFrame, enrichmentStatus: 'REVIEW_REQUIRED' })

    expect(result).toMatchObject({
      importReady: true,
      recommendationReady: false,
      recommendationIssues: ['ENRICHMENT_REVIEW_REQUIRED'],
    })
  })

  it('preserves the explicit NOT_REQUIRED exemption', () => {
    const result = validateMerchantFrameReadiness({ ...baseFrame, shape: null, enrichmentStatus: 'NOT_REQUIRED' })

    expect(result).toMatchObject({ importReady: true, recommendationReady: true, enrichmentStatus: 'NOT_REQUIRED', issues: [] })
  })

  it('does not let invalid identity or image data become recommendation-ready', () => {
    const result = validateMerchantFrameReadiness({ ...baseFrame, externalId: null, productUrl: null, imageUrl: 'javascript:bad' })

    expect(result.importReady).toBe(false)
    expect(result.recommendationReady).toBe(false)
    expect(result.importIssues).toEqual(['MISSING_STABLE_IDENTITY', 'MISSING_IMAGE_URL', 'MISSING_PRODUCT_URL'])
  })
})
