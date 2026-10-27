jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    merchantAiRenderReservation: { findUnique: jest.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { reserveMerchantAiPeriodRender } from '@/modules/merchant/application/merchant-ai-period-admission'

const start = new Date('2026-10-01T00:00:00Z')
const end = new Date('2026-11-01T00:00:00Z')
const now = new Date('2026-10-26T06:00:00Z')
const contract = {
  id: 'merchant-a',
  planCode: 'LAUNCH',
  commercialStatus: 'PAID_ACTIVE',
  entitlementVersion: 'v2',
  pricingVersion: 'v2-cohort-alpha',
  standardRenderAllowance: 2,
  entitlementEffectiveFrom: start,
  billingPeriodEnd: end,
}

const tx = {
  merchant: { findUnique: jest.fn() },
  merchantSession: { findFirst: jest.fn() },
  merchantAiRenderReservation: {
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  $executeRaw: jest.fn(),
}
type Row = {
  id: string
  merchantId: string
  merchantSessionId: string
  idempotencyKey: string
  status: 'RESERVED' | 'SETTLED' | 'RELEASED'
}
let rows: Row[] = []

function reserve(key: string, overrides: Partial<{ merchantId: string; merchantSessionId: string; now: Date }> = {}) {
  return reserveMerchantAiPeriodRender({
    merchantId: 'merchant-a',
    merchantSessionId: 'session-a',
    idempotencyKey: key,
    now,
    ...overrides,
  })
}

describe('Standard Merchant paid-period admission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    rows = []
    tx.merchant.findUnique.mockResolvedValue(contract)
    tx.merchantSession.findFirst.mockResolvedValue({ id: 'session-a' })
    tx.$executeRaw.mockResolvedValue(1)
    tx.merchantAiRenderReservation.findUnique.mockImplementation(async ({ where }: { where: { idempotencyKey: string } }) =>
      rows.find((row) => row.idempotencyKey === where.idempotencyKey) ?? null)
    tx.merchantAiRenderReservation.count.mockImplementation(async () =>
      rows.filter((row) => row.status === 'RESERVED' || row.status === 'SETTLED').length)
    tx.merchantAiRenderReservation.create.mockImplementation(async ({ data }: { data: { merchantId: string; merchantSessionId: string; idempotencyKey: string } }) => {
      const row: Row = {
        id: `reservation-${rows.length + 1}`,
        merchantId: data.merchantId,
        merchantSessionId: data.merchantSessionId,
        idempotencyKey: data.idempotencyKey,
        status: 'RESERVED',
      }
      rows.push(row)
      return { id: row.id }
    })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback(tx))
    ;(prisma.merchantAiRenderReservation.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { idempotencyKey: string } }) =>
      rows.find((row) => row.idempotencyKey === where.idempotencyKey) ?? null)
  })

  it('reserves both capacity slots and denies the third; holds count before successful usage', async () => {
    expect(await reserve('one')).toMatchObject({ decision: 'RESERVED', usedIncludingReservations: 1, limit: 2 })
    expect(await reserve('two')).toMatchObject({ decision: 'RESERVED', usedIncludingReservations: 2, limit: 2 })
    expect(await reserve('three')).toMatchObject({ decision: 'DENIED', reason: 'LIMIT_REACHED', usedIncludingReservations: 2 })
    expect(tx.merchantAiRenderReservation.create).toHaveBeenCalledTimes(2)
    expect(tx.$executeRaw).toHaveBeenCalledTimes(3)
  })

  it('replay of same logical request returns the original hold, not a second provider slot', async () => {
    const first = await reserve('same')
    const second = await reserve('same')
    expect(first).toMatchObject({ decision: 'RESERVED', reservationId: 'reservation-1' })
    expect(second).toMatchObject({ decision: 'EXISTING', reservationId: 'reservation-1', status: 'RESERVED' })
    expect(tx.merchantAiRenderReservation.create).toHaveBeenCalledTimes(1)
  })

  it('rejects absent paid plan, invalid allowance or inactive paid account', async () => {
    for (const merchantOverride of [
      { planCode: 'FREE' },
      { planCode: null },
      { standardRenderAllowance: null },
      { commercialStatus: 'PAST_DUE' },
    ]) {
      tx.merchant.findUnique.mockResolvedValueOnce({ ...contract, ...merchantOverride })
      expect(await reserve('blocked')).toMatchObject({ decision: 'DENIED', reason: 'NOT_ENROLLED' })
    }
    expect(tx.merchantAiRenderReservation.create).not.toHaveBeenCalled()
  })

  it('does not use v1/v2 metadata to gate an otherwise valid paid plan', async () => {
    tx.merchant.findUnique.mockResolvedValueOnce({
      ...contract, entitlementVersion: null, pricingVersion: null,
    })
    expect(await reserve('without-version-tags')).toMatchObject({
      decision: 'RESERVED', limit: 2,
    })
    tx.merchant.findUnique.mockResolvedValueOnce({ ...contract, entitlementVersion: 'v1', pricingVersion: 'v1' })
    expect(await reserve('with-old-version-tags')).toMatchObject({
      decision: 'RESERVED', limit: 2,
    })
  })

  it('rejects boundary and wrong tenant MerchantSession before any quota claim', async () => {
    expect(await reserve('expired', { now: end })).toMatchObject({ decision: 'DENIED', reason: 'PERIOD_INACTIVE' })
    tx.merchantSession.findFirst.mockResolvedValue(null)
    expect(await reserve('foreign')).toMatchObject({ decision: 'DENIED', reason: 'SESSION_NOT_FOUND' })
    expect(tx.merchantAiRenderReservation.create).not.toHaveBeenCalled()
  })

  it('fails closed on collision with a reused key belonging to another merchant', async () => {
    rows.push({ id: 'foreign', merchantId: 'other', merchantSessionId: 'other', idempotencyKey: 'collision', status: 'RESERVED' })
    await expect(reserve('collision')).rejects.toThrow('tenant mismatch')
    expect(tx.merchantAiRenderReservation.create).not.toHaveBeenCalled()
  })

  it('retries one serializable transaction conflict without a duplicate reservation', async () => {
    ;(prisma.$transaction as jest.Mock)
      .mockRejectedValueOnce(Object.assign(new Error('serialization'), { code: 'P2034' }))
      .mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => callback(tx))
    expect(await reserve('retry')).toMatchObject({ decision: 'RESERVED', reservationId: 'reservation-1' })
    expect(prisma.$transaction).toHaveBeenCalledTimes(2)
    expect(tx.merchantAiRenderReservation.create).toHaveBeenCalledTimes(1)
  })

  it('rejects empty or overlength request identities before touching Prisma', async () => {
    await expect(reserve('')).rejects.toThrow('Invalid Merchant AI reservation identity')
    await expect(reserve('x'.repeat(257))).rejects.toThrow('Invalid Merchant AI reservation identity')
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

// Real two-instance final-slot concurrency must also pass against disposable
// PostgreSQL before M1b integrates provider dispatch. Mocks are insufficient.
