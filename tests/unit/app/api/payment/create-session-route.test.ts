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
jest.mock('@/lib/prisma', () => ({
  prisma: {
    faceAnalysisTask: { findFirst: jest.fn() },
    payment: { create: jest.fn() },
  },
}))
jest.mock('@/config/pricing', () => ({
  PRODUCT_METADATA: {
    PREMIUM_MONTHLY: {
      price: 899,
      currency: 'usd',
      paymentDescription: 'Monthly subscription',
    },
    CREDITS_PACK: {
      price: 299,
      currency: 'usd',
      paymentDescription: '30 AI credits',
    },
  },
  getProductQuota: jest.fn(() => 30),
}))

import { prisma } from '@/lib/prisma'

const mockRequireAuth = requireAuth as jest.Mock
const mockCreateCheckoutSession = createCheckoutSession as jest.Mock
const mockFindFaceAnalysisTask = prisma.faceAnalysisTask.findFirst as jest.Mock
const mockCreatePayment = prisma.payment.create as jest.Mock

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
    mockFindFaceAnalysisTask.mockResolvedValue({ reportUnlocked: false })
    mockCreatePayment.mockResolvedValue({ id: 'payment-1' })
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
    expect(mockCreatePayment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stripeSessionId: 'cs_test_checkout',
        status: 'PENDING',
        amount: 299,
      }),
    })
  })

  it('records report context before returning the Checkout URL', async () => {
    const response = await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl: 'https://www.visutry.com/en/face-analysis?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://www.visutry.com/en/face-analysis?unlock=cancel',
      unlockTaskId: 'analysis-1',
      locale: 'en',
    }))

    expect(response.status).toBe(200)
    expect(mockFindFaceAnalysisTask).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'analysis-1', userId: 'user-1' }),
    }))
    expect(mockCreatePayment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        unlockTaskId: 'analysis-1',
        description: 'Personalized Glasses Advisor Report + 30 non-expiring credits',
      }),
    })
  })

  it('does not create Checkout for an unavailable report', async () => {
    mockFindFaceAnalysisTask.mockResolvedValue(null)

    const response = await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl: 'https://www.visutry.com/en/face-analysis?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://www.visutry.com/en/face-analysis?unlock=cancel',
      unlockTaskId: 'analysis-missing',
      locale: 'en',
    }))

    expect(response.status).toBe(404)
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    expect(mockCreatePayment).not.toHaveBeenCalled()
  })

  it('does not attach a report unlock to a subscription Checkout', async () => {
    const response = await POST(checkoutRequest({
      productType: 'PREMIUM_MONTHLY',
      successUrl: 'https://www.visutry.com/en/face-analysis?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://www.visutry.com/en/face-analysis?unlock=cancel',
      unlockTaskId: 'analysis-1',
      locale: 'en',
    }))

    expect(response.status).toBe(400)
    expect(mockFindFaceAnalysisTask).not.toHaveBeenCalled()
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
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
