/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {
    readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
    readonly httpStatus = 404
  },
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-apply', () => ({
  prepareMerchantFactoryDraftStoreV1: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { prepareMerchantFactoryDraftStoreV1 } from '@/modules/merchant/application/merchant-delivery-factory-apply'
import { POST } from '@/app/api/merchant/[merchantId]/delivery-factory/prepare-store/route'

const auth = requireAuth as jest.Mock
const member = requireMerchantMembership as jest.Mock
const prepare = prepareMerchantFactoryDraftStoreV1 as jest.Mock
const params = { params: { merchantId: 'merchant-a' } }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Store A' },
  store: { name: 'Store Updated', selectedFrameIds: ['frame-a'] },
  campaigns: [],
}
function request(body: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/delivery-factory/prepare-store', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('Owner-only read-only Factory Prepare endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'owner-a' })
    member.mockResolvedValue({ membershipId: 'owner-member-a', role: 'OWNER' })
    prepare.mockResolvedValue({
      version: 1, status: 'HUMAN_APPROVAL_REQUIRED',
      storeId: 'store-id-a', expectedStoreUpdatedAt: '2026-10-12T08:30:00.000Z',
      manifestDigest: 'a'.repeat(64), changedFields: ['name'],
      requiresHumanApproval: true, publicRender: 'NOT_EXECUTED', releaseReady: false,
    })
  })

  it('supplies the exact Store revision and digest only for authenticated Owner', async () => {
    const res = await POST(request(manifest), params)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await res.json()).toMatchObject({
      success: true, data: {
        status: 'HUMAN_APPROVAL_REQUIRED', changedFields: ['name'],
        requiresHumanApproval: true, releaseReady: false,
      },
    })
    expect(member).toHaveBeenCalledWith({
      userId: 'owner-a', merchantId: 'merchant-a', roles: ['OWNER'],
    })
    expect(prepare).toHaveBeenCalledWith({
      actor: { actorType: 'HUMAN', actorId: 'owner-a',
        merchantId: 'merchant-a', membershipId: 'owner-member-a' },
      proposal: manifest,
    })
  })

  it('fails closed for unauthenticated sessions and non-Owner membership', async () => {
    auth.mockResolvedValueOnce({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const unauthenticated = await POST(request(manifest), params)
    expect(unauthenticated.status).toBe(401)
    member.mockRejectedValueOnce(new MerchantAccessError())
    const forbidden = await POST(request(manifest), params)
    expect(forbidden.status).toBe(404)
    expect(prepare).not.toHaveBeenCalled()
  })

  it('rejects injected approval or publish fields inside the canonical manifest', async () => {
    const bad = await POST(request({ ...manifest, approved: true }), params)
    expect(bad.status).toBe(400)
    expect(await bad.json()).toMatchObject({ error: 'INVALID_FACTORY_MANIFEST' })
    expect(prepare).not.toHaveBeenCalled()
  })

  it('redacts unexpected database errors, never returns an approval token on failure', async () => {
    prepare.mockRejectedValueOnce(new Error('postgres://secret'))
    const res = await POST(request(manifest), params)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ success: false, error: 'FACTORY_PREPARE_UNAVAILABLE' })
  })
})
