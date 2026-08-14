/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    merchantFrame: { count: jest.fn(), findMany: jest.fn() },
    experience: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn() } }))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))
jest.mock('@/modules/merchant/application/get-merchant-profile', () => ({
  getMerchantProfile: jest.fn().mockResolvedValue({ id: 'merchant-a', slug: 'merchant-a', name: 'Golden Path Merchant', status: 'ACTIVE' }),
}))
jest.mock('@/modules/merchant/application/merchant-source-network', () => ({
  MERCHANT_SOURCE_FETCH_TIMEOUT_MS: 3_000,
  MERCHANT_SOURCE_MAX_RESPONSE_BYTES: 512 * 1024,
  MERCHANT_SOURCE_MAX_REDIRECTS: 2,
  fetchMerchantSourceDocument: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { fetchMerchantSourceDocument } from '@/modules/merchant/application/merchant-source-network'
import { merchantCatalogSourceIntake } from '@/modules/merchant/application/merchant-catalog-source-intake'
import { merchantOnboarding } from '@/modules/merchant/application/merchant-onboarding'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'

const mockMerchant = prisma.merchant.findUnique as jest.Mock
const mockFrameCount = prisma.merchantFrame.count as jest.Mock
const mockFrameFindMany = prisma.merchantFrame.findMany as jest.Mock
const mockExperienceFindFirst = prisma.experience.findFirst as jest.Mock
const mockTransaction = prisma.$transaction as jest.Mock
const mockFetch = fetchMerchantSourceDocument as jest.Mock
const actor: AgentMerchantActor = {
  actorType: 'AGENT_CREDENTIAL',
  actorId: 'credential-golden-path',
  merchantId: 'merchant-a',
  scopes: ['merchant:read', 'catalog:read', 'catalog:write', 'experience:read', 'experience:write'],
}

describe('Merchant no-Store Delivery Factory Golden Path', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const catalog: Array<Record<string, unknown>> = []
    let store: Record<string, unknown> | null = null
    mockMerchant.mockResolvedValue({ slug: 'merchant-a' })
    mockFrameCount.mockImplementation(async () => catalog.length)
    mockFrameFindMany.mockImplementation(async ({ where }: { where: { merchantId: string; status?: string; id?: { in: string[] } } }) => {
      let rows = catalog.filter((frame) => frame.merchantId === where.merchantId)
      if (where.status) rows = rows.filter((frame) => frame.status === where.status)
      if (where.id?.in) rows = rows.filter((frame) => where.id!.in.includes(String(frame.id)))
      return rows
    })
    mockExperienceFindFirst.mockImplementation(async ({ where }: { where: { merchantId: string; id?: string } }) => {
      if (!store || store.merchantId !== where.merchantId || (where.id && store.id !== where.id)) return null
      return { ...store, frames: (store.frames as Array<Record<string, unknown>>).map((frame) => ({ ...frame })) }
    })
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      merchantFrame: {
        findFirst: jest.fn(async ({ where }: { where: { merchantId: string; sku: string } }) => catalog.find((frame) => frame.merchantId === where.merchantId && frame.sku === where.sku) ?? null),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: `frame-${catalog.length + 1}`, merchantId: 'merchant-a', status: 'ACTIVE', ...data }
          catalog.push(row)
          return row
        }),
        update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ ...catalog[0], ...data })),
      },
      experience: {
        findFirst: jest.fn(async () => null),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          store = { id: 'store-a', merchantId: 'merchant-a', slug: 'store', status: 'DRAFT', frames: [], ...data }
          return store
        }),
      },
      experienceFrame: {
        deleteMany: jest.fn(async () => {
          if (store) store.frames = []
        }),
        createMany: jest.fn(async ({ data }: { data: Array<Record<string, unknown>> }) => {
          if (store) store.frames = data.map((item) => ({ merchantFrameId: item.merchantFrameId }))
        }),
      },
    }))
    mockFetch.mockResolvedValue({
      url: 'https://catalog.example.test/products/round-acetate',
      status: 200,
      contentType: 'text/html',
      body: '<script type="application/ld+json">{"@type":"Product","name":"Round Acetate","sku":"VT-GOLD-01","image":"https://cdn.example.test/gold.jpg","url":"https://catalog.example.test/products/round-acetate","shape":"round"}</script>',
    })
  })

  it('keeps inspection and proposals read-only, then completes approved import through Store preview', async () => {
    const initial = await merchantOnboarding.getOnboardingStatus({ actor })
    expect(initial.store).toBeNull()
    expect(initial.blockers).toContain('CATALOG_EMPTY')

    const proposal = await merchantCatalogSourceIntake.inspectCatalogSource({ actor, sourceUrls: ['https://catalog.example.test/products/round-acetate'] })
    expect(proposal.writePerformed).toBe(false)
    expect(proposal.requiresApproval).toBe(true)
    expect(proposal.importReady).toHaveLength(1)
    expect(mockTransaction).not.toHaveBeenCalled()

    const approvedImport = await merchantOnboarding.importMerchantFrames({ actor, frames: proposal.importReady })
    expect(approvedImport.imported).toBe(1)
    const catalogStatus = await merchantOnboarding.validateMerchantCatalog({ actor })
    expect(catalogStatus.valid).toBe(1)

    // Store creation is a separate approval boundary and remains a DRAFT.
    const draft = await merchantOnboarding.createMerchantStore({ actor, name: 'Golden Path Store' })
    expect(draft.status).toBe('DRAFT')
    await merchantOnboarding.setMerchantStoreFrames({ actor, storeId: draft.id, frameIds: [approvedImport.ids[0]] })
    const preview = await merchantOnboarding.previewMerchantStore({ actor, storeId: draft.id })

    expect(preview.readiness.ready).toBe(true)
    expect(preview.store.status).toBe('DRAFT')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
