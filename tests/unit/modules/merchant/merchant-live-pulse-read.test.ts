/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantSession: { count: jest.fn(), findMany: jest.fn() },
    merchantEvent: { count: jest.fn(), findMany: jest.fn() },
    merchantIntent: { count: jest.fn(), findMany: jest.fn() },
  },
}))
jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: jest.fn() }))

import { prisma } from '@/lib/prisma'
import { getCloudflareSql } from '@/data/neon-cloudflare'
import { getMerchantLivePulse } from '@/modules/merchant/application/merchant-live-pulse'
import { getMerchantLivePulse as getCloudflareMerchantLivePulse } from '@/modules/merchant/application/merchant-live-pulse-cloudflare'

const db = prisma as unknown as {
  merchantSession: { count: jest.Mock; findMany: jest.Mock }
  merchantEvent: { count: jest.Mock; findMany: jest.Mock }
  merchantIntent: { count: jest.Mock; findMany: jest.Mock }
}

describe('getMerchantLivePulse narrow tenant read', () => {
  const now = new Date('2026-09-23T12:00:00.000Z')

  beforeEach(() => {
    jest.clearAllMocks()
    db.merchantSession.findMany.mockResolvedValue([{ id: 'session-heartbeat' }])
    db.merchantSession.count.mockResolvedValue(12)
    db.merchantEvent.count.mockResolvedValue(5)
    db.merchantIntent.count.mockResolvedValue(3)
    db.merchantEvent.findMany.mockImplementation((input: { select?: Record<string, unknown> }) =>
      'merchantSessionId' in (input.select ?? {})
        ? Promise.resolve([{ merchantSessionId: 'session-event' }])
        : Promise.resolve([{
            id: 'event-a',
            type: 'merchant_tryon_completed',
            createdAt: new Date('2026-09-23T11:59:00.000Z'),
            experience: { id: 'experience-a', type: 'STORE', name: 'Main Store' },
            frame: { id: 'frame-a', name: 'Round Classic' },
          }]),
    )
    db.merchantIntent.findMany.mockImplementation((input: { select?: Record<string, unknown> }) =>
      'merchantSessionId' in (input.select ?? {})
        ? Promise.resolve([{ merchantSessionId: 'session-event' }])
        : Promise.resolve([{
            id: 'intent-a',
            type: 'PRODUCT_CLICK',
            createdAt: new Date('2026-09-23T11:58:00.000Z'),
            experience: null,
            frame: null,
          }]),
    )
  })

  it('uses merchant-scoped active, visitor, event, intent, and bounded-feed reads', async () => {
    const pulse = await getMerchantLivePulse({ merchantId: 'merchant-a', now })

    expect(pulse).toMatchObject({
      generatedAt: now.toISOString(),
      activeShoppers: 2,
      recentWindow: { visitors: 12, tryOnCompletions: 5, productClicks: 3 },
    })
    expect(db.merchantSession.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        merchantId: 'merchant-a', status: 'ACTIVE', referenceData: false,
        lastActiveAt: { gte: new Date('2026-09-23T11:55:00.000Z'), lt: now },
        expiresAt: { gt: now },
        merchant: { is: { referenceData: false } },
      }),
      select: { id: true },
    })
    expect(db.merchantSession.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        merchantId: 'merchant-a',
        createdAt: { gte: new Date('2026-09-23T11:45:00.000Z'), lt: now },
      }),
    })
    expect(db.merchantEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        createdAt: { gte: new Date('2026-09-23T11:55:00.000Z'), lt: now },
        type: { in: expect.arrayContaining(['merchant_tryon_completed', 'merchant_compare_started']) },
      }),
      distinct: ['merchantSessionId'],
      select: { merchantSessionId: true },
    }))
    expect(db.merchantIntent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        createdAt: { gte: new Date('2026-09-23T11:55:00.000Z'), lt: now },
        type: { in: ['FAVORITE', 'PRODUCT_CLICK', 'INQUIRY'] },
      }),
      distinct: ['merchantSessionId'],
      select: { merchantSessionId: true },
    }))
    expect(db.merchantEvent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ merchantId: 'merchant-a', type: 'merchant_tryon_completed', referenceData: false }),
    })
    expect(db.merchantIntent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ merchantId: 'merchant-a', type: 'PRODUCT_CLICK', session: { is: { referenceData: false } } }),
    })
    for (const read of [db.merchantEvent.findMany, db.merchantIntent.findMany]) {
      const feedCall = read.mock.calls.find((call) => call[0].take === 10)?.[0]
      expect(feedCall.where.merchantId).toBe('merchant-a')
      expect(feedCall.take).toBe(10)
      const select = feedCall.select
      expect(select).not.toHaveProperty('merchantSessionId')
      expect(select).not.toHaveProperty('email')
      expect(select).not.toHaveProperty('metadata')
    }
    expect(JSON.stringify(pulse)).not.toMatch(/merchantSessionId|anonymousVisitorId|email|capabilityToken|metadata|photoAssetId/i)
  })

  it('counts an active session with fresh Try-On or Compare activity even when its heartbeat is old', async () => {
    db.merchantSession.findMany.mockResolvedValue([{ id: 'session-with-recent-heartbeat' }])
    db.merchantEvent.findMany.mockImplementation((input: { select?: Record<string, unknown> }) =>
      'merchantSessionId' in (input.select ?? {})
        ? Promise.resolve([{ merchantSessionId: 'session-with-fresh-tryon' }, { merchantSessionId: 'session-with-fresh-compare' }])
        : Promise.resolve([]),
    )
    db.merchantIntent.findMany.mockImplementation((input: { select?: Record<string, unknown> }) =>
      'merchantSessionId' in (input.select ?? {})
        ? Promise.resolve([])
        : Promise.resolve([]),
    )

    const pulse = await getMerchantLivePulse({ merchantId: 'merchant-a', now })

    expect(pulse.activeShoppers).toBe(3)
    expect(db.merchantEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        createdAt: { gte: new Date('2026-09-23T11:55:00.000Z'), lt: now },
        session: { is: expect.objectContaining({ status: 'ACTIVE', expiresAt: { gt: now } }) },
      }),
    }))
  })

  it('keeps Cloudflare counts and safe activity presentation in parity with Prisma', async () => {
    const prismaPulse = await getMerchantLivePulse({ merchantId: 'merchant-a', now })
    const cloudflareEvent = {
      id: 'event-a', type: 'merchant_tryon_completed', createdAt: new Date('2026-09-23T11:59:00.000Z'),
      experienceId: 'experience-a', experienceType: 'STORE', experienceName: 'Main Store',
      frameId: 'frame-a', frameName: 'Round Classic',
    }
    const cloudflareIntent = {
      id: 'intent-a', type: 'PRODUCT_CLICK', createdAt: new Date('2026-09-23T11:58:00.000Z'),
      experienceId: null, experienceType: null, experienceName: null,
      frameId: null, frameName: null,
    }
    const sql = jest.fn((strings: TemplateStringsArray) => {
      const query = strings.join(' ')
      if (query.includes('FROM "MerchantSession"') && query.includes('"status" =')) return Promise.resolve([{ count: 2 }])
      if (query.includes('FROM "MerchantSession"')) return Promise.resolve([{ count: 12 }])
      if (query.includes('count(*)') && query.includes("'merchant_tryon_completed'")) return Promise.resolve([{ count: 5 }])
      if (query.includes('count(*)') && query.includes("'PRODUCT_CLICK'")) return Promise.resolve([{ count: 3 }])
      if (query.includes('FROM "MerchantEvent"')) return Promise.resolve([cloudflareEvent])
      return Promise.resolve([cloudflareIntent])
    })
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const cloudflarePulse = await getCloudflareMerchantLivePulse({ merchantId: 'merchant-a', now })
    expect(cloudflarePulse).toEqual(prismaPulse)
    expect(sql).toHaveBeenCalledTimes(6)
    for (const [strings, ...values] of sql.mock.calls) {
      expect(strings.join(' ')).toMatch(/^\s*SELECT/i)
      expect(values).toContain('merchant-a')
    }
    expect(sql.mock.calls.some(([strings]) => strings.join(' ').includes('"referenceData" = false'))).toBe(true)
  })
})
