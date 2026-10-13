/** @jest-environment node */
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {},
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-create-campaign', () => ({
  prepareMerchantFactoryDraftCampaignCreation: jest.fn(),
  createMerchantFactoryDraftCampaign: jest.fn(),
}))
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership, MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryDraftCampaignCreation, createMerchantFactoryDraftCampaign,
} from '@/modules/merchant/application/merchant-delivery-factory-create-campaign'
import { POST, PUT } from '@/app/api/merchant/[merchantId]/delivery-factory/create-campaign/route'

const params = { params: { merchantId: 'tenant-a' } }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-1'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['frame-1'] },
  campaigns: [{ slug: 'fall', name: 'Fall', selectedFrameIds: ['frame-1'] }],
}
const body = { slug: 'fall', manifest }
function req(method: string, data: unknown) {
  return new NextRequest('http://localhost/api/merchant/tenant-a/delivery-factory/create-campaign', {
    method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  })
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'owner-a' })
  ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ membershipId: 'member-a', role: 'OWNER' })
  ;(prepareMerchantFactoryDraftCampaignCreation as jest.Mock).mockResolvedValue({
    expectedCampaignAbsent: true, manifestDigest: 'a'.repeat(64), releaseReady: false,
  })
  ;(createMerchantFactoryDraftCampaign as jest.Mock).mockResolvedValue({
    status: 'DRAFT_CAMPAIGN_CREATED_ONLY', campaignId: 'campaign-1', releaseReady: false,
  })
})
it('prepares tenant-scoped, read-only Owner diff with no-store response', async () => {
  const response = await PUT(req('PUT', body), params)
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(requireMerchantMembership).toHaveBeenCalledWith({
    userId: 'owner-a', merchantId: 'tenant-a', roles: ['OWNER'],
  })
  expect(createMerchantFactoryDraftCampaign).not.toHaveBeenCalled()
})
it('fails closed on missing approval, invalid digest, modified manifest and absent-target precondition', async () => {
  for (const candidate of [
    { ...body, manifestDigest: 'a'.repeat(64), expectedCampaignAbsent: true },
    { ...body, approved: true, manifestDigest: 'a'.repeat(64), expectedCampaignAbsent: false },
    { ...body, approved: true, manifestDigest: 'bad', expectedCampaignAbsent: true },
    { ...body, approved: true, manifestDigest: 'a'.repeat(64), expectedCampaignAbsent: true,
      manifest: { ...manifest, approved: true } },
  ]) {
    expect((await POST(req('POST', candidate), params)).status).toBe(400)
  }
  expect(createMerchantFactoryDraftCampaign).not.toHaveBeenCalled()
  const accepted = await POST(req('POST', {
    ...body, approved: true, manifestDigest: 'a'.repeat(64), expectedCampaignAbsent: true,
  }), params)
  expect(accepted.status).toBe(200)
  expect(await accepted.json()).toMatchObject({ data: { releaseReady: false } })
})
it('denies anonymous and foreign/nonowner merchant without creating', async () => {
  ;(requireAuth as jest.Mock).mockResolvedValueOnce({
    ok: false, response: new Response('Unauthorized', { status: 401 }),
  })
  const payload = { ...body, approved: true, manifestDigest: 'a'.repeat(64), expectedCampaignAbsent: true }
  expect((await POST(req('POST', payload), params)).status).toBe(401)
  ;(requireMerchantMembership as jest.Mock).mockRejectedValueOnce(new MerchantAccessError())
  expect((await POST(req('POST', payload), params)).status).toBe(404)
  expect(createMerchantFactoryDraftCampaign).not.toHaveBeenCalled()
})
it('maps known PostgreSQL unique conflict to 409, not an invented creation success', async () => {
  ;(createMerchantFactoryDraftCampaign as jest.Mock).mockRejectedValueOnce({ code: 'P2002' })
  const response = await POST(req('POST', {
    ...body, approved: true, manifestDigest: 'a'.repeat(64), expectedCampaignAbsent: true,
  }), params)
  expect(response.status).toBe(409)
  expect(await response.json()).toMatchObject({ error: 'FACTORY_CAMPAIGN_CREATE_CONFLICT' })
})
