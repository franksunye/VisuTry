jest.mock('@/lib/prisma', () => ({
  prisma: { experience: { findFirst: jest.fn() } },
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-plan', () => ({
  getMerchantFactoryDryRun: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-onboarding', () => ({
  createMerchantStore: jest.fn(),
}))
import { prisma } from '@/lib/prisma'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { createMerchantStore } from '@/modules/merchant/application/merchant-onboarding'
import {
  prepareMerchantFactoryDraftStoreCreation, createMerchantFactoryDraftStore,
} from '@/modules/merchant/application/merchant-delivery-factory-create-store'

const actor = { actorType: 'HUMAN' as const, actorId: 'owner', merchantId: 'tenant-a', membershipId: 'membership-a' }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-1'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', headline: 'Find a frame', selectedFrameIds: ['frame-1'] },
  campaigns: [],
}
const plan = {
  version: 1, merchantSlug: 'store-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
  canApply: false, releaseReady: false, blockers: [],
  steps: [
    { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE' },
    { resource: 'STORE', target: 'default', action: 'CREATE_DRAFT' },
  ],
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValue(plan)
  ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
  ;(createMerchantStore as jest.Mock).mockResolvedValue({ id: 'store-id', status: 'DRAFT', created: true })
})
describe('Factory Owner-only draft Store create command', () => {
  it('prepares field-level copy diff without writing', async () => {
    const prepared = await prepareMerchantFactoryDraftStoreCreation({ actor, proposal: manifest })
    expect(prepared).toMatchObject({
      expectedStoreAbsent: true, releaseReady: false, status: 'HUMAN_APPROVAL_REQUIRED',
      reviewChanges: [
        { field: 'name', before: null, after: 'Store A' },
        { field: 'headline', before: null, after: 'Find a frame' },
        { field: 'description', before: null, after: null },
      ],
    })
    expect(createMerchantStore).not.toHaveBeenCalled()
  })
  it('requires exact hash then creates via canonical Merchant action', async () => {
    const p = await prepareMerchantFactoryDraftStoreCreation({ actor, proposal: manifest })
    const result = await createMerchantFactoryDraftStore({
      actor, proposal: manifest, manifestDigest: p.manifestDigest, expectedStoreAbsent: true,
    })
    expect(result).toMatchObject({ storeId: 'store-id', status: 'DRAFT_STORE_CREATED_ONLY', releaseReady: false })
    expect(createMerchantStore).toHaveBeenCalledWith({
      actor, name: 'Store A', headline: 'Find a frame', description: undefined,
    })
  })
  it('rejects swapped manifest/tenant, existing Store, no real create and missing membership', async () => {
    const p = await prepareMerchantFactoryDraftStoreCreation({ actor, proposal: manifest })
    await expect(createMerchantFactoryDraftStore({
      actor, proposal: manifest, manifestDigest: '0'.repeat(64), expectedStoreAbsent: true,
    })).rejects.toThrow()
    expect(createMerchantStore).not.toHaveBeenCalled()
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'existing' })
    await expect(prepareMerchantFactoryDraftStoreCreation({ actor, proposal: manifest })).rejects.toThrow()
    ;(createMerchantStore as jest.Mock).mockResolvedValueOnce({ id: 'raced-store', status: 'DRAFT', created: false })
    await expect(createMerchantFactoryDraftStore({
      actor, proposal: manifest, manifestDigest: p.manifestDigest, expectedStoreAbsent: true,
    })).rejects.toThrow()
    await expect(prepareMerchantFactoryDraftStoreCreation({
      actor: { ...actor, membershipId: undefined }, proposal: manifest,
    })).rejects.toThrow()
  })
})
