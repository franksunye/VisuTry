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
      created: true,
    })
  })

  it('uses the authenticated session user and provisions an owner workspace', async () => {
    const response = await POST(request({ name: 'Golden Path Test', websiteUrl: 'https://example.test', userId: 'attacker' }))
    expect(response.status).toBe(201)
    expect(provision).toHaveBeenCalledWith({ userId: 'session-user', name: 'Golden Path Test', websiteUrl: 'https://example.test' })
    expect(await response.json()).toMatchObject({
      success: true,
      data: { membership: { role: 'OWNER', userId: 'session-user' }, created: true },
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

  it('returns 200 for an idempotent retry of an existing workspace', async () => {
    provision.mockResolvedValue({
      merchant: { id: 'merchant-new', slug: 'golden-path-test', name: 'Golden Path Test' },
      membership: { id: 'membership-new', userId: 'session-user', merchantId: 'merchant-new', role: 'OWNER' },
      created: false,
    })
    const response = await POST(request({ name: 'Golden Path Test' }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: true, data: { created: false } })
  })

  it('rejects malformed attribution input before provisioning', async () => {
    const response = await POST(request({ source: { unexpected: true } }))
    expect(response.status).toBe(400)
    expect(provision).not.toHaveBeenCalled()
  })

  it('returns a generic recoverable error for unexpected provisioning failures', async () => {
    provision.mockRejectedValue(new Error('Prisma connection details must not reach the client'))
    const response = await POST(request({ name: 'Golden Path Test' }))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ success: false, error: 'INTERNAL_ERROR' })
  })

  it('preserves unauthenticated behavior', async () => {
    auth.mockResolvedValue({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const response = await POST(request({ name: 'No Session' }))
    expect(response.status).toBe(401)
    expect(provision).not.toHaveBeenCalled()
  })
})
