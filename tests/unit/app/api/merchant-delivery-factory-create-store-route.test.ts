/** @jest-environment node */
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {},
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-create-store', () => ({
  prepareMerchantFactoryDraftStoreCreation: jest.fn(),
  createMerchantFactoryDraftStore: jest.fn(),
}))
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryDraftStoreCreation, createMerchantFactoryDraftStore,
} from '@/modules/merchant/application/merchant-delivery-factory-create-store'
import { POST, PUT } from '@/app/api/merchant/[merchantId]/delivery-factory/create-store/route'

const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-1'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['frame-1'] },
  campaigns: [],
}
const params = { params: { merchantId: 'tenant-a' } }
function request(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/merchant/tenant-a/delivery-factory/create-store', {
    method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'owner' })
  ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ membershipId: 'm-a', role: 'OWNER' })
  ;(prepareMerchantFactoryDraftStoreCreation as jest.Mock).mockResolvedValue({
    expectedStoreAbsent: true, manifestDigest: 'a'.repeat(64),
    releaseReady: false,
  })
  ;(createMerchantFactoryDraftStore as jest.Mock).mockResolvedValue({
    status: 'DRAFT_STORE_CREATED_ONLY', storeId: 'store-1', releaseReady: false,
  })
})
describe('Human OWNER Factory Draft Store create route', () => {
  it('prepares without write, no-store, role-scoped', async () => {
    const response = await PUT(request('PUT', manifest), params)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(requireMerchantMembership).toHaveBeenCalledWith({
      userId: 'owner', merchantId: 'tenant-a', roles: ['OWNER'],
    })
    expect(createMerchantFactoryDraftStore).not.toHaveBeenCalled()
  })
  it('requires explicit approved true, exact digest and absent-target precondition', async () => {
    for (const payload of [
      { manifest, manifestDigest: 'a'.repeat(64), expectedStoreAbsent: true },
      { approved: true, manifest, manifestDigest: 'a'.repeat(64), expectedStoreAbsent: false },
      { approved: true, manifest, manifestDigest: 'invalid', expectedStoreAbsent: true },
      { approved: true, manifest: { ...manifest, approved: true }, manifestDigest: 'a'.repeat(64), expectedStoreAbsent: true },
    ]) {
      const denied = await POST(request('POST', payload), params)
      expect(denied.status).toBe(400)
    }
    expect(createMerchantFactoryDraftStore).not.toHaveBeenCalled()
    const ok = await POST(request('POST', {
      approved: true, expectedStoreAbsent: true,
      manifestDigest: 'a'.repeat(64), manifest,
    }), params)
    expect(ok.status).toBe(200)
    expect(await ok.json()).toMatchObject({ data: { releaseReady: false } })
  })
  it('denies unauthenticated create and never reaches the domain service', async () => {
    ;(requireAuth as jest.Mock).mockResolvedValueOnce({
      ok: false, response: new Response('Unauthorized', { status: 401 }),
    })
    const denied = await POST(request('POST', {
      approved: true, expectedStoreAbsent: true,
      manifestDigest: 'a'.repeat(64), manifest,
    }), params)
    expect(denied.status).toBe(401)
    expect(requireMerchantMembership).not.toHaveBeenCalled()
    expect(createMerchantFactoryDraftStore).not.toHaveBeenCalled()
  })

  it('tenant role denial returns masked 404 without executing create', async () => {
    ;(requireMerchantMembership as jest.Mock).mockRejectedValue(new MerchantAccessError())
    const denied = await POST(request('POST', {
      approved: true, expectedStoreAbsent: true,
      manifestDigest: 'a'.repeat(64), manifest,
    }), params)
    expect(denied.status).toBe(404)
    expect(createMerchantFactoryDraftStore).not.toHaveBeenCalled()
  })
})
