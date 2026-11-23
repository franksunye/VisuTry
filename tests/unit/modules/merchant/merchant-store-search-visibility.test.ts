jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    merchantFrame: { findMany: jest.fn() },
    experience: { findFirst: jest.fn(), update: jest.fn() },
  },
}))
jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: jest.fn() }))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(),
}))
jest.mock('@/modules/merchant/application/get-merchant-profile', () => ({ getMerchantProfile: jest.fn() }))
jest.mock('@/modules/merchant/application/get-merchant-profile-cloudflare', () => ({ getMerchantProfile: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-commercial-entitlements', () => ({
  getMerchantCommercialCapability: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-commercial-entitlements-cloudflare', () => ({
  getMerchantCommercialCapabilityCloudflare: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getCloudflareSql } from '@/data/neon-cloudflare'
import { getMerchantProfile as getPrismaProfile } from '@/modules/merchant/application/get-merchant-profile'
import { getMerchantProfile as getCloudflareProfile } from '@/modules/merchant/application/get-merchant-profile-cloudflare'
import { getMerchantCommercialCapability } from '@/modules/merchant/application/merchant-commercial-entitlements'
import { getMerchantCommercialCapabilityCloudflare } from '@/modules/merchant/application/merchant-commercial-entitlements-cloudflare'
import { getMerchantStoreWorkspace as getPrismaWorkspace } from '@/modules/merchant/application/merchant-onboarding'
import { getMerchantStoreWorkspace as getCloudflareWorkspace } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'

const actor: AgentMerchantActor = {
  actorType: 'AGENT_CREDENTIAL', actorId: 'credential-a', merchantId: 'merchant-a',
  scopes: ['merchant:read', 'experience:read'],
}
const merchant = {
  id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null,
  pilotType: 'LIVE', referenceData: false, sponsoredUsagePolicyKey: null,
}
const capability = { decisions: {
  GENERATIVE_TRY_ON: { allowed: false }, COMPARE: { allowed: false }, KIOSK_DELIVERY: { allowed: false },
} }

function frame(id: string, status: string, productUrl: string | null) {
  return {
    id, merchantFrameId: id, sku: `SKU-${id}`, externalId: null, name: `Frame ${id}`,
    imageUrl: 'https://cdn.example.test/frame.png', productUrl, shape: 'round', widthClass: 'M',
    brand: null, price: null, currency: null, source: 'MANUAL', enrichmentStatus: 'APPROVED', status,
  }
}

describe.each([
  ['Prisma', getPrismaWorkspace],
  ['Cloudflare', getCloudflareWorkspace],
] as const)('%s Store search visibility', (_runtime, getWorkspace) => {
  beforeEach(() => jest.clearAllMocks())

  it.each([
    { label: 'published collection', status: 'ACTIVE', activeCount: 4, destination: true, reference: false, visibility: 'PUBLIC_INDEX', reason: null },
    { label: 'published collection below the search minimum', status: 'ACTIVE', activeCount: 3, destination: true, reference: false, visibility: 'PUBLIC_NOINDEX', reason: 'INSUFFICIENT_FRAMES' },
    { label: 'collection without a selected product destination', status: 'ACTIVE', activeCount: 4, destination: false, reference: false, visibility: 'PUBLIC_NOINDEX', reason: 'MISSING_DESTINATION' },
    { label: 'private draft', status: 'DRAFT', activeCount: 4, destination: true, reference: false, visibility: 'PRIVATE', reason: 'DRAFT' },
    { label: 'reference collection', status: 'ACTIVE', activeCount: 4, destination: true, reference: true, visibility: 'PUBLIC_NOINDEX', reason: 'REFERENCE' },
  ])('reports $label without counting inactive or unselected inventory', async ({ status, activeCount, destination, reference, visibility, reason }) => {
    const selected = [
      ...Array.from({ length: activeCount }, (_, index) => frame(`selected-${index}`, 'ACTIVE', destination ? 'https://merchant.example.test/product' : null)),
      frame('selected-inactive', 'INACTIVE', 'https://merchant.example.test/archived'),
    ]
    // A valid unselected link must not satisfy this collection's destination check.
    const catalog = [...selected, frame('unselected', 'ACTIVE', 'https://merchant.example.test/unselected')]
    const store = {
      id: 'store-a', merchantId: merchant.id, slug: 'store', name: 'Merchant A collection', type: 'STORE',
      status, headline: 'Frames for everyday wear', description: null, referenceData: reference,
      frames: selected.map((item) => ({ merchantFrameId: item.id })),
    }
    ;(getPrismaProfile as jest.Mock).mockResolvedValue(merchant)
    ;(getCloudflareProfile as jest.Mock).mockResolvedValue(merchant)
    ;(getMerchantCommercialCapability as jest.Mock).mockResolvedValue(capability)
    ;(getMerchantCommercialCapabilityCloudflare as jest.Mock).mockResolvedValue(capability)
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(merchant)
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(store)
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue(catalog)

    const sql = jest.fn(async (template: TemplateStringsArray) => {
      const query = template.join('')
      if (query.includes('FROM "ExperienceFrame"')) return selected
      if (query.includes('FROM "Experience"')) return [store]
      if (query.includes('FROM "MerchantFrame"')) return catalog
      if (query.includes('FROM "Merchant"')) return [merchant]
      throw new Error(`Unexpected read: ${query}`)
    })
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await getWorkspace({ actor })

    expect(result.store?.searchVisibility).toMatchObject({ visibility, indexableLocale: 'en', activeFrameCount: activeCount, minimumFrameCount: 4 })
    expect(result.store?.searchVisibility.reasons).toEqual(reason ? expect.arrayContaining([reason]) : [])
    expect(prisma.experience.update).not.toHaveBeenCalled()
    expect(sql.mock.calls.every(([query]) => !/\b(UPDATE|INSERT|DELETE)\b/.test(query.join('')))).toBe(true)
  })
})
