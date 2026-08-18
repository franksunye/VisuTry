/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/cloudflare', () => ({
  createMerchantWithOwner: jest.fn(),
  MerchantProvisioningError: class MerchantProvisioningError extends Error {
    code: string
    constructor(code: string) {
      super(code)
      this.code = code
    }
  },
}))

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { createMerchantWithOwner } from '@/modules/merchant/cloudflare'
import { POST } from '@/app/api/merchant/workspaces/route'

const auth = requireAuth as jest.Mock
const provision = createMerchantWithOwner as jest.Mock

function request(body: unknown) {
  return new NextRequest('http://localhost/api/merchant/workspaces', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('merchant workspace creation route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'session-user' })
    provision.mockResolvedValue({
      merchant: { id: 'merchant-new', slug: 'golden-path-test', name: 'Golden Path Test' },
      membership: { id: 'membership-new', userId: 'session-user', merchantId: 'merchant-new', role: 'OWNER' },
    })
  })

  it('uses the authenticated session user and provisions an owner workspace', async () => {
    const response = await POST(request({ name: 'Golden Path Test', websiteUrl: 'https://example.test', userId: 'attacker' }))
    expect(response.status).toBe(201)
    expect(provision).toHaveBeenCalledWith({ userId: 'session-user', name: 'Golden Path Test', websiteUrl: 'https://example.test' })
    expect(await response.json()).toMatchObject({
      success: true,
      data: { membership: { role: 'OWNER', userId: 'session-user' } },
    })
  })

  it('rejects malformed input before provisioning', async () => {
    const response = await POST(request({ name: 42 }))
    expect(response.status).toBe(400)
    expect(provision).not.toHaveBeenCalled()
  })

  it('allows a first workspace without a brand name', async () => {
    const response = await POST(request({}))
    expect(response.status).toBe(201)
    expect(provision).toHaveBeenCalledWith({ userId: 'session-user', name: undefined, websiteUrl: undefined })
  })

  it('preserves unauthenticated behavior', async () => {
    auth.mockResolvedValue({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const response = await POST(request({ name: 'No Session' }))
    expect(response.status).toBe(401)
    expect(provision).not.toHaveBeenCalled()
  })
})
