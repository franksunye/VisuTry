/** @jest-environment node */
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {
    readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
    readonly httpStatus = 404
  },
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-plan', () => ({
  getMerchantFactoryDryRun: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { POST } from '@/app/api/merchant/[merchantId]/delivery-factory/verify/route'

const auth = requireAuth as jest.Mock
const membership = requireMerchantMembership as jest.Mock
const dryRun = getMerchantFactoryDryRun as jest.Mock
const params = { params: { merchantId: 'merchant-a' } }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Store A' },
  store: { name: 'Store A', selectedFrameIds: ['frame-a'] },
  campaigns: [],
}
const plan = {
  version: 1, classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
  merchantId: 'merchant-a', merchantSlug: 'store-a',
  steps: [
    { resource: 'BRAND', target: 'store-a', action: 'NO_CHANGE', changedFields: [] },
    { resource: 'STORE', target: 'default', action: 'NO_CHANGE', changedFields: [] },
  ],
  blockers: [], warnings: [], canApply: false, releaseReady: false,
}
function request(input: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/delivery-factory/verify', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
  })
}

describe('Owner-only Merchant Factory Verify HTTP v1', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'owner-a' })
    membership.mockResolvedValue({ membershipId: 'membership-a', role: 'OWNER' })
    dryRun.mockResolvedValue(plan)
  })

  it('uses canonical fresh plan read with human membership and returns an uncertified private match', async () => {
    const res = await POST(request(manifest), params)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await res.json()).toMatchObject({
      success: true, data: {
        configurationMatched: true, status: 'CONFIGURATION_MATCHED',
        releaseReady: false, canApply: false,
        verification: { publicShopperRender: 'NOT_EXECUTED', billingLive: 'NOT_EXECUTED' },
      },
    })
    expect(membership).toHaveBeenCalledWith({
      userId: 'owner-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'],
    })
    expect(dryRun).toHaveBeenCalledWith({
      actor: {
        actorType: 'HUMAN', actorId: 'owner-a',
        merchantId: 'merchant-a', membershipId: 'membership-a',
      },
      proposal: manifest,
    })
  })

  it('returns 401 before any DB access when no session is present', async () => {
    auth.mockResolvedValueOnce({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const res = await POST(request(manifest), params)
    expect(res.status).toBe(401)
    expect(membership).not.toHaveBeenCalled()
    expect(dryRun).not.toHaveBeenCalled()
  })

  it('returns tenant-masked 404 for nonmember and does not read a foreign Merchant', async () => {
    membership.mockRejectedValueOnce(new MerchantAccessError())
    const res = await POST(request(manifest), params)
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'RESOURCE_NOT_FOUND' })
    expect(dryRun).not.toHaveBeenCalled()
  })

  it('rejects approved flag as invalid input and cannot trigger an Apply', async () => {
    const res = await POST(request({ ...manifest, approved: true }), params)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'INVALID_FACTORY_MANIFEST' })
  })

  it('returns a sanitized 500 if canonical plan is inconsistent or unavailable', async () => {
    dryRun.mockResolvedValueOnce({ ...plan, merchantSlug: 'foreign' })
    const res = await POST(request(manifest), params)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ success: false, error: 'FACTORY_VERIFY_UNAVAILABLE' })
  })
})
