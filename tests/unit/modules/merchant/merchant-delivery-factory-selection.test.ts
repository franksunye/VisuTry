jest.mock('@/lib/prisma', () => ({
  prisma: { experience: { findMany: jest.fn() }, merchantFrame: { findMany: jest.fn() } },
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-plan', () => ({
  getMerchantFactoryDryRun: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-onboarding', () => ({
  setMerchantStoreFrames: jest.fn(),
}))
jest.mock('@/modules/store/application/campaign-service', () => ({
  setCampaignFrames: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn(),
}))
import { prisma } from '@/lib/prisma'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { setMerchantStoreFrames } from '@/modules/merchant/application/merchant-onboarding'
import { setCampaignFrames } from '@/modules/store/application/campaign-service'
import {
  prepareMerchantFactoryDraftSelection, applyMerchantFactoryDraftSelection,
} from '@/modules/merchant/application/merchant-delivery-factory-selection'

const actor = { actorType: 'HUMAN' as const, actorId: 'owner', merchantId: 'tenant-a', membershipId: 'm-a' }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['f1', 'f2'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['f2', 'f1'] },
  campaigns: [],
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValue({
    version: 1, merchantSlug: 'store-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [],
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE' },
      { resource: 'STORE', target: 'default', action: 'UPDATE_DRAFT', changedFields: ['selectedFrameIds'] },
    ],
  })
  ;(prisma.experience.findMany as jest.Mock).mockResolvedValue([{
    id: 'store-a', status: 'DRAFT', updatedAt: new Date('2026-10-01T00:00:00Z'),
    frames: [{ merchantFrameId: 'f1' }],
  }])
  ;(setMerchantStoreFrames as jest.Mock).mockResolvedValue({ storeId: 'store-a' })
  ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([{
    id: 'f1', sku: 'FRAME-1', externalId: null, name: 'Frame 1',
    imageUrl: '/assets/glasses-presets/aviator-classic.jpg', productUrl: null,
    shape: 'AVIATOR', source: 'MANUAL', status: 'ACTIVE', enrichmentStatus: 'APPROVED',
  }])
})
it('prepares exact field before/after selection with revision and no write', async () => {
  const p = await prepareMerchantFactoryDraftSelection({ actor, proposal: manifest, target: { type: 'STORE' } })
  expect(p).toMatchObject({
    expectedExperienceId: 'store-a', expectedUpdatedAt: '2026-10-01T00:00:00.000Z',
    reviewChanges: [{ field: 'selectedFrameIds', before: ['f1'], after: ['f2', 'f1'] }],
    releaseReady: false,
  })
  expect(setMerchantStoreFrames).not.toHaveBeenCalled()
})
it('applies only the approved Store target via canonical Draft-only revision-checked selection', async () => {
  const p = await prepareMerchantFactoryDraftSelection({ actor, proposal: manifest, target: { type: 'STORE' } })
  const result = await applyMerchantFactoryDraftSelection({
    actor, proposal: manifest, target: { type: 'STORE' },
    expectedExperienceId: p.expectedExperienceId, expectedUpdatedAt: p.expectedUpdatedAt,
    manifestDigest: p.manifestDigest,
  })
  expect(result).toMatchObject({ status: 'DRAFT_SELECTION_APPLIED', releaseReady: false })
  expect(setMerchantStoreFrames).toHaveBeenCalledWith({
    actor, storeId: 'store-a', frameIds: ['f2', 'f1'],
    factoryDraftOnly: true, expectedUpdatedAt: '2026-10-01T00:00:00.000Z',
  })
})
it('refuses mismatched digest, stale row, ACTIVE Store and missing membership before writes', async () => {
  const p = await prepareMerchantFactoryDraftSelection({ actor, proposal: manifest, target: { type: 'STORE' } })
  await expect(applyMerchantFactoryDraftSelection({
    actor, proposal: manifest, target: { type: 'STORE' },
    expectedExperienceId: p.expectedExperienceId, expectedUpdatedAt: p.expectedUpdatedAt,
    manifestDigest: '0'.repeat(64),
  })).rejects.toThrow()
  ;(prisma.experience.findMany as jest.Mock).mockResolvedValueOnce([{
    id: 'store-a', status: 'ACTIVE', updatedAt: new Date('2026-10-01T00:00:00Z'), frames: [],
  }])
  await expect(prepareMerchantFactoryDraftSelection({
    actor, proposal: manifest, target: { type: 'STORE' },
  })).rejects.toThrow()
  await expect(prepareMerchantFactoryDraftSelection({
    actor: { ...actor, membershipId: undefined },
    proposal: manifest, target: { type: 'STORE' },
  })).rejects.toThrow()
  expect(setMerchantStoreFrames).not.toHaveBeenCalled()
})

it('applies an approved Campaign selection via the canonical Campaign service only', async () => {
  const campaignManifest = { ...manifest, campaigns: [{ slug: 'fall', name: 'Fall', selectedFrameIds: ['f1'] }] }
  ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValueOnce({
    version: 1, merchantSlug: 'store-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [],
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE' },
      { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'CAMPAIGN', target: 'fall', action: 'UPDATE_DRAFT', changedFields: ['selectedFrameIds'] },
    ],
  })
  ;(prisma.experience.findMany as jest.Mock).mockResolvedValueOnce([{
    id: 'campaign-a', status: 'DRAFT', updatedAt: new Date('2026-10-01T00:00:00Z'), frames: [],
  }])
  const target = { type: 'CAMPAIGN' as const, slug: 'fall' }
  const prepared = await prepareMerchantFactoryDraftSelection({ actor, proposal: campaignManifest, target })
  ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValueOnce({
    version: 1, merchantSlug: 'store-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [],
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE' },
      { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'CAMPAIGN', target: 'fall', action: 'UPDATE_DRAFT', changedFields: ['selectedFrameIds'] },
    ],
  })
  ;(prisma.experience.findMany as jest.Mock).mockResolvedValueOnce([{
    id: 'campaign-a', status: 'DRAFT', updatedAt: new Date('2026-10-01T00:00:00Z'), frames: [],
  }])
  await applyMerchantFactoryDraftSelection({
    actor, proposal: campaignManifest, target,
    expectedExperienceId: prepared.expectedExperienceId, expectedUpdatedAt: prepared.expectedUpdatedAt,
    manifestDigest: prepared.manifestDigest,
  })
  expect(setCampaignFrames).toHaveBeenCalledWith({
    merchantId: 'tenant-a', campaignId: 'campaign-a', frameIds: ['f1'],
    factoryDraftOnly: true, expectedUpdatedAt: '2026-10-01T00:00:00.000Z',
  })
  expect(setMerchantStoreFrames).not.toHaveBeenCalled()
})


it('blocks Campaign selection when an ACTIVE product lacks recommendation readiness', async () => {
  const campaignManifest = { ...manifest, campaigns: [{ slug: 'fall', name: 'Fall', selectedFrameIds: ['f1'] }] }
  ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValueOnce({
    version: 1, merchantSlug: 'store-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [],
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE' },
      { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] },
      { resource: 'CAMPAIGN', target: 'fall', action: 'UPDATE_DRAFT', changedFields: ['selectedFrameIds'] },
    ],
  })
  ;(prisma.experience.findMany as jest.Mock).mockResolvedValueOnce([{
    id: 'campaign-a', status: 'DRAFT', updatedAt: new Date('2026-10-01T00:00:00Z'), frames: [],
  }])
  ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValueOnce([{
    id: 'f1', sku: 'FRAME-1', externalId: null, name: 'Frame 1',
    imageUrl: '/assets/glasses-presets/aviator-classic.jpg',
    productUrl: null, shape: null, source: 'MANUAL',
    status: 'ACTIVE', enrichmentStatus: 'PENDING',
  }])
  await expect(prepareMerchantFactoryDraftSelection({
    actor, proposal: campaignManifest, target: { type: 'CAMPAIGN', slug: 'fall' },
  })).rejects.toThrow()
  expect(setCampaignFrames).not.toHaveBeenCalled()
})

