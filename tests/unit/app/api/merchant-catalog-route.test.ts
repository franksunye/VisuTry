/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {
    readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
    readonly httpStatus = 404
  },
}))
jest.mock('@/modules/merchant/application/merchant-catalog-delete', () => ({ deleteUnusedMerchantFrame: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-catalog-lifecycle', () => ({ changeMerchantFrameLifecycle: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-onboarding', () => ({
  MAX_CATALOG_IMPORT: 1000,
  listMerchantFrames: jest.fn(),
  importMerchantFrames: jest.fn(),
  updateMerchantFrame: jest.fn(),
  MerchantOnboardingError: class MerchantOnboardingError extends Error {
    readonly code = 'INVALID_CATALOG'
    readonly httpStatus = 400
  },
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { importMerchantFrames, listMerchantFrames, updateMerchantFrame, MerchantOnboardingError } from '@/modules/merchant/application/merchant-onboarding'
import { deleteUnusedMerchantFrame } from '@/modules/merchant/application/merchant-catalog-delete'
import { changeMerchantFrameLifecycle } from '@/modules/merchant/application/merchant-catalog-lifecycle'
import { GET, POST } from '@/app/api/merchant/[merchantId]/catalog/route'
import { PATCH, DELETE } from '@/app/api/merchant/[merchantId]/catalog/[frameId]/route'
import { POST as LIFECYCLE_POST } from '@/app/api/merchant/[merchantId]/catalog/[frameId]/lifecycle/route'

const mockAuth = requireAuth as jest.Mock
const mockMembership = requireMerchantMembership as jest.Mock
const mockImport = importMerchantFrames as jest.Mock
const mockList = listMerchantFrames as jest.Mock
const mockUpdate = updateMerchantFrame as jest.Mock
const mockDelete = deleteUnusedMerchantFrame as jest.Mock
const mockLifecycle = changeMerchantFrameLifecycle as jest.Mock

function request(body?: unknown, method: 'POST' | 'PATCH' | 'DELETE' = 'POST') {
  return new NextRequest('http://localhost/api/merchant/merchant-a/catalog', body === undefined ? undefined : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}

describe('Human merchant catalog route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ ok: true, userId: 'user-a' })
    mockMembership.mockResolvedValue({ userId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a', role: 'OWNER' })
    mockList.mockResolvedValue({ items: [], nextCursor: null })
    mockImport.mockResolvedValue({ ids: ['frame-a'], created: 1, updated: 0, imported: 1 })
    mockUpdate.mockResolvedValue({ id: 'frame-a', name: 'Corrected frame' })
    mockDelete.mockResolvedValue({ id: 'frame-a' })
    mockLifecycle.mockResolvedValue({ id: 'frame-a', status: 'INACTIVE' })
  })

  it('requires explicit approval before any write', async () => {
    const response = await POST(request({ frames: [{ sku: 'A', name: 'Frame', shape: 'round' }] }), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'APPROVAL_REQUIRED' })
    expect(mockImport).not.toHaveBeenCalled()
  })

  it('checks membership and writes through the canonical import service', async () => {
    const response = await POST(request({ approved: true, sourceType: 'manual', frames: [{ sku: 'A', name: 'Frame', shape: 'round', imageUrl: 'https://cdn.example.test/a.jpg' }] }), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(200)
    expect(mockMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(mockImport).toHaveBeenCalledWith(expect.objectContaining({ actor: expect.objectContaining({ actorType: 'HUMAN', actorId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a' }) }))
  })

  it('keeps catalog reads tenant-scoped and cursor-paginated', async () => {
    const response = await GET(new NextRequest('http://localhost/api/merchant/merchant-a/catalog?limit=50&cursor=frame-0'), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ actor: expect.objectContaining({ merchantId: 'merchant-a' }), limit: 50, cursor: 'frame-0' }))
  })

  it('passes an optional exact frame ID through the existing membership-checked GET path', async () => {
    const response = await GET(new NextRequest('http://localhost/api/merchant/merchant-a/catalog?frameId=frame-51'), { params: { merchantId: 'merchant-a' } })

    expect(response.status).toBe(200)
    expect(mockMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({
      actor: expect.objectContaining({ merchantId: 'merchant-a', membershipId: 'membership-a' }),
      frameId: 'frame-51',
    }))
  })

  it('updates one tenant-owned resource by frame id without requiring SKU', async () => {
    const response = await PATCH(request({ frame: { name: 'Corrected frame', imageUrl: 'https://cdn.example.test/a.jpg', productUrl: 'https://shop.example.test/a' } }, 'PATCH'), { params: { merchantId: 'merchant-a', frameId: 'frame-a' } })
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ frameId: 'frame-a', actor: expect.objectContaining({ merchantId: 'merchant-a' }), frame: expect.objectContaining({ name: 'Corrected frame' }) }))
  })

  it('does not let a cross-merchant frame id bypass selected-merchant membership', async () => {
    mockUpdate.mockRejectedValueOnce(new MerchantAccessError())

    const response = await PATCH(request({ frame: { name: 'Tampered update', imageUrl: 'https://cdn.example.test/a.jpg' } }, 'PATCH'), { params: { merchantId: 'merchant-a', frameId: 'frame-owned-by-merchant-b' } })

    expect(response.status).toBe(404)
    expect(mockMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ frameId: 'frame-owned-by-merchant-b', actor: expect.objectContaining({ merchantId: 'merchant-a' }) }))
  })
  it('requires human approval for Archive and Restore and does not accept unrecognized actions', async () => {
    const params = { params: { merchantId: 'merchant-a', frameId: 'frame-a' } }
    for (const invalid of [{ action: 'ARCHIVE' }, { action: 'RESTORE', approved: false }, { action: 'DELETE', approved: true }]) {
      const response = await LIFECYCLE_POST(request(invalid), params)
      expect(response.status).toBe(400)
      expect(mockLifecycle).not.toHaveBeenCalled()
    }
    const response = await LIFECYCLE_POST(request({ action: 'ARCHIVE', approved: true }), params)
    expect(response.status).toBe(200)
    expect(mockMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(mockLifecycle).toHaveBeenCalledWith({
      actor: expect.objectContaining({ actorType: 'HUMAN', merchantId: 'merchant-a', membershipId: 'membership-a' }),
      frameId: 'frame-a', action: 'ARCHIVE',
    })
  })

  it('denies nonmember lifecycle requests before invoking mutation', async () => {
    mockMembership.mockRejectedValueOnce(new MerchantAccessError())
    const response = await LIFECYCLE_POST(
      request({ action: 'RESTORE', approved: true }),
      { params: { merchantId: 'merchant-a', frameId: 'frame-a' } },
    )
    expect(response.status).toBe(404)
    expect(mockLifecycle).not.toHaveBeenCalled()
  })

  it('requires a deliberate DELETE confirmation and Owner/Admin membership', async () => {
    const params = { params: { merchantId: 'merchant-a', frameId: 'frame-a' } }
    const missingApproval = await DELETE(request({ approved: false }, 'DELETE'), params)
    expect(missingApproval.status).toBe(400)
    expect(mockDelete).not.toHaveBeenCalled()

    const confirmed = await DELETE(request({ approved: true }, 'DELETE'), params)
    expect(confirmed.status).toBe(200)
    expect(mockMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(mockDelete).toHaveBeenCalledWith({ actor: expect.objectContaining({ actorType: 'HUMAN', merchantId: 'merchant-a', actorId: 'user-a' }), frameId: 'frame-a' })
  })

  it('rejects an authenticated non-member before executing any destructive command', async () => {
    mockMembership.mockRejectedValueOnce(new MerchantAccessError())
    const denied = await DELETE(
      request({ approved: true }, 'DELETE'),
      { params: { merchantId: 'merchant-a', frameId: 'frame-a' } },
    )
    // Membership denials deliberately use the same tenant-safe 404 as unknown frames.
    expect(denied.status).toBe(404)
    expect(await denied.json()).toMatchObject({ error: 'MERCHANT_ACCESS_NOT_FOUND' })
    expect(mockMembership).toHaveBeenCalledWith({
      userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'],
    })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('does not leak foreign frame identities or destroy referenced products', async () => {
    mockDelete.mockRejectedValueOnce(new MerchantAccessError())
    const foreign = await DELETE(request({ approved: true }, 'DELETE'), { params: { merchantId: 'merchant-a', frameId: 'foreign-id' } })
    expect(foreign.status).toBe(404)

    const referenced = new MerchantOnboardingError('PRODUCT_IN_USE', 'Product in use', 409) as Error & { code: string; httpStatus: number }
    referenced.code = 'PRODUCT_IN_USE'
    referenced.httpStatus = 409
    mockDelete.mockRejectedValueOnce(referenced)
    const blocked = await DELETE(request({ approved: true }, 'DELETE'), { params: { merchantId: 'merchant-a', frameId: 'in-use' } })
    expect(blocked.status).toBe(409)
    expect(await blocked.json()).toMatchObject({ error: 'PRODUCT_IN_USE' })
  })

})
