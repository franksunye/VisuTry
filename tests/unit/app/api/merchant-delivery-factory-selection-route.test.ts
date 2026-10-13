/** @jest-environment node */
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {},
}))
jest.mock('@/modules/merchant/application/merchant-delivery-factory-selection', () => ({
  prepareMerchantFactoryDraftSelection: jest.fn(),
  applyMerchantFactoryDraftSelection: jest.fn(),
}))
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership, MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryDraftSelection, applyMerchantFactoryDraftSelection,
} from '@/modules/merchant/application/merchant-delivery-factory-selection'
import { PUT, POST } from '@/app/api/merchant/[merchantId]/delivery-factory/selection/route'

const params = { params: { merchantId: 'tenant-a' } }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['f1'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', selectedFrameIds: ['f1'] },
  campaigns: [],
}
const prepared = { target: { type: 'STORE' }, manifest }
function req(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/merchant/tenant-a/delivery-factory/selection', {
    method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'owner' })
  ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ membershipId: 'owner-membership', role: 'OWNER' })
  ;(prepareMerchantFactoryDraftSelection as jest.Mock).mockResolvedValue({ expectedExperienceId: 'store-id', releaseReady: false })
  ;(applyMerchantFactoryDraftSelection as jest.Mock).mockResolvedValue({ status: 'DRAFT_SELECTION_APPLIED', releaseReady: false })
})
it('Owner prepares a truthful read-only selection diff with no-store', async () => {
  const response = await PUT(req('PUT', prepared), params)
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(requireMerchantMembership).toHaveBeenCalledWith({
    userId: 'owner', merchantId: 'tenant-a', roles: ['OWNER'],
  })
  expect(applyMerchantFactoryDraftSelection).not.toHaveBeenCalled()
})
it('rejects unapproved, injected Manifest or unknown target fields without invoking Apply', async () => {
  for (const body of [
    { ...prepared, expectedExperienceId: 'store-id', expectedUpdatedAt: '2026-10-01T00:00:00Z', manifestDigest: 'a'.repeat(64) },
    { ...prepared, approved: true, expectedExperienceId: 'store-id', expectedUpdatedAt: '2026-10-01T00:00:00Z', manifestDigest: 'a'.repeat(64), manifest: { ...manifest, approved: true } },
    { ...prepared, approved: true, expectedExperienceId: 'store-id', expectedUpdatedAt: '2026-10-01T00:00:00Z', manifestDigest: 'a'.repeat(64), target: { type: 'STORE', merchantId: 'foreign' } },
  ]) {
    expect((await POST(req('POST', body), params)).status).toBe(400)
  }
  expect(applyMerchantFactoryDraftSelection).not.toHaveBeenCalled()
  const accepted = await POST(req('POST', {
    ...prepared, approved: true, expectedExperienceId: 'store-id',
    expectedUpdatedAt: '2026-10-01T00:00:00Z', manifestDigest: 'a'.repeat(64),
  }), params)
  expect(accepted.status).toBe(200)
  expect(await accepted.json()).toMatchObject({ data: { releaseReady: false } })
})
it('denies anonymous and foreign tenant Owner before any selection action', async () => {
  ;(requireAuth as jest.Mock).mockResolvedValueOnce({
    ok: false, response: new Response('Unauthorized', { status: 401 }),
  })
  expect((await PUT(req('PUT', prepared), params)).status).toBe(401)
  ;(requireMerchantMembership as jest.Mock).mockRejectedValueOnce(new MerchantAccessError())
  expect((await PUT(req('PUT', prepared), params)).status).toBe(404)
  expect(prepareMerchantFactoryDraftSelection).not.toHaveBeenCalled()
})
