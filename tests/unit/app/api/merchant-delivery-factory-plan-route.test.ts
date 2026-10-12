/** @jest-environment node */
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {
    readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
  },
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-plan', () => ({
  getMerchantFactoryDryRun: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership, MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'
import { POST } from '@/app/api/merchant/[merchantId]/delivery-factory/plan/route'

const mockAuth = requireAuth as jest.Mock
const mockMembership = requireMerchantMembership as jest.Mock
const mockDryRun = getMerchantFactoryDryRun as jest.Mock
const params = { params: { merchantId: 'tenant-a' } }
function request(data: unknown) {
  return new NextRequest('http://localhost/api/merchant/tenant-a/delivery-factory/plan', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  })
}

describe('human Merchant Factory read-only plan route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ ok: true, userId: 'user-a' })
    mockMembership.mockResolvedValue({ membershipId: 'membership-a', role: 'OWNER' })
    mockDryRun.mockResolvedValue({ version: 1, classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL', steps: [], blockers: [], canApply: false, releaseReady: false })
  })

  it('requires OWNER/ADMIN membership then reads a tenant-bound plan without executing Apply', async () => {
    const manifest = { version: 1, merchantSlug: 'store-a' }
    const res = await POST(request(manifest), params)
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(mockMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'tenant-a', roles: ['OWNER', 'ADMIN'] })
    expect(mockDryRun).toHaveBeenCalledWith({
      actor: { actorType: 'HUMAN', actorId: 'user-a', merchantId: 'tenant-a', membershipId: 'membership-a' },
      proposal: manifest,
    })
    expect(await res.json()).toMatchObject({
      success: true, data: { canApply: false, releaseReady: false },
    })
  })

  it('rejects a nonmember or foreign tenant without reaching the Factory service', async () => {
    mockMembership.mockRejectedValueOnce(new MerchantAccessError())
    const res = await POST(request({ version: 1 }), params)
    expect(res.status).toBe(404)
    expect(mockDryRun).not.toHaveBeenCalled()
  })

  it('does not treat an approved flag as execution authority', async () => {
    await POST(request({ approved: true, version: 1, merchantSlug: 'store-a' }), params)
    expect(mockDryRun).toHaveBeenCalledTimes(1)
    expect(mockDryRun.mock.calls[0][0].proposal).toMatchObject({ approved: true })
    // The service validates a strict manifest and will reject unknown 'approved'.
    expect(mockDryRun.mock.calls[0][0].actor).toMatchObject({ actorType: 'HUMAN' })
  })

  it('returns a 404 for a tenant mismatch and refuses invalid input without writing', async () => {
    mockDryRun.mockRejectedValueOnce(new Error('FACTORY_TENANT_MISMATCH'))
    const wrong = await POST(request({ merchantSlug: 'other' }), params)
    expect(wrong.status).toBe(404)
    mockDryRun.mockRejectedValueOnce(new Error('service unavailable'))
    const unavailable = await POST(request({}), params)
    expect(unavailable.status).toBe(500)
    expect(await unavailable.json()).toMatchObject({ error: 'FACTORY_PLAN_UNAVAILABLE' })
  })
})
