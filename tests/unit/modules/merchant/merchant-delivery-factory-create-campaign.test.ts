jest.mock('@/lib/prisma', () => ({ prisma: { experience: { findFirst: jest.fn() } } }))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-plan', () => ({
  getMerchantFactoryDryRun: jest.fn(),
}))
jest.mock('@/modules/store/application/campaign-service', () => ({
  createCampaignDraft: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn(),
}))
import { prisma } from '@/lib/prisma'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { createCampaignDraft } from '@/modules/store/application/campaign-service'
import { recordMerchantAgentOperation } from '@/modules/merchant/application/merchant-agent-credentials'
import {
  prepareMerchantFactoryDraftCampaignCreation, createMerchantFactoryDraftCampaign,
} from '@/modules/merchant/application/merchant-delivery-factory-create-campaign'

const actor = { actorType: 'HUMAN' as const, actorId: 'owner', merchantId: 'tenant-a', membershipId: 'm-a' }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-1'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['frame-1'] },
  campaigns: [{ slug: 'fall', name: 'Fall', selectedFrameIds: ['frame-1'] }],
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValue({
    version: 1, merchantSlug: 'store-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [],
    steps: [
      { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE' },
      { resource: 'STORE', target: 'default', action: 'NO_CHANGE' },
      { resource: 'CAMPAIGN', target: 'fall', action: 'CREATE_DRAFT' },
    ],
  })
  ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
  ;(createCampaignDraft as jest.Mock).mockResolvedValue({ id: 'campaign-1', slug: 'fall', status: 'DRAFT' })
  ;(recordMerchantAgentOperation as jest.Mock).mockResolvedValue(undefined)
})
it('prepares truthfully without write', async () => {
  const p = await prepareMerchantFactoryDraftCampaignCreation({ actor, proposal: manifest, slug: 'fall' })
  expect(p).toMatchObject({
    slug: 'fall', expectedCampaignAbsent: true, releaseReady: false,
    reviewChanges: [
      { field: 'name', before: null, after: 'Fall' },
      { field: 'headline', before: null, after: null },
      { field: 'description', before: null, after: null },
      { field: 'presentationMode', before: null, after: 'EDITORIAL_FIRST' },
    ],
  })
  expect(createCampaignDraft).not.toHaveBeenCalled()
})
it('binds same slug, manifest digest and target absence before canonical Draft create', async () => {
  const p = await prepareMerchantFactoryDraftCampaignCreation({ actor, proposal: manifest, slug: 'fall' })
  const result = await createMerchantFactoryDraftCampaign({
    actor, proposal: manifest, slug: 'fall', manifestDigest: p.manifestDigest, expectedCampaignAbsent: true,
  })
  expect(result).toMatchObject({ status: 'DRAFT_CAMPAIGN_CREATED_ONLY', releaseReady: false })
  expect(createCampaignDraft).toHaveBeenCalledWith(expect.objectContaining({
    merchantId: 'tenant-a', slug: 'fall', name: 'Fall', factoryExpectAbsent: true,
  }))
  expect(recordMerchantAgentOperation).toHaveBeenCalledTimes(1)
})
it('blocks stale slug and hash, foreign actor and duplicated Campaign before write', async () => {
  const p = await prepareMerchantFactoryDraftCampaignCreation({ actor, proposal: manifest, slug: 'fall' })
  await expect(createMerchantFactoryDraftCampaign({
    actor, proposal: manifest, slug: 'fall', manifestDigest: '0'.repeat(64), expectedCampaignAbsent: true,
  })).rejects.toThrow()
  expect(createCampaignDraft).not.toHaveBeenCalled()
  ;(prisma.experience.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'already' })
  await expect(prepareMerchantFactoryDraftCampaignCreation({ actor, proposal: manifest, slug: 'fall' })).rejects.toThrow()
  await expect(prepareMerchantFactoryDraftCampaignCreation({
    actor: { ...actor, membershipId: undefined }, proposal: manifest, slug: 'fall',
  })).rejects.toThrow()
  expect(recordMerchantAgentOperation).not.toHaveBeenCalled()
})
