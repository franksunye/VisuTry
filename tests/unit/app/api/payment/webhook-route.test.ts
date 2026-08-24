/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/payment/webhook/route'
import { prisma } from '@/lib/prisma'
import { clearUserCache } from '@/lib/cache'
import { handleSuccessfulPayment, verifyWebhookSignature } from '@/lib/stripe'
import { logger } from '@/lib/logger'

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({ get: () => 'test-signature' })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    user: { update: jest.fn() },
    payment: { findFirst: jest.fn() },
  },
}))

jest.mock('@/lib/cache', () => ({ clearUserCache: jest.fn() }))
jest.mock('@/lib/stripe', () => ({
  verifyWebhookSignature: jest.fn(),
  handleSuccessfulPayment: jest.fn(),
  handleSubscriptionCreated: jest.fn(),
  handleSubscriptionUpdated: jest.fn(),
  handleSubscriptionDeleted: jest.fn(),
}))
jest.mock('@/lib/logger', () => ({
  getRequestContext: jest.fn().mockReturnValue({}),
  getRequestLanguageContext: jest.fn().mockReturnValue({}),
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))
jest.mock('@/config/pricing', () => ({
  QUOTA_CONFIG: { MONTHLY_SUBSCRIPTION: 90, YEARLY_SUBSCRIPTION: 1260 },
  PRODUCT_METADATA: {
    CREDITS_PACK: { paymentDescription: '30 AI credits' },
  },
  getProductQuota: jest.fn(() => 30),
}))

const mockVerifyWebhookSignature = verifyWebhookSignature as jest.Mock
const mockHandleSuccessfulPayment = handleSuccessfulPayment as jest.Mock
const mockTransaction = prisma.$transaction as jest.Mock
const mockClearUserCache = clearUserCache as jest.Mock
const mockLogger = logger as unknown as { info: jest.Mock; error: jest.Mock }

const tx = {
  payment: {
    create: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  user: { update: jest.fn() },
  faceAnalysisTask: { updateMany: jest.fn() },
}

function checkoutSession(
  paymentStatus: 'paid' | 'unpaid' = 'paid',
  productType = 'CREDITS_PACK',
) {
  return {
    id: 'cs_test_checkout',
    payment_status: paymentStatus,
    client_reference_id: 'user-1',
    payment_intent: productType.startsWith('PREMIUM_') ? null : 'pi_test_checkout',
    subscription: productType.startsWith('PREMIUM_') ? 'sub_test_checkout' : null,
    metadata: {
      userId: 'user-1',
      productType,
      unlockTaskId: 'analysis-1',
    },
  }
}

function webhookRequest() {
  return new NextRequest('http://localhost/api/payment/webhook', {
    method: 'POST',
    body: '{}',
    headers: { 'stripe-signature': 'test-signature' },
  })
}

describe('/api/payment/webhook checkout fulfillment', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    mockHandleSuccessfulPayment.mockResolvedValue({
      userId: 'user-1',
      productType: 'CREDITS_PACK',
      amount: 299,
      currency: 'usd',
      sessionId: 'cs_test_checkout',
      paymentIntentId: 'pi_test_checkout',
      unlockTaskId: 'analysis-1',
      attribution: undefined,
    })
    mockTransaction.mockImplementation(async (callback) => callback(tx))
    tx.payment.updateMany.mockResolvedValue({ count: 1 })
    tx.payment.findUnique.mockResolvedValue(null)
    ;(prisma.payment as any).updateMany = jest.fn().mockResolvedValue({ count: 1 })
  })

  it('waits to fulfill a completed Checkout Session while payment is unpaid', async () => {
    mockVerifyWebhookSignature.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: checkoutSession('unpaid') },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockClearUserCache).not.toHaveBeenCalled()
  })

  it('atomically fulfills a paid Checkout Session once', async () => {
    mockVerifyWebhookSignature.mockReturnValue({
      type: 'checkout.session.async_payment_succeeded',
      data: { object: checkoutSession('paid') },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(tx.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ stripeSessionId: 'cs_test_checkout' }),
      data: expect.objectContaining({
        status: 'COMPLETED',
        statusReason: 'stripe_webhook_paid',
      }),
    }))
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: { creditsPurchased: { increment: 30 } },
    }))
    expect(tx.faceAnalysisTask.updateMany).toHaveBeenCalledWith({
      where: { id: 'analysis-1', userId: 'user-1' },
      data: { reportUnlocked: true },
    })
    expect(mockClearUserCache).toHaveBeenCalledWith('user-1')
    expect(mockLogger.info).toHaveBeenCalledWith('payment', 'payment_fulfilled', {
      productType: 'CREDITS_PACK',
      status: 'COMPLETED',
      fulfillment: 'credits_and_unlock',
    }, {})
  })

  it('preserves Payment attribution fields that are absent from compact Stripe metadata', async () => {
    mockHandleSuccessfulPayment.mockResolvedValue({
      userId: 'user-1',
      productType: 'CREDITS_PACK',
      amount: 299,
      currency: 'usd',
      sessionId: 'cs_test_checkout',
      paymentIntentId: 'pi_test_checkout',
      unlockTaskId: 'analysis-1',
      attribution: {
        checkout_locale: 'de',
        geo_country: 'DE',
      },
    })
    tx.payment.findUnique.mockResolvedValue({
      status: 'PENDING',
      attribution: {
        landing_page: '/fr/pricing',
        landing_locale: 'fr',
        pricing_locale: 'fr',
        browser_language: 'fr-FR',
      },
    })
    mockVerifyWebhookSignature.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: checkoutSession('paid') },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(tx.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        attribution: {
          landing_page: '/fr/pricing',
          landing_locale: 'fr',
          pricing_locale: 'fr',
          browser_language: 'fr-FR',
          checkout_locale: 'de',
          geo_country: 'DE',
        },
      }),
    }))
  })

  it.each([
    ['PREMIUM_MONTHLY', 899],
    ['PREMIUM_YEARLY', 8999],
  ])('unlocks the triggering report for a paid %s Checkout without adding credits', async (productType, amount) => {
    mockHandleSuccessfulPayment.mockResolvedValue({
      userId: 'user-1',
      productType,
      amount,
      currency: 'usd',
      sessionId: 'cs_test_checkout',
      paymentIntentId: null,
      unlockTaskId: 'analysis-1',
      attribution: undefined,
    })
    mockVerifyWebhookSignature.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: checkoutSession('paid', productType) },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.faceAnalysisTask.updateMany).toHaveBeenCalledWith({
      where: { id: 'analysis-1', userId: 'user-1' },
      data: { reportUnlocked: true },
    })
    expect(mockClearUserCache).toHaveBeenCalledWith('user-1')
  })

  it('acknowledges a duplicate fulfillment without granting credits twice', async () => {
    mockVerifyWebhookSignature.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: checkoutSession('paid') },
    })
    tx.payment.updateMany.mockResolvedValue({ count: 0 })
    tx.payment.findUnique.mockResolvedValue({ status: 'COMPLETED' })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mockClearUserCache).not.toHaveBeenCalled()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it('marks an expired Checkout attempt as failed without granting credits', async () => {
    mockVerifyWebhookSignature.mockReturnValue({
      type: 'checkout.session.expired',
      data: { object: checkoutSession('unpaid') },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect((prisma.payment as any).updateMany).toHaveBeenCalledWith({
      where: { stripeSessionId: 'cs_test_checkout', status: 'PENDING' },
      data: expect.objectContaining({
        status: 'FAILED',
        statusReason: 'checkout_session_expired',
      }),
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('returns a non-2xx response so Stripe retries transient fulfillment failures', async () => {
    mockVerifyWebhookSignature.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: checkoutSession('paid') },
    })
    mockTransaction.mockRejectedValue(new Error('database temporarily unavailable'))

    const response = await POST(webhookRequest())

    expect(response.status).toBe(400)
    expect(mockLogger.error).toHaveBeenCalledWith('payment', 'payment_fulfillment_failed', undefined, {
      stage: 'checkout_session_completed',
      retryable: true,
    }, {})
  })
})
