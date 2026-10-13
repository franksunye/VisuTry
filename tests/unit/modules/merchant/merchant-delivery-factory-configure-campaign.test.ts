jest.mock('@/lib/prisma', () => ({ prisma: { experience: { findMany: jest.fn() } } }))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-plan', () => ({
  getMerchantFactoryDryRun: jest.fn(),
}))
jest.mock('@/modules/store/application/campaign-service', () => ({
  updateCampaign: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn(),
}))
import { prisma } from '@/lib/prisma'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { updateCampaign } from '@/modules/store/application/campaign-service'
import {
  prepareMerchantFactoryCampaignConfiguration,
  applyMerchantFactoryCampaignConfiguration,
} from '@/modules/merchant/application/merchant-delivery-factory-configure-campaign'

const actor = { actorType: 'HUMAN' as const, actorId: 'owner-a', merchantId: 'merchant-a', membershipId: 'm-a' }
const manifest = {
  version: 1, merchantSlug: 'merchant-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'A', logoAssetUrl: null },
  store: { name: 'A Store', selectedFrameIds: ['frame-a'] },
  campaigns: [{
    slug: 'spring', name: 'Spring', headline: 'Choose frames', selectedFrameIds: ['frame-a'],
  }],
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.experience.findMany as jest.Mock).mockResolvedValue([{
    id: 'campaign-id', status: 'DRAFT', updatedAt: new Date('2026-10-01T00:00:00Z'),
    name: 'Spring', headline: 'Old', description: null, presentationMode: 'EDITORIAL_FIRST',
    journeyPolicy: null, deliveryPolicy: null,
  }])
  ;(getMerchantFactoryDryRun as jest.Mock).mockResolvedValue({
    version: 1, merchantSlug: 'merchant-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    canApply: false, releaseReady: false, blockers: [],
    steps: [
      { resource: 'BRAND', target: 'merchant-a', action: 'NO_CHANGE' },
      { resource: 'STORE', target: 'default', action: 'NO_CHANGE' },
      { resource: 'CAMPAIGN', target: 'spring', action: 'UPDATE_DRAFT', changedFields: ['headline', 'selectedFrameIds'] },
    ],
  })
  ;(updateCampaign as jest.Mock).mockResolvedValue({ id: 'campaign-id', status: 'DRAFT' })
})
it('only previews allowed Campaign fields and never writes', async () => {
  const v = await prepareMerchantFactoryCampaignConfiguration({ actor, proposal: manifest, slug: 'spring' })
  expect(v).toMatchObject({
    campaignId: 'campaign-id', expectedUpdatedAt: '2026-10-01T00:00:00.000Z',
    reviewChanges: [{ field: 'headline', before: 'Old', after: 'Choose frames' }],
    releaseReady: false,
  })
  expect(updateCampaign).not.toHaveBeenCalled()
})
it('applies only copy with exact approved resource revision via canonical Campaign command', async () => {
  const p = await prepareMerchantFactoryCampaignConfiguration({ actor, proposal: manifest, slug: 'spring' })
  await applyMerchantFactoryCampaignConfiguration({
    actor, proposal: manifest, slug: 'spring',
    expectedCampaignId: p.campaignId, expectedUpdatedAt: p.expectedUpdatedAt,
    manifestDigest: p.manifestDigest,
  })
  expect(updateCampaign).toHaveBeenCalledWith(expect.objectContaining({
    merchantId: 'merchant-a', campaignId: 'campaign-id', headline: 'Choose frames',
    factoryDraftOnly: true, expectedUpdatedAt: '2026-10-01T00:00:00.000Z',
  }))
  expect((updateCampaign as jest.Mock).mock.calls[0][0]).not.toHaveProperty('selectedFrameIds')
})
it('rejects changed approval digest, ACTIVE Campaign or missing membership before write', async () => {
  const p = await prepareMerchantFactoryCampaignConfiguration({ actor, proposal: manifest, slug: 'spring' })
  await expect(applyMerchantFactoryCampaignConfiguration({
    actor, proposal: manifest, slug: 'spring',
    expectedCampaignId: p.campaignId, expectedUpdatedAt: p.expectedUpdatedAt,
    manifestDigest: 'f'.repeat(64),
  })).rejects.toThrow()
  expect(updateCampaign).not.toHaveBeenCalled()
  ;(prisma.experience.findMany as jest.Mock).mockResolvedValueOnce([{
    id: 'campaign-id', status: 'ACTIVE', updatedAt: new Date('2026-10-01T00:00:00Z'),
  }])
  await expect(prepareMerchantFactoryCampaignConfiguration({
    actor, proposal: manifest, slug: 'spring',
  })).rejects.toThrow()
  await expect(prepareMerchantFactoryCampaignConfiguration({
    actor: { ...actor, membershipId: undefined },
    proposal: manifest, slug: 'spring',
  })).rejects.toThrow()
})
