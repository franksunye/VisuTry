/** @jest-environment node */

jest.mock('@/lib/api-auth', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant', () => ({
  requireMerchantMembership: jest.fn(),
  getMerchantProfile: jest.fn(),
  updateMerchantProfile: jest.fn(),
  MerchantProfileError: class MerchantProfileError extends Error {
    code: string
    constructor(code: string) {
      super(code)
      this.code = code
    }
  },
}))
jest.mock('@/modules/merchant/application/merchant-agent-http', () => ({ merchantAgentErrorResponse: jest.fn(() => new Response('error', { status: 500 })) }))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { updateMerchantProfile } from '@/modules/merchant'
import { PATCH } from '@/app/api/merchant/[merchantId]/profile/route'

const auth = requireAuth as jest.Mock
const update = updateMerchantProfile as jest.Mock

function request(body: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('merchant profile update route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'session-user' })
    update.mockResolvedValue({ id: 'merchant-a', slug: 'alpha', name: 'Updated Brand', websiteUrl: null })
  })

  it('updates only through the authenticated merchant profile application path', async () => {
    const response = await PATCH(request({ name: 'Updated Brand', websiteUrl: null }), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(200)
    expect(update).toHaveBeenCalledWith({ userId: 'session-user', merchantId: 'merchant-a', name: 'Updated Brand', websiteUrl: null })
  })

  it('rejects malformed profile input before the application path', async () => {
    const response = await PATCH(request({ name: 42 }), { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })
})
