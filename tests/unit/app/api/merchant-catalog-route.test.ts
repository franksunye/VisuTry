/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access-cloudflare', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {
    readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
    readonly httpStatus = 404
  },
}))
jest.mock('@/modules/merchant/application/merchant-onboarding-cloudflare', () => ({
  MAX_CATALOG_IMPORT: 1000,
  listMerchantFrames: jest.fn(),
  importMerchantFrames: jest.fn(),
  MerchantOnboardingError: class MerchantOnboardingError extends Error {
    readonly code = 'INVALID_CATALOG'
    readonly httpStatus = 400
  },
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'
import { importMerchantFrames, listMerchantFrames } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { GET, POST } from '@/app/api/merchant/[merchantId]/catalog/route'

const mockAuth = requireAuth as jest.Mock
const mockMembership = requireMerchantMembership as jest.Mock
const mockImport = importMerchantFrames as jest.Mock
const mockList = listMerchantFrames as jest.Mock

function request(body?: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/catalog', body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}

describe('Human merchant catalog route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ ok: true, userId: 'user-a' })
    mockMembership.mockResolvedValue({ userId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a', role: 'OWNER' })
    mockList.mockResolvedValue({ items: [], nextCursor: null })
    mockImport.mockResolvedValue({ ids: ['frame-a'], created: 1, updated: 0, imported: 1 })
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
})
