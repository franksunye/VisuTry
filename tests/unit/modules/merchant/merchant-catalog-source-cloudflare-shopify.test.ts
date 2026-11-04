/** @jest-environment node */

const mockCloudflareSql = jest.fn()
const mockGetMerchantOperatingPlan = jest.fn()

jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: () => mockCloudflareSql }))
jest.mock('@/modules/merchant/application/merchant-operating-reads-cloudflare', () => ({
  getMerchantOperatingPlan: (...args: unknown[]) => mockGetMerchantOperatingPlan(...args),
}))
jest.mock('@/modules/merchant/application/merchant-agent-credentials-cloudflare', () => ({ recordMerchantAgentOperation: jest.fn() }))

import { inspectHumanMerchantCatalogSource } from '@/modules/merchant/application/merchant-catalog-source-intake-cloudflare'

const actor = { actorType: 'HUMAN' as const, actorId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a' }
const sourceUrl = 'https://moscot.com/products/lemtosh?variant=9988'
const ajaxUrl = 'https://moscot.com/products/lemtosh.js'

function ajaxProduct() {
  return {
    id: 88442,
    title: 'Lemtosh',
    handle: 'lemtosh',
    vendor: 'MOSCOT',
    featured_image: 'https://cdn.shopify.com/s/files/lemtosh.jpg',
    images: Array.from({ length: 97 }, (_, index) => `https://cdn.shopify.com/s/files/image-${index}.jpg`),
    variants: [{ id: 90001, title: 'Tortoise / 46', available: true, sku: 'LEMTOSH-46', price: 34000 }],
  }
}

describe('Cloudflare Shopify product source intake', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCloudflareSql.mockResolvedValue([])
    mockGetMerchantOperatingPlan.mockResolvedValue({ usage: { catalogItems: 0 }, limits: { catalogItems: 50 } })
  })

  it('uses the same-origin Ajax endpoint for an oversized Shopify page and accepts text/javascript', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const target = String(input)
      if (target === sourceUrl) {
        return new Response('', {
          status: 200,
          headers: {
            'content-type': 'text/html',
            'content-length': String(512 * 1024 + 1),
            'powered-by': 'Shopify',
          },
        })
      }
      if (target === ajaxUrl) {
        return new Response(JSON.stringify(ajaxProduct()), {
          status: 200,
          headers: { 'content-type': 'text/javascript' },
        })
      }
      throw new Error(`Unexpected request to ${target}`)
    })

    try {
      const result = await inspectHumanMerchantCatalogSource({ actor, sourceUrls: [sourceUrl] })

      expect(fetchMock.mock.calls.map(([target]) => String(target))).toEqual([sourceUrl, ajaxUrl])
      expect(result.writePerformed).toBe(false)
      // The oversized landing HTML is rejected before it becomes an accepted
      // source document; only the bounded Ajax payload counts as fetched data.
      expect(result.sourceSummary.fetchedPageCount).toBe(1)
      expect(result.candidates).toHaveLength(1)
      expect(result.candidates[0]).toMatchObject({
        productUrl: sourceUrl,
        brand: 'MOSCOT',
        shopifyReview: { productId: '88442', variantOptions: [{ id: '90001', priceMinor: 34000 }] },
      })
    } finally {
      fetchMock.mockRestore()
    }
  })

  it.each([
    [403, 'SOURCE_ACCESS_DENIED'],
    [429, 'SOURCE_RATE_LIMITED'],
  ])('returns HTTP %i as a terminal fallback result', async (status, code) => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status }))
    try {
      const result = await inspectHumanMerchantCatalogSource({ actor, sourceUrls: [sourceUrl] })

      expect(result.candidates).toEqual([])
      expect(result.sourceSummary.sourceIssues).toEqual(expect.arrayContaining([expect.objectContaining({ code })]))
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      fetchMock.mockRestore()
    }
  })
})
