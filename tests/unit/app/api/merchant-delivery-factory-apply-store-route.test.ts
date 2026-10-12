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
  applyMerchantFactoryDraftStoreV1: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { applyMerchantFactoryDraftStoreV1 } from '@/modules/merchant/application/merchant-delivery-factory-apply'
import { MerchantFactoryApplyError } from '@/modules/merchant/domain/merchant-delivery-factory-apply-v1'
import { ExperienceCommandError } from '@/modules/store/application/experience-command-service'
import { POST } from '@/app/api/merchant/[merchantId]/delivery-factory/apply-store/route'

const auth = requireAuth as jest.Mock
const member = requireMerchantMembership as jest.Mock
const apply = applyMerchantFactoryDraftStoreV1 as jest.Mock
const params = { params: { merchantId: 'merchant-a' } }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-a'] },
  brand: { displayName: 'Store A' },
  store: { name: 'Store Updated', selectedFrameIds: ['frame-a'] },
  campaigns: [],
}
const payload = {
  approved: true,
  expectedStoreUpdatedAt: '2026-10-12T08:30:00.000Z',
  expectedStoreId: 'store-id-a',
  manifestDigest: 'a'.repeat(64),
  manifest,
}
function request(body: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/delivery-factory/apply-store', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('Factory Owner-only approved Draft Store Apply HTTP', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'owner-a' })
    member.mockResolvedValue({ membershipId: 'member-a', role: 'OWNER' })
    apply.mockResolvedValue({
      version: 1, status: 'DRAFT_STORE_CONFIGURATION_APPLIED',
      storeId: 'store-a', releaseReady: false, publicRender: 'NOT_EXECUTED',
    })
  })

  it('requires a fresh Owner membership and exact, approved revision before canonical command', async () => {
    const res = await POST(request(payload), params)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await res.json()).toMatchObject({
      success: true, data: {
        status: 'DRAFT_STORE_CONFIGURATION_APPLIED', releaseReady: false,
        publicRender: 'NOT_EXECUTED',
      },
    })
    expect(member).toHaveBeenCalledWith({
      userId: 'owner-a', merchantId: 'merchant-a', roles: ['OWNER'],
    })
    expect(apply).toHaveBeenCalledWith({
      actor: { actorType: 'HUMAN', actorId: 'owner-a', merchantId: 'merchant-a', membershipId: 'member-a' },
      proposal: manifest, expectedStoreUpdatedAt: '2026-10-12T08:30:00.000Z',
      expectedStoreId: 'store-id-a',
      manifestDigest: 'a'.repeat(64),
    })
  })

  it.each([
    ['no explicit approval', { ...payload, approved: false }],
    ['no optimistic precondition', { approved: true, manifest }],
    ['no prepared Store target', { ...payload, expectedStoreId: undefined }],
    ['invalid prepared Store target', { ...payload, expectedStoreId: '' }],
    ['oversized prepared Store target', { ...payload, expectedStoreId: 'a'.repeat(121) }],
    ['no prepared manifest digest', { approved: true, expectedStoreUpdatedAt: '2026-10-12T08:30:00.000Z', manifest }],
    ['inject Store status', { ...payload, manifest: {
      ...manifest, store: { ...manifest.store, status: 'ACTIVE' },
    } }],
    ['inject publish approval inside manifest', { ...payload, manifest: {
      ...manifest, approved: true,
    } }],
    ['body contains an unsupported high-impact field', {
      ...payload, publish: true,
    }],
  ])('rejects %s with HTTP 400 before any business mutation', async (_name, body) => {
    const res = await POST(request(body), params)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'INVALID_FACTORY_APPLY_REQUEST' })
    expect(apply).not.toHaveBeenCalled()
  })

  it('returns 401 and no Store call for unauthenticated requests', async () => {
    auth.mockResolvedValueOnce({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const res = await POST(request(payload), params)
    expect(res.status).toBe(401)
    expect(member).not.toHaveBeenCalled()
    expect(apply).not.toHaveBeenCalled()
  })

  it('masks foreign/non-Owner membership as not found', async () => {
    member.mockRejectedValueOnce(new MerchantAccessError())
    const res = await POST(request(payload), params)
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'RESOURCE_NOT_FOUND' })
    expect(apply).not.toHaveBeenCalled()
  })

  it('returns recoverable 409 after revision or plan conflicts and no false Apply receipt', async () => {
    apply.mockRejectedValueOnce(new MerchantFactoryApplyError())
    const res = await POST(request(payload), params)
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ success: false, error: 'FACTORY_DRAFT_STORE_CONFLICT' })
  })

  it.each([
    ['Draft became ACTIVE', new ExperienceCommandError('Agent changes are limited to Draft Experiences.')],
    ['stale locked revision', new ExperienceCommandError('FACTORY_DRAFT_STORE_STALE_REVISION')],
    ['Prisma serializable transaction conflict', { code: 'P2034' }],
    ['real PG adapter P2010 wrapper', {
      code: 'P2010', meta: { driverAdapterError: { kind: 'TransactionWriteConflict' } },
    }],
    ['direct SQLSTATE 40001', { code: '40001' }],
  ])('returns recoverable 409 for %s', async (_reason, error) => {
    apply.mockRejectedValueOnce(error)
    const res = await POST(request(payload), params)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: 'FACTORY_DRAFT_STORE_CONFLICT' })
  })

  it('does not disguise unrelated database errors as conflicts', async () => {
    apply.mockRejectedValueOnce({
      code: 'P2010', meta: { driverAdapterError: { kind: 'ForeignKeyConstraintViolation', originalCode: '23503' } },
    })
    const res = await POST(request(payload), params)
    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({ error: 'FACTORY_APPLY_UNAVAILABLE' })
  })

  it('redacts unexpected DB details instead of returning a false accepted result', async () => {
    apply.mockRejectedValueOnce(new Error('postgres://secret and shopper@example.test'))
    const res = await POST(request(payload), params)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ success: false, error: 'FACTORY_APPLY_UNAVAILABLE' })
  })
})
