/** @jest-environment node */

const mockCloudflareSql = jest.fn()
const mockGetMerchantCommercialState = jest.fn()
const mockGetMerchantOperatingPlan = jest.fn()

jest.mock('@/lib/prisma', () => ({ prisma: { merchantFrame: { findMany: jest.fn() } } }))
jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: () => mockCloudflareSql }))
jest.mock('@/modules/merchant/application/merchant-commercial-entitlements', () => ({
  getMerchantCommercialState: (...args: unknown[]) => mockGetMerchantCommercialState(...args),
}))
jest.mock('@/modules/merchant/application/merchant-operating-reads-cloudflare', () => ({
  getMerchantOperatingPlan: (...args: unknown[]) => mockGetMerchantOperatingPlan(...args),
}))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({ recordMerchantAgentOperation: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-agent-credentials-cloudflare', () => ({ recordMerchantAgentOperation: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-source-network', () => ({
  MERCHANT_SOURCE_FETCH_TIMEOUT_MS: 3_000,
  MERCHANT_SOURCE_MAX_RESPONSE_BYTES: 512 * 1024,
  MERCHANT_SOURCE_MAX_REDIRECTS: 2,
  fetchMerchantSourceDocument: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-catalog-browser-render', () => ({ createMerchantBrowserRenderedFetch: () => jest.fn() }))

import { prisma } from '@/lib/prisma'
import { inspectHumanMerchantCatalogSource as inspectPrisma } from '@/modules/merchant/application/merchant-catalog-source-intake-runtime'
import { inspectHumanMerchantCatalogSource as inspectCloudflare } from '@/modules/merchant/application/merchant-catalog-source-intake-cloudflare'

const actor = { actorType: 'HUMAN' as const, actorId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a' }
const existing = [{ id: 'existing-frame', sku: 'SKU-EXISTING', productUrl: null, externalId: null, source: 'CSV' }]

function csvWithExistingAndNewRows(newCount: number) {
  const rows = [['SKU-EXISTING', 'Existing item', 'https://cdn.example.test/existing.jpg', 'round']]
  for (let index = 0; index < newCount; index += 1) {
    rows.push([`SKU-NEW-${index + 1}`, `New item ${index + 1}`, `https://cdn.example.test/${index + 1}.jpg`, 'round'])
  }
  return [['sku', 'name', 'imageUrl', 'shape'], ...rows].map((row) => row.join(',')).join('\n')
}

const runtimes = [
  { name: 'Prisma', inspect: inspectPrisma },
  { name: 'Cloudflare', inspect: inspectCloudflare },
]

describe.each(runtimes)('$name catalog capacity preflight', ({ inspect }) => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue(existing)
    mockCloudflareSql.mockResolvedValue(existing)
    mockGetMerchantCommercialState.mockResolvedValue({ usage: { catalogItems: 2 }, plan: { catalogItems: 50 } })
    mockGetMerchantOperatingPlan.mockResolvedValue({ usage: { catalogItems: 2 }, limits: { catalogItems: 50 } })
  })

  it('counts only new identities and allows a proposal that exactly fills the remaining slots', async () => {
    const result = await inspect({ actor, csvText: csvWithExistingAndNewRows(48) })

    expect(result.writePerformed).toBe(false)
    expect(result.importReady).toHaveLength(48)
    expect(result.catalogCapacity).toEqual({ current: 2, limit: 50, remaining: 48, proposedNew: 48, overLimit: 0 })
  })

  it('reports the complete overage before approval instead of offering a partial import', async () => {
    const result = await inspect({ actor, csvText: csvWithExistingAndNewRows(49) })

    expect(result.writePerformed).toBe(false)
    expect(result.importReady).toHaveLength(49)
    expect(result.catalogCapacity).toEqual({ current: 2, limit: 50, remaining: 48, proposedNew: 49, overLimit: 1 })
  })
})
