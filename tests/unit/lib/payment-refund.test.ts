import {
  inspectPaymentRefund,
  refundPayment,
} from '@/lib/payment-refund'
import { getProductQuota } from '@/config/pricing'

const paymentId = 'payment-1'
const stripePaymentId = 'pi_test_refund'
const refundId = 're_test_refund'
const packCredits = getProductQuota('CREDITS_PACK')
const createdAt = new Date('2026-08-10T12:00:00.000Z')
const now = new Date('2026-08-11T12:00:00.000Z')

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: paymentId,
    userId: 'user-1',
    stripePaymentId,
    amount: 299,
    currency: 'usd',
    status: 'COMPLETED',
    productType: 'CREDITS_PACK',
    createdAt,
    refundId: null,
    refundedAt: null,
    creditsRevoked: 0,
    user: {
      id: 'user-1',
      email: 'refund-test@example.com',
      creditsPurchased: packCredits,
      creditsUsed: 0,
    },
    ...overrides,
  } as any
}

function makeDeps(options: {
  payment?: any
  creditPayments?: any[]
  stripeRefunds?: any[]
} = {}) {
  const payment = options.payment ?? makePayment()
  const tx = {
    payment: {
      findUnique: jest.fn().mockResolvedValue(payment),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  }
  const prisma = {
    payment: {
      findUnique: jest.fn().mockResolvedValue(payment),
      findMany: jest.fn().mockResolvedValue(options.creditPayments ?? [{ id: paymentId, productType: 'CREDITS_PACK' }]),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => callback(tx)),
  }
  const stripe = {
    refunds: {
      list: jest.fn().mockResolvedValue({ data: options.stripeRefunds ?? [], has_more: false, object: 'list', url: '' }),
      create: jest.fn().mockResolvedValue({ id: refundId, status: 'succeeded', amount: 299 }),
    },
  }
  const clearUserCache = jest.fn()
  return { prisma, stripe, tx, clearUserCache }
}

describe('payment refund tool', () => {
  it('performs a read-only dry run', async () => {
    const deps = makeDeps()

    const result = await refundPayment({ ...deps, now: () => now } as any, {
      paymentId,
      mode: 'dry-run',
    })

    expect(result.status).toBe('DRY_RUN')
    expect(result.preflight.canExecute).toBe(true)
    expect(result.creditsRevoked).toBe(0)
    expect(deps.stripe.refunds.create).not.toHaveBeenCalled()
    expect(deps.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('refunds once and revokes exactly the unused pack credits', async () => {
    const deps = makeDeps()

    const result = await refundPayment({ ...deps, now: () => now } as any, {
      paymentId,
      mode: 'execute',
      confirmation: paymentId,
    })

    expect(result.status).toBe('REFUNDED')
    expect(result.stripeRefundId).toBe(refundId)
    expect(result.creditsRevoked).toBe(packCredits)
    expect(deps.stripe.refunds.create).toHaveBeenCalledWith(
      { payment_intent: stripePaymentId, reason: 'requested_by_customer' },
      { idempotencyKey: `visutry-refund-${paymentId}` },
    )
    expect(deps.tx.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REFUNDED', refundId, creditsRevoked: packCredits }),
    }))
    expect(deps.tx.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { creditsPurchased: { decrement: packCredits } },
    }))
    expect(deps.clearUserCache).toHaveBeenCalledWith('user-1')
  })

  it('reuses an existing full Stripe refund during a retry', async () => {
    const deps = makeDeps({ stripeRefunds: [{ id: refundId, status: 'succeeded', amount: 299 }] })

    const result = await refundPayment({ ...deps, now: () => now } as any, {
      paymentId,
      mode: 'execute',
      confirmation: paymentId,
    })

    expect(result.stripeRefundId).toBe(refundId)
    expect(deps.stripe.refunds.create).not.toHaveBeenCalled()
  })

  it('does not call Stripe again when VisuTry already recorded the refund', async () => {
    const deps = makeDeps({
      payment: makePayment({
        status: 'REFUNDED',
        refundId,
        creditsRevoked: packCredits,
      }),
    })

    const result = await refundPayment({ ...deps, now: () => now } as any, {
      paymentId,
      mode: 'execute',
      confirmation: paymentId,
    })

    expect(result.status).toBe('ALREADY_REFUNDED')
    expect(result.creditsRevoked).toBe(packCredits)
    expect(deps.stripe.refunds.list).not.toHaveBeenCalled()
    expect(deps.stripe.refunds.create).not.toHaveBeenCalled()
    expect(deps.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('blocks refunds when credits are used or ownership is ambiguous', async () => {
    const usedPayment = makePayment({
      user: {
        id: 'user-1',
        email: 'refund-test@example.com',
        creditsPurchased: packCredits,
        creditsUsed: 1,
      },
    })
    const usedDeps = makeDeps({ payment: usedPayment })
    const used = await inspectPaymentRefund({ prisma: usedDeps.prisma, now: () => now } as any, paymentId)
    expect(used.canExecute).toBe(false)
    expect(used.reasons.join(' ')).toContain('already used credits')

    const multipleDeps = makeDeps({ creditPayments: [
      { id: paymentId, productType: 'CREDITS_PACK' },
      { id: 'payment-2', productType: 'CREDITS_PACK' },
    ] })
    const multiple = await inspectPaymentRefund({ prisma: multipleDeps.prisma, now: () => now } as any, paymentId)
    expect(multiple.canExecute).toBe(false)
    expect(multiple.reasons.join(' ')).toContain('ownership is ambiguous')
  })

  it('requires an explicit confirmation before execution', async () => {
    const deps = makeDeps()
    await expect(refundPayment({ ...deps, now: () => now } as any, {
      paymentId,
      mode: 'execute',
    })).rejects.toThrow('Execution requires --confirm')
    expect(deps.stripe.refunds.create).not.toHaveBeenCalled()
  })
})
