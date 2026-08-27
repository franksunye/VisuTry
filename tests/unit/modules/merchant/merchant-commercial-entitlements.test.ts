jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    merchantUsageLedger: { count: jest.fn() },
    experience: { count: jest.fn() },
    merchantFrame: { count: jest.fn() },
    merchantSession: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { consumeAICommerceSession } from '@/modules/merchant/application/merchant-commercial-entitlements'

const periodStart = new Date('2026-08-01T00:00:00.000Z')
const periodEnd = new Date('2026-09-01T00:00:00.000Z')
const merchant = {
  id: 'merchant-a', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', commercialStage: null,
  pricingVersion: 'v1', entitlementVersion: 'v1', commerceSessionAllowance: null,
  standardRenderAllowance: null, campaignAllowance: null, entitlementEffectiveFrom: periodStart,
  billingPeriodEnd: periodEnd, commercialExceptionCode: null, createdAt: periodStart,
}

describe('Merchant AI Commerce Session meter', () => {
  let used = 0
  const txLedger = {
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  }
  const txSession = { findFirst: jest.fn(), update: jest.fn() }

  beforeEach(() => {
    used = 0
    jest.clearAllMocks()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(merchant)
    ;(prisma.experience.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.merchantFrame.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.merchantUsageLedger.count as jest.Mock).mockImplementation(({ where }: { where: { kind: string } }) => where.kind === 'AI_COMMERCE_SESSION' ? used : 0)
    txSession.findFirst.mockImplementation(async () => ({ id: 'session-a', billableAICommerceSession: used > 0 }))
    txLedger.findUnique.mockImplementation(async () => used > 0 ? { id: 'meter-a' } : null)
    txLedger.count.mockImplementation(async () => used)
    txLedger.create.mockImplementation(async () => { used += 1; return { id: `meter-${used}` } })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({ merchantSession: txSession, merchantUsageLedger: txLedger }))
  })

  it('marks one attributed session once across repeated calls', async () => {
    const first = await consumeAICommerceSession({ merchantId: 'merchant-a', merchantSessionId: 'session-a', now: new Date('2026-08-10T00:00:00.000Z') })
    const second = await consumeAICommerceSession({ merchantId: 'merchant-a', merchantSessionId: 'session-a', now: new Date('2026-08-10T00:00:00.000Z') })

    expect(first).toMatchObject({ consumed: true, alreadyConsumed: false, used: 1, limit: 1000 })
    expect(second).toMatchObject({ consumed: false, alreadyConsumed: true, used: 1, limit: 1000 })
    expect(txLedger.create).toHaveBeenCalledTimes(1)
    expect(txSession.update).toHaveBeenCalledTimes(1)
  })

  it('does not write a meter for an expired period', async () => {
    const result = await consumeAICommerceSession({ merchantId: 'merchant-a', merchantSessionId: 'session-a', now: new Date('2026-09-01T00:00:00.000Z') })

    expect(result).toMatchObject({ consumed: false, alreadyConsumed: false, used: 0, limit: 1000 })
    expect(txLedger.create).not.toHaveBeenCalled()
  })

  it('rejects a session belonging to another merchant before writing usage', async () => {
    txSession.findFirst.mockResolvedValue(null)

    await expect(consumeAICommerceSession({ merchantId: 'merchant-a', merchantSessionId: 'other-session' })).rejects.toThrow('Merchant session not found')
    expect(txLedger.create).not.toHaveBeenCalled()
  })
})
