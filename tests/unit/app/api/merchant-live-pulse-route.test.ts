/** @jest-environment node */

jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({ requireMerchantMembership: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-agent-http', () => ({
  merchantAgentErrorResponse: jest.fn(() => new Response(JSON.stringify({ success: false, error: 'FORBIDDEN' }), { status: 403 })),
}))
jest.mock('@/modules/merchant/application/merchant-live-pulse', () => ({ getMerchantLivePulse: jest.fn() }))

import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantLivePulse } from '@/modules/merchant/application/merchant-live-pulse'
import { GET } from '@/app/api/merchant/[merchantId]/live-pulse/route'

const auth = requireAuth as jest.Mock
const membership = requireMerchantMembership as jest.Mock
const readPulse = getMerchantLivePulse as jest.Mock

describe('Merchant Live Pulse API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ ok: true, userId: 'owner-a' })
    membership.mockResolvedValue({ membershipId: 'membership-a', role: 'OWNER' })
    readPulse.mockResolvedValue({ generatedAt: '2026-09-23T12:00:00.000Z', activeShoppers: 0, recentWindow: { visitors: 0, tryOnCompletions: 0, productClicks: 0 }, recentActivity: [] })
  })

  it('requires owner/admin membership and returns private no-store data', async () => {
    const response = await GET(new Request('http://localhost/api/merchant/merchant-a/live-pulse') as never, { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(membership).toHaveBeenCalledWith({ userId: 'owner-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
    expect(readPulse).toHaveBeenCalledWith({ merchantId: 'merchant-a' })
  })

  it('does not read another merchant when membership is denied', async () => {
    membership.mockRejectedValue(new Error('wrong tenant'))
    const response = await GET(new Request('http://localhost/api/merchant/merchant-b/live-pulse') as never, { params: { merchantId: 'merchant-b' } })
    expect(response.status).toBe(403)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(readPulse).not.toHaveBeenCalled()
  })

  it('does not read pulse data without authentication', async () => {
    auth.mockResolvedValue({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const response = await GET(new Request('http://localhost/api/merchant/merchant-a/live-pulse') as never, { params: { merchantId: 'merchant-a' } })
    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(membership).not.toHaveBeenCalled()
    expect(readPulse).not.toHaveBeenCalled()
  })
})
