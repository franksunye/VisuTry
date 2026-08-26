/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/payment/create-session/route'
import { requireAuth } from '@/lib/api-auth'
import { createCheckoutSession } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { appendMerchantContinuation, createMerchantContinuation, merchantPricingPath } from '@/modules/store/domain/merchant-continuation'

jest.mock('@/lib/api-auth', () => ({ requireAuth: jest.fn() }))
jest.mock('@/lib/stripe', () => ({ createCheckoutSession: jest.fn() }))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/lib/mocks/stripe', () => ({ mockCreateCheckoutSession: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  getRequestLanguageContext: jest.fn().mockReturnValue({}),
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
    PREMIUM_YEARLY: {
      price: 8999,
      currency: 'usd',
      paymentDescription: 'Annual subscription',
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
const mockLogger = logger as unknown as { info: jest.Mock; error: jest.Mock }

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
      attribution: {
        landing_locale: 'en',
        pricing_locale: 'fr',
        site_locale: 'fr',
        browser_language: 'de-DE',
        browser_languages: ['de-DE', 'en-US'],
        locale_changed: true,
      },
    }))

    expect(response.status).toBe(200)
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      productType: 'CREDITS_PACK',
      userId: 'user-1',
      customerEmail: 'buyer@example.com',
      checkoutLocale: 'fr',
      attribution: expect.objectContaining({
        landing_locale: 'en',
        pricing_locale: 'fr',
        checkout_locale: 'fr',
        browser_language: 'de-DE',
      }),
    }))
    expect(mockCreatePayment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stripeSessionId: 'cs_test_checkout',
        status: 'PENDING',
        amount: 299,
        attribution: expect.objectContaining({
          landing_locale: 'en',
          pricing_locale: 'fr',
          checkout_locale: 'fr',
          browser_language: 'de-DE',
        }),
      }),
    })
    expect(mockLogger.info).toHaveBeenCalledWith(
      'payment',
      'checkout_requested',
      expect.objectContaining({
        route: 'create_session',
        site_locale: 'fr',
        checkout_locale: 'fr',
      }),
      {},
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      'payment',
      'checkout_created',
      expect.objectContaining({
        productType: 'CREDITS_PACK',
        checkoutContext: 'pricing',
        status: 'PENDING',
        site_locale: 'fr',
        checkout_locale: 'fr',
      }),
      {},
    )
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

  it.each([
    ['PREMIUM_MONTHLY', 899],
    ['PREMIUM_YEARLY', 8999],
  ])('preserves a report unlock on %s Checkout', async (productType, amount) => {
    const response = await POST(checkoutRequest({
      productType,
      successUrl: 'https://www.visutry.com/en/face-analysis?unlock=success&taskId=analysis-1&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://www.visutry.com/en/pricing?source=face-analysis-unlock&taskId=analysis-1&payment=cancelled',
      unlockTaskId: 'analysis-1',
      locale: 'en',
    }))

    expect(response.status).toBe(200)
    expect(mockFindFaceAnalysisTask).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'analysis-1', userId: 'user-1', status: 'COMPLETED' }),
    }))
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      productType,
      unlockTaskId: 'analysis-1',
    }))
    expect(mockCreatePayment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productType,
        amount,
        unlockTaskId: 'analysis-1',
      }),
    })
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

  it('accepts a paired Merchant continuation while keeping the context bounded', async () => {
    const continuation = createMerchantContinuation({
      locale: 'en',
      merchantSlug: 'ello-sunglasses',
      experienceType: 'CAMPAIGN',
      experienceSlug: 'petite-fit',
    })!
    const successUrl = `https://www.visutry.com${appendMerchantContinuation(continuation.canonicalReturnPath, continuation)}`
    const cancelUrl = `https://www.visutry.com${merchantPricingPath(continuation)}&payment=cancelled`

    const response = await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl,
      cancelUrl,
      locale: 'en',
    }))

    expect(response.status).toBe(200)
    expect(mockCreateCheckoutSession).toHaveBeenCalled()
  })

  it('rejects a Merchant continuation paired with an unrelated private return path', async () => {
    const continuation = createMerchantContinuation({
      locale: 'en',
      merchantSlug: 'ello-sunglasses',
      experienceType: 'STORE',
    })!

    const response = await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl: `https://www.visutry.com${appendMerchantContinuation(continuation.canonicalReturnPath, continuation)}`,
      cancelUrl: `https://www.visutry.com/en/admin?merchantContinuation=${encodeURIComponent(JSON.stringify(continuation))}`,
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

  it('logs unexpected Checkout failures without changing the 500 response', async () => {
    mockCreateCheckoutSession.mockRejectedValue(new Error('Stripe unavailable'))

    const response = await POST(checkoutRequest({
      productType: 'CREDITS_PACK',
      successUrl: 'https://www.visutry.com/en/dashboard?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://www.visutry.com/en/pricing',
      locale: 'en',
    }))

    expect(response.status).toBe(500)
    expect(mockLogger.error).toHaveBeenCalledWith('payment', 'checkout_failed', undefined, {
      route: 'create_session',
      stage: 'unexpected_failure',
    }, {})
  })
})
