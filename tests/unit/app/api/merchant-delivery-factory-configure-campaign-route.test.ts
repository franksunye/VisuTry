/** @jest-environment node */
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {},
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-configure-campaign', () => ({
  prepareMerchantFactoryCampaignConfiguration: jest.fn(),
  applyMerchantFactoryCampaignConfiguration: jest.fn(),
}))
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryCampaignConfiguration,
  applyMerchantFactoryCampaignConfiguration,
} from '@/modules/merchant/application/merchant-delivery-factory-configure-campaign'
import { POST, PUT } from '@/app/api/merchant/[merchantId]/delivery-factory/configure-campaign/route'

const params = { params: { merchantId: 'merchant-a' } }
const manifest = {
  version: 1, merchantSlug: 'merchant-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'A', logoAssetUrl: null },
  store: { name: 'A Store', selectedFrameIds: ['frame-a'] },
  campaigns: [{ slug: 'spring', name: 'Spring', selectedFrameIds: ['frame-a'] }],
}
const proposal = { slug: 'spring', manifest }
const apply = {
  ...proposal, approved: true, expectedCampaignId: 'campaign-id',
  expectedUpdatedAt: '2026-10-01T00:00:00Z', manifestDigest: 'a'.repeat(64),
}
function req(method: string, data: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/delivery-factory/configure-campaign', {
    method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  })
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'owner-a' })
  ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ membershipId: 'owner-m', role: 'OWNER' })
  ;(prepareMerchantFactoryCampaignConfiguration as jest.Mock).mockResolvedValue({
    campaignId: 'campaign-id', releaseReady: false,
  })
  ;(applyMerchantFactoryCampaignConfiguration as jest.Mock).mockResolvedValue({
    status: 'DRAFT_CAMPAIGN_CONFIGURATION_APPLIED', releaseReady: false,
  })
})
it('prepares a no-store Owner-only comparison without invoking any write', async () => {
  const response = await PUT(req('PUT', proposal), params)
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(requireMerchantMembership).toHaveBeenCalledWith({
    userId: 'owner-a', merchantId: 'merchant-a', roles: ['OWNER'],
  })
  expect(applyMerchantFactoryCampaignConfiguration).not.toHaveBeenCalled()
})
it('requires exact explicit approval and rejects mutated/injected Manifest before write', async () => {
  for (const bad of [
    { ...apply, approved: false },
    { ...apply, manifestDigest: 'invalid' },
    { ...apply, manifest: { ...manifest, approved: true } },
    { ...apply, anotherTarget: 'foreign' },
  ]) {
    expect((await POST(req('POST', bad), params)).status).toBe(400)
  }
  expect(applyMerchantFactoryCampaignConfiguration).not.toHaveBeenCalled()
  const success = await POST(req('POST', apply), params)
  expect(success.status).toBe(200)
  expect(await success.json()).toMatchObject({ data: { releaseReady: false } })
})
it('rejects unauthenticated and unauthorized-tenant human identities', async () => {
  ;(requireAuth as jest.Mock).mockResolvedValueOnce({
    ok: false, response: new Response('Unauthorized', { status: 401 }),
  })
  expect((await POST(req('POST', apply), params)).status).toBe(401)
  ;(requireMerchantMembership as jest.Mock).mockRejectedValueOnce(new MerchantAccessError())
  expect((await POST(req('POST', apply), params)).status).toBe(404)
  expect(applyMerchantFactoryCampaignConfiguration).not.toHaveBeenCalled()
})
