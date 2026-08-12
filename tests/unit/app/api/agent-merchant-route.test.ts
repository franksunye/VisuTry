/** @jest-environment node */

jest.mock('@/modules/merchant', () => ({
  authenticateMerchantAgentCredential: jest.fn(),
  getMerchantProfile: jest.fn(),
  InvalidAgentCredentialError: class InvalidAgentCredentialError extends Error {
    readonly code = 'INVALID_AGENT_CREDENTIAL'
    readonly httpStatus = 401
  },
}))

jest.mock('@/modules/merchant/application/merchant-agent-http', () => ({
  merchantAgentErrorResponse: jest.fn((error: Error & { code?: string; httpStatus?: number }) =>
    Response.json({ success: false, error: error.code }, { status: error.httpStatus ?? 500 })),
}))

import { NextRequest } from 'next/server'
import { authenticateMerchantAgentCredential, getMerchantProfile } from '@/modules/merchant'
import { GET } from '@/app/api/agent/v1/merchant/route'

const authenticate = authenticateMerchantAgentCredential as jest.Mock
const profile = getMerchantProfile as jest.Mock

describe('agent merchant profile endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticate.mockResolvedValue({
      actorType: 'AGENT_CREDENTIAL',
      actorId: 'credential-a',
      merchantId: 'merchant-a',
      scopes: ['merchant:read'],
    })
    profile.mockResolvedValue({ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE' })
  })

  it('authenticates from Bearer key and never accepts a caller tenant selector', async () => {
    const request = new NextRequest('http://localhost/api/agent/v1/merchant?merchantId=merchant-b', {
      headers: { authorization: 'Bearer vt_live_0123456789abcdef_secret' },
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(authenticate).toHaveBeenCalledWith('vt_live_0123456789abcdef_secret')
    expect(profile).toHaveBeenCalledWith({ actor: expect.objectContaining({ merchantId: 'merchant-a' }) })
  })

  it('rejects a missing Bearer credential', async () => {
    const response = await GET(new NextRequest('http://localhost/api/agent/v1/merchant'))
    expect(response.status).toBe(401)
    expect(authenticate).not.toHaveBeenCalled()
  })
})
