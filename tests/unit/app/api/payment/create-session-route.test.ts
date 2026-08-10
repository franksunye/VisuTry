/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/payment/create-session/route'
import { requireAuth } from '@/lib/api-auth'
import { createCheckoutSession } from '@/lib/stripe'

jest.mock('@/lib/api-auth', () => ({ requireAuth: jest.fn() }))
jest.mock('@/lib/stripe', () => ({ createCheckoutSession: jest.fn() }))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/lib/mocks/stripe', () => ({ mockCreateCheckoutSession: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

const mockRequireAuth = requireAuth as jest.Mock
const mockCreateCheckoutSession = createCheckoutSession as jest.Mock

function checkoutRequest(body: Record<string, unknown>) {
  return new NextRequest('https://www.visutry.com/api/payment/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/payment/create-session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({
      ok: true,
      userId: 'user-1',
      session: { user: { id: 'user-1', email: 'buyer@example.com' } },
    })
    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_checkout',
      url: 'https://checkout.stripe.com/test',
    })
  })

  it('prefills the authenticated email and preserves a supported locale', async () => {
    const response = await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl: 'https://www.visutry.com/fr/dashboard?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://www.visutry.com/fr/pricing?payment=cancelled',
      locale: 'fr',
    }))

    expect(response.status).toBe(200)
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      productType: 'CREDITS_PACK',
      userId: 'user-1',
      customerEmail: 'buyer@example.com',
      checkoutLocale: 'fr',
    }))
  })

  it('rejects external return URLs', async () => {
    const response = await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl: 'https://attacker.example/success',
      cancelUrl: 'https://www.visutry.com/en/pricing',
      locale: 'en',
    }))

    expect(response.status).toBe(400)
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  })

  it('falls back to English for an unsupported Checkout locale', async () => {
    await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl: 'https://www.visutry.com/en/dashboard?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://www.visutry.com/en/pricing',
      locale: 'xx',
    }))

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      checkoutLocale: 'en',
    }))
  })
})
