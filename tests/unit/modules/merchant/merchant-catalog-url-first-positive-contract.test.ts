/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({
  prisma: { merchantFrame: { findMany: jest.fn() } },
}))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-source-network', () => ({
  MERCHANT_SOURCE_FETCH_TIMEOUT_MS: 3000,
  MERCHANT_SOURCE_MAX_RESPONSE_BYTES: 512 * 1024,
  MERCHANT_SOURCE_MAX_REDIRECTS: 2,
  fetchMerchantSourceDocument: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-catalog-browser-render', () => ({
  createMerchantBrowserRenderedFetch: () => jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-commercial-entitlements', () => ({
  getMerchantCommercialState: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { fetchMerchantSourceDocument } from '@/modules/merchant/application/merchant-source-network'
import { getMerchantCommercialState } from '@/modules/merchant/application/merchant-commercial-entitlements'
import { inspectHumanMerchantCatalogSource } from '@/modules/merchant/application/merchant-catalog-source-intake-runtime'

const actor = {
  actorType: 'HUMAN' as const,
  actorId: 'owner-a', merchantId: 'test-merchant-a', membershipId: 'owner-membership-a',
}
const root = 'https://shop.example.test'
const rootDocument = {
  url: root, contentType: 'text/html',
  body: '<html><head><script src="https://cdn.shopify.com/store.js"></script></head><body></body></html>',
}
const shopifyDocument = {
  url: root + '/products.json?limit=250',
  contentType: 'application/json',
  body: JSON.stringify({ products: [{
    id: 21, title: 'Round Acetate Frame', handle: 'round-acetate',
    vendor: 'Merchant A', tags: 'round, acetate',
    image: { src: 'https://cdn.example.test/frame-21.jpg' },
    variants: [{ id: 23, sku: 'FRAME-21', price: '119.00' }],
  }] }),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([])
  ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({
    usage: { catalogItems: 0 }, plan: { catalogItems: 50 },
  })
})

it('human URL First inspects a deterministic Shopify candidate, never imports without approval', async () => {
  ;(fetchMerchantSourceDocument as jest.Mock).mockImplementation(async (url: string) => {
    if (url === root) return rootDocument
    if (url === shopifyDocument.url) return shopifyDocument
    throw new Error('unexpected source')
  })

  const proposal = await inspectHumanMerchantCatalogSource({ actor, sourceUrls: [root] })
  expect(proposal.writePerformed).toBe(false)
  expect(proposal.requiresApproval).toBe(true)
  expect(proposal.sourceSummary.platforms).toContain('SHOPIFY')
  expect(proposal.sourceSummary.foundCount).toBe(1)
  expect(proposal.importReady).toEqual(expect.arrayContaining([
    expect.objectContaining({
      sku: 'FRAME-21',
      name: 'Round Acetate Frame',
      imageUrl: 'https://cdn.example.test/frame-21.jpg',
    }),
  ]))
  expect(proposal.catalogCapacity).toMatchObject({ current: 0, proposedNew: 1, overLimit: 0 })
  expect(fetchMerchantSourceDocument).toHaveBeenCalledTimes(2)
  // Reading a source is not approved Catalog import; the adapter has no create call.
  expect(prisma.merchantFrame.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { merchantId: 'test-merchant-a' },
  }))
})

it('positive-looking but empty source stays a no-write recovery proposal', async () => {
  ;(fetchMerchantSourceDocument as jest.Mock).mockImplementation(async (url: string) => ({
    url, contentType: 'text/html', body: '<html><body><p>Catalog is unavailable</p></body></html>',
  }))
  const result = await inspectHumanMerchantCatalogSource({ actor, sourceUrls: [root] })
  expect(result.writePerformed).toBe(false)
  expect(result.importReady).toHaveLength(0)
  expect(result.sourceSummary.foundCount).toBe(0)
  expect(result.sourceIssues.length).toBeGreaterThan(0)
})
