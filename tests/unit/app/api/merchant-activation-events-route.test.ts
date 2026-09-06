/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-activation', () => ({
  recordMerchantActivationEvent: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { recordMerchantActivationEvent } from '@/modules/merchant/application/merchant-activation'
import { POST } from '@/app/api/merchant/[merchantId]/activation-events/route'

const auth = requireAuth as jest.Mock
const membership = requireMerchantMembership as jest.Mock
const record = recordMerchantActivationEvent as jest.Mock

function request(body: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/activation-events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Merchant activation event route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'user-a' })
    membership.mockResolvedValue({ userId: 'user-a', merchantId: 'merchant-a', membershipId: 'membership-a', role: 'OWNER' })
    record.mockResolvedValue(undefined)
  })

  it('accepts only an allowlisted client event after tenant authorization', async () => {
    const response = await POST(request({
      eventType: 'merchant_workspace_entered',
      sessionId: 'session-12345678',
      correlationId: 'signup-12345678',
      attribution: {
        landingPage: '/en/business?utm_source=google',
        acquisitionSource: 'google',
        acquisitionMedium: 'organic',
      },
    }), { params: { merchantId: 'merchant-a' } })

    expect(response.status).toBe(200)
    expect(membership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(record).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'merchant-a',
      eventType: 'merchant_workspace_entered',
      source: 'CLIENT',
      sessionId: 'session-12345678',
    }))
  })

  it('rejects arbitrary event names and metadata before authorization or storage', async () => {
    const response = await POST(request({
      eventType: 'merchant_delete_everything',
      sessionId: 'session-12345678',
      metadata: { arbitrary: true },
    }), { params: { merchantId: 'merchant-a' } })

    expect(response.status).toBe(400)
    expect(membership).not.toHaveBeenCalled()
    expect(record).not.toHaveBeenCalled()
  })

  it('does not record an event for a non-member', async () => {
    const error = Object.assign(new Error('not found'), { name: 'MerchantAccessError' })
    membership.mockRejectedValue(error)

    const response = await POST(request({
      eventType: 'merchant_catalog_started',
      sessionId: 'session-12345678',
    }), { params: { merchantId: 'merchant-b' } })

    expect(response.status).toBe(404)
    expect(record).not.toHaveBeenCalled()
  })

  it('requires commercial intent for the commercial-intent event', async () => {
    const response = await POST(request({
      eventType: 'merchant_commercial_intent',
      sessionId: 'session-12345678',
    }), { params: { merchantId: 'merchant-a' } })

    expect(response.status).toBe(400)
    expect(response).toBeTruthy()
    expect(record).not.toHaveBeenCalled()
  })

  it('returns a safe internal error when durable recording fails', async () => {
    record.mockRejectedValue(new Error('database details must stay server-side'))

    const response = await POST(request({
      eventType: 'merchant_store_previewed',
      sessionId: 'session-12345678',
      resourceId: 'store-a',
    }), { params: { merchantId: 'merchant-a' } })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ success: false, error: 'INTERNAL_ERROR' })
  })
})
