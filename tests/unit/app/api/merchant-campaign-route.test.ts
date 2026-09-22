/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error { readonly code = 'MERCHANT_ACCESS_NOT_FOUND'; readonly httpStatus = 404 },
}))
jest.mock('@/modules/store/application/campaign-service', () => ({
  listCampaigns: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
  getCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', merchantId: 'merchant-a', status: 'DRAFT' }),
  createCampaignDraft: jest.fn().mockResolvedValue({ id: 'campaign-new', status: 'DRAFT' }),
  updateCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT' }),
  setCampaignFrames: jest.fn().mockResolvedValue({ frameIds: ['frame-a'] }),
  previewCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT' }),
  publishCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'ACTIVE' }),
  archiveCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'ARCHIVED' }),
  CampaignServiceError: class CampaignServiceError extends Error { readonly code = 'CAMPAIGN_NOT_READY'; readonly httpStatus = 409 },
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership, MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { archiveCampaign, createCampaignDraft, getCampaign, listCampaigns, previewCampaign, publishCampaign, setCampaignFrames, updateCampaign } from '@/modules/store/application/campaign-service'
import { GET as list, POST as create } from '@/app/api/merchant/[merchantId]/campaigns/route'
import { GET as detail, PATCH as update } from '@/app/api/merchant/[merchantId]/campaigns/[campaignId]/route'
import { PUT as setProducts } from '@/app/api/merchant/[merchantId]/campaigns/[campaignId]/products/route'
import { POST as preview } from '@/app/api/merchant/[merchantId]/campaigns/[campaignId]/preview/route'
import { POST as publish } from '@/app/api/merchant/[merchantId]/campaigns/[campaignId]/publish/route'
import { POST as archive } from '@/app/api/merchant/[merchantId]/campaigns/[campaignId]/archive/route'

const auth = requireAuth as jest.Mock
const membership = requireMerchantMembership as jest.Mock

function request(url: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

describe('Merchant Campaign HTTP boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'user-a' })
    membership.mockResolvedValue({ userId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a', role: 'OWNER' })
  })

  it('requires Owner/Admin membership and scopes list/create to the route Merchant', async () => {
    const listed = await list(request('/api/merchant/merchant-a/campaigns?limit=20', 'GET'), { params: { merchantId: 'merchant-a' } })
    const created = await create(request('/api/merchant/merchant-a/campaigns', 'POST', { name: 'Spring edit' }), { params: { merchantId: 'merchant-a' } })
    expect(listed.status).toBe(200)
    expect(created.status).toBe(201)
    expect(membership).toHaveBeenNthCalledWith(1, { userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(listCampaigns).toHaveBeenCalledWith({ merchantId: 'merchant-a', cursor: undefined, limit: 20 })
    expect(createCampaignDraft).toHaveBeenCalledWith({ merchantId: 'merchant-a', name: 'Spring edit' })
  })

  it('keeps path resource identity authoritative and does not leak another Merchant Campaign', async () => {
    const response = await detail(request('/api/merchant/merchant-a/campaigns/campaign-b', 'GET'), { params: { merchantId: 'merchant-a', campaignId: 'campaign-b' } })
    expect(response.status).toBe(200)
    expect(getCampaign).toHaveBeenCalledWith({ merchantId: 'merchant-a', campaignId: 'campaign-b' })
    expect(updateCampaign).not.toHaveBeenCalled()

    ;(getCampaign as jest.Mock).mockRejectedValueOnce(new MerchantAccessError())
    const denied = await detail(request('/api/merchant/merchant-a/campaigns/campaign-b', 'GET'), { params: { merchantId: 'merchant-a', campaignId: 'campaign-b' } })
    expect(denied.status).toBe(404)
    expect(await denied.json()).toMatchObject({ success: false, error: 'MERCHANT_ACCESS_NOT_FOUND' })
  })

  it('sends product selection only through the canonical campaign service and preserves path scoping', async () => {
    const response = await setProducts(request('/api/merchant/merchant-a/campaigns/campaign-a/products', 'PUT', { frameIds: ['frame-b'] }), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    expect(response.status).toBe(200)
    expect(setCampaignFrames).toHaveBeenCalledWith({ merchantId: 'merchant-a', campaignId: 'campaign-a', frameIds: ['frame-b'] })

    ;(setCampaignFrames as jest.Mock).mockRejectedValueOnce(new MerchantAccessError())
    const crossMerchantProduct = await setProducts(request('/api/merchant/merchant-a/campaigns/campaign-a/products', 'PUT', { frameIds: ['merchant-b-frame'] }), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    expect(crossMerchantProduct.status).toBe(404)
  })

  it('requires explicit publish and archive confirmation before canonical state transitions', async () => {
    const rejectedPublish = await publish(request('/api/merchant/merchant-a/campaigns/campaign-a/publish', 'POST', { approved: false }), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    const rejectedArchive = await archive(request('/api/merchant/merchant-a/campaigns/campaign-a/archive', 'POST', { confirmed: false }), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    expect(rejectedPublish.status).toBe(400)
    expect(rejectedArchive.status).toBe(400)
    expect(publishCampaign).not.toHaveBeenCalled()
    expect(archiveCampaign).not.toHaveBeenCalled()

    await publish(request('/api/merchant/merchant-a/campaigns/campaign-a/publish', 'POST', { approved: true }), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    await archive(request('/api/merchant/merchant-a/campaigns/campaign-a/archive', 'POST', { confirmed: true }), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    expect(publishCampaign).toHaveBeenCalledWith({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })
    expect(archiveCampaign).toHaveBeenCalledWith({ merchantId: 'merchant-a', campaignId: 'campaign-a' })
  })

  it('rejects cross-Merchant publish and archive before reaching canonical mutations', async () => {
    membership.mockRejectedValue(new MerchantAccessError())
    const deniedPublish = await publish(request('/api/merchant/merchant-b/campaigns/campaign-a/publish', 'POST', { approved: true }), { params: { merchantId: 'merchant-b', campaignId: 'campaign-a' } })
    const deniedArchive = await archive(request('/api/merchant/merchant-b/campaigns/campaign-a/archive', 'POST', { confirmed: true }), { params: { merchantId: 'merchant-b', campaignId: 'campaign-a' } })

    expect(deniedPublish.status).toBe(404)
    expect(deniedArchive.status).toBe(404)
    expect(publishCampaign).not.toHaveBeenCalled()
    expect(archiveCampaign).not.toHaveBeenCalled()
  })

  it('previews only saved Drafts and does not mutate through the route', async () => {
    const response = await preview(request('/api/merchant/merchant-a/campaigns/campaign-a/preview', 'POST'), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    expect(response.status).toBe(200)
    expect(previewCampaign).toHaveBeenCalledWith({ merchantId: 'merchant-a', campaignId: 'campaign-a' })
    expect(publishCampaign).not.toHaveBeenCalled()

    ;(previewCampaign as jest.Mock).mockResolvedValueOnce({ id: 'campaign-a', status: 'ACTIVE' })
    const active = await preview(request('/api/merchant/merchant-a/campaigns/campaign-a/preview', 'POST'), { params: { merchantId: 'merchant-a', campaignId: 'campaign-a' } })
    expect(active.status).toBe(409)
  })
})
