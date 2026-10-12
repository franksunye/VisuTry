/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  MerchantAccessError: class MerchantAccessError extends Error {
    readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
    readonly httpStatus = 404
  },
  requireMerchantMembership: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-support-handoff', () => ({
  getMerchantSupportHandoff: jest.fn(),
}))

import { requireAuth } from '@/lib/api-auth-runtime'
import {
  MerchantAccessError,
  requireMerchantMembership,
} from '@/modules/merchant/application/merchant-access'
import { getMerchantSupportHandoff } from '@/modules/merchant/application/merchant-support-handoff'
import { GET } from '@/app/api/merchant/[merchantId]/delivery-factory/handoff/route'

const auth = requireAuth as jest.Mock
const membership = requireMerchantMembership as jest.Mock
const handoff = getMerchantSupportHandoff as jest.Mock
const request = (merchantId = 'merchant-a') =>
  new Request(`http://localhost/api/merchant/${merchantId}/delivery-factory/handoff`) as never

describe('Merchant Delivery Factory read-only support handoff HTTP', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'owner-a' })
    membership.mockResolvedValue({ membershipId: 'membership-a', role: 'OWNER' })
    handoff.mockResolvedValue({
      version: 1, merchant: { slug: 'demo-shop' },
      verification: { publicStoreImageDecode: 'NOT_EXECUTED' }, releaseReady: false,
    })
  })

  it('returns tenant-scoped, no-store, explicitly uncertified support handoff for an Owner', async () => {
    const res = await GET(request(), { params: { merchantId: 'merchant-a' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await res.json()).toMatchObject({
      success: true, data: { version: 1, releaseReady: false },
    })
    expect(membership).toHaveBeenCalledWith({
      userId: 'owner-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'],
    })
    expect(handoff).toHaveBeenCalledWith({ merchantId: 'merchant-a' })
  })

  it('denies unauthenticated requests before membership or data access', async () => {
    auth.mockResolvedValue({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const res = await GET(request(), { params: { merchantId: 'merchant-a' } })
    expect(res.status).toBe(401)
    expect(membership).not.toHaveBeenCalled()
    expect(handoff).not.toHaveBeenCalled()
  })

  it('masks missing or cross-tenant membership without executing the read', async () => {
    membership.mockRejectedValue(new MerchantAccessError())
    const res = await GET(request('foreign-merchant'), { params: { merchantId: 'foreign-merchant' } })
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await res.json()).toMatchObject({ success: false, error: 'RESOURCE_NOT_FOUND' })
    expect(handoff).not.toHaveBeenCalled()
  })

  it('never exposes database errors, tokens or cross-tenant identifiers in failures', async () => {
    handoff.mockRejectedValue(new Error('secret connection string customer@example.test'))
    const res = await GET(request(), { params: { merchantId: 'merchant-a' } })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ success: false, error: 'HANDOFF_UNAVAILABLE' })
  })
})
