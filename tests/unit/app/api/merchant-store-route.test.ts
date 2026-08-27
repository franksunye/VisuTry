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
  createMerchantStore: jest.fn(),
  getMerchantStoreWorkspace: jest.fn(),
  setMerchantStoreFrames: jest.fn(),
  updateMerchantStore: jest.fn(),
  previewMerchantStore: jest.fn(),
  publishMerchantStore: jest.fn(),
  MerchantOnboardingError: class MerchantOnboardingError extends Error {
    readonly code = 'INVALID_STORE_DETAILS'
    readonly httpStatus = 400
  },
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'
import {
  createMerchantStore,
  getMerchantStoreWorkspace,
  publishMerchantStore,
  setMerchantStoreFrames,
  updateMerchantStore,
} from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { GET, PATCH, POST, PUT } from '@/app/api/merchant/[merchantId]/store/route'
import { POST as preview } from '@/app/api/merchant/[merchantId]/store/preview/route'
import { POST as publish } from '@/app/api/merchant/[merchantId]/store/publish/route'

const auth = requireAuth as jest.Mock
const membership = requireMerchantMembership as jest.Mock

function request(path: string, body: unknown, method = 'POST') {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Human merchant Store routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'user-a' })
    membership.mockResolvedValue({ userId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a', role: 'OWNER' })
    ;(getMerchantStoreWorkspace as jest.Mock).mockResolvedValue({ store: null, catalog: [] })
    ;(createMerchantStore as jest.Mock).mockResolvedValue({ id: 'store-a', status: 'DRAFT', created: true })
    ;(updateMerchantStore as jest.Mock).mockResolvedValue({ id: 'store-a', status: 'DRAFT' })
    ;(setMerchantStoreFrames as jest.Mock).mockResolvedValue({ storeId: 'store-a', frameIds: ['frame-a'], frameCount: 1 })
    ;(publishMerchantStore as jest.Mock).mockResolvedValue({ id: 'store-a', status: 'ACTIVE' })
  })

  it('loads Store setup only for an authenticated Owner/Admin membership', async () => {
    const response = await GET(request('/api/merchant/merchant-a/store', undefined, 'GET'), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(200)
    expect(membership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(getMerchantStoreWorkspace).toHaveBeenCalledWith({ actor: { actorType: 'HUMAN', actorId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a' } })
  })

  it('allows a Store to be created with optional details omitted', async () => {
    const response = await POST(request('/api/merchant/merchant-a/store', {}), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(200)
    expect(createMerchantStore).toHaveBeenCalledWith({ actor: { actorType: 'HUMAN', actorId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a' }, name: undefined, headline: undefined, description: undefined })
  })

  it('updates details and selected products through tenant-scoped application services', async () => {
    await PATCH(request('/api/merchant/merchant-a/store', { storeId: 'store-a', name: 'Luna Store' }, 'PATCH'), { params: { merchantId: 'merchant-a' } })
    await PUT(request('/api/merchant/merchant-a/store', { storeId: 'store-a', frameIds: ['frame-a'] }, 'PUT'), { params: { merchantId: 'merchant-a' } })
    expect(updateMerchantStore).toHaveBeenCalledWith(expect.objectContaining({ storeId: 'store-a', name: 'Luna Store' }))
    expect(setMerchantStoreFrames).toHaveBeenCalledWith(expect.objectContaining({ storeId: 'store-a', frameIds: ['frame-a'] }))
  })

  it('requires explicit publish approval before calling the publish service', async () => {
    const response = await publish(request('/api/merchant/merchant-a/store/publish', { storeId: 'store-a', approved: false }), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'APPROVAL_REQUIRED' })
    expect(publishMerchantStore).not.toHaveBeenCalled()
  })

  it('returns a client error for malformed JSON instead of an internal error', async () => {
    const malformed = new NextRequest('http://localhost/api/merchant/merchant-a/store', { method: 'POST', body: '{', headers: { 'content-type': 'application/json' } })
    const response = await POST(malformed, { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(400)
    expect(createMerchantStore).not.toHaveBeenCalled()
  })

  it('supports preview and approved publish on the same authenticated Store boundary', async () => {
    const previewResponse = await preview(request('/api/merchant/merchant-a/store/preview', { storeId: 'store-a' }), { params: { merchantId: 'merchant-a' } })
    const publishResponse = await publish(request('/api/merchant/merchant-a/store/publish', { storeId: 'store-a', approved: true }), { params: { merchantId: 'merchant-a' } })
    expect(previewResponse.status).toBe(200)
    expect(publishResponse.status).toBe(200)
    expect(publishMerchantStore).toHaveBeenCalledWith(expect.objectContaining({ storeId: 'store-a', approved: true }))
  })
})
