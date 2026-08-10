/** @jest-environment node */

import type { NextRequest } from 'next/server'
import { POST } from '@/app/api/payment/create-session/route'

const mockRequireAuth = jest.fn()
const mockCreateCheckoutSession = jest.fn()
const mockFindUnlockTask = jest.fn()
const mockCreatePayment = jest.fn()

jest.mock('@/lib/api-auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

jest.mock('@/lib/stripe', () => ({
  createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
}))

jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/lib/mocks/stripe', () => ({ mockCreateCheckoutSession: jest.fn() }))

jest.mock('@/lib/logger', () => ({
  getRequestContext: () => ({ requestId: 'unlock-critical-test' }),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/acquisition-attribution', () => ({
  sanitizeAcquisitionAttribution: () => null,
  serializeAttributionForStripe: () => undefined,
}))

jest.mock('@/i18n', () => ({
  isValidLocale: (locale: string) => locale === 'en',
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    faceAnalysisTask: {
      findFirst: (...args: unknown[]) => mockFindUnlockTask(...args),
    },
    payment: {
      create: (...args: unknown[]) => mockCreatePayment(...args),
    },
  },
}))

function makeRequest(body: Record<string, unknown>) {
  return {
    nextUrl: new URL('https://www.visutry.com/api/payment/create-session'),
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest
}

const baseBody = {
  productType: 'CREDITS_PACK',
  successUrl: 'https://www.visutry.com/en/face-analysis?unlock=success&taskId=task-1&session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://www.visutry.com/en/face-analysis?unlock=cancel&taskId=task-1',
  unlockTaskId: 'task-1',
  locale: 'en',
}

describe('Face Analysis report unlock checkout invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({
      ok: true,
      userId: 'user-1',
      session: { user: { email: 'user@example.com' } },
    })
    mockFindUnlockTask.mockResolvedValue({ reportUnlocked: false })
    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_critical',
      url: 'https://checkout.stripe.com/c/pay/cs_test_critical',
    })
    mockCreatePayment.mockResolvedValue({ id: 'payment-1' })
  })

  it('returns the auth response before creating checkout state', async () => {
    mockRequireAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false }), { status: 401 }),
    })

    const response = await POST(makeRequest(baseBody))

    expect(response.status).toBe(401)
    expect(mockFindUnlockTask).not.toHaveBeenCalled()
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    expect(mockCreatePayment).not.toHaveBeenCalled()
  })

  it('only permits one-time credit products to unlock a Face Analysis report', async () => {
    const response = await POST(makeRequest({ ...baseBody, productType: 'PREMIUM_MONTHLY' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(mockFindUnlockTask).not.toHaveBeenCalled()
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  })

  it('refuses checkout for a missing or non-owned completed report', async () => {
    mockFindUnlockTask.mockResolvedValue(null)

    const response = await POST(makeRequest(baseBody))

    expect(response.status).toBe(404)
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    expect(mockCreatePayment).not.toHaveBeenCalled()
  })

  it('refuses to charge again for an already unlocked report', async () => {
    mockFindUnlockTask.mockResolvedValue({ reportUnlocked: true })

    const response = await POST(makeRequest(baseBody))

    expect(response.status).toBe(409)
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    expect(mockCreatePayment).not.toHaveBeenCalled()
  })

  it('binds a locked completed report to the Stripe session and records pending payment state', async () => {
    const response = await POST(makeRequest(baseBody))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: true,
      data: {
        sessionId: 'cs_test_critical',
        url: 'https://checkout.stripe.com/c/pay/cs_test_critical',
      },
    })

    expect(mockFindUnlockTask).toHaveBeenCalledWith({
      where: {
        id: 'task-1',
        userId: 'user-1',
        status: 'COMPLETED',
      },
      select: { reportUnlocked: true },
    })

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        productType: 'CREDITS_PACK',
        userId: 'user-1',
        unlockTaskId: 'task-1',
        checkoutLocale: 'en',
        customerEmail: 'user@example.com',
      }),
    )

    expect(mockCreatePayment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        stripeSessionId: 'cs_test_critical',
        status: 'PENDING',
        productType: 'CREDITS_PACK',
        unlockTaskId: 'task-1',
      }),
    })
  })
})
