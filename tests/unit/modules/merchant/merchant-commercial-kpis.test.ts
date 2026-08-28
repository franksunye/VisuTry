import { computeMerchantCommercialKpis } from '@/modules/merchant/domain/merchant-commercial-kpis'

const now = new Date('2026-08-28T00:00:00.000Z')

describe('G4-C commercial KPI boundary', () => {
  it('includes only REAL merchants and keeps Pilot revenue out of MRR', () => {
    const result = computeMerchantCommercialKpis({
      now,
      pilotRevenueCents: 14900,
      merchants: [
        { classification: 'REAL', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', billingPeriodEnd: new Date('2026-09-01'), catalogItems: 12, shopperSessions: 20, intents: 3, aiCommerceSessions: 4, publishedStore: true, checkoutStarted: true },
        { classification: 'REAL', planCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE', billingPeriodEnd: new Date('2026-09-10'), catalogItems: 10, shopperSessions: 8, intents: 1, aiCommerceSessions: 2, publishedStore: true, checkoutStarted: true },
        { classification: 'TEST', planCode: 'GROWTH', commercialStatus: 'PAID_ACTIVE', billingPeriodEnd: new Date('2026-09-01'), catalogItems: 500, shopperSessions: 999, intents: 999, aiCommerceSessions: 999, publishedStore: true, checkoutStarted: true },
        { classification: 'POSSIBLE_EXTERNAL', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', billingPeriodEnd: new Date('2026-09-01'), catalogItems: 4, shopperSessions: 4, intents: 4, aiCommerceSessions: 4, publishedStore: true, checkoutStarted: true },
      ],
    })

    expect(result).toMatchObject({
      realMerchants: 2,
      paidRealMerchants: 2,
      activePilots: 1,
      activePaidSubscriptions: 1,
      mrrCents: 19900,
      pilotRevenueCents: 14900,
      commercialAICommerceSessions: 6,
      commercialShopperSessions: 28,
      commercialIntents: 4,
      publishedStores: 2,
    })
  })

  it('does not count expired, past-due, or payment-action-required plans as healthy paid state', () => {
    const result = computeMerchantCommercialKpis({
      now,
      merchants: [
        { classification: 'REAL', planCode: 'GROWTH', commercialStatus: 'PAST_DUE', billingPeriodEnd: new Date('2026-09-01') },
        { classification: 'REAL', planCode: 'SCALE', commercialStatus: 'EXPIRED', billingPeriodEnd: new Date('2026-08-27') },
        { classification: 'REAL', planCode: 'FOUNDING_PILOT', commercialStatus: 'PILOT_ACTIVE', billingPeriodEnd: new Date('2026-08-27') },
      ],
    })

    expect(result.paidRealMerchants).toBe(0)
    expect(result.activePaidSubscriptions).toBe(0)
    expect(result.activePilots).toBe(0)
    expect(result.mrrCents).toBe(0)
  })

  it('provides the first-merchant commercial funnel counts', () => {
    const result = computeMerchantCommercialKpis({
      now,
      merchants: [
        { classification: 'REAL', planCode: 'FREE', commercialStatus: 'FREE', catalogItems: 4, publishedStore: true, checkoutStarted: false, shopperSessions: 2, intents: 0, aiCommerceSessions: 0 },
        { classification: 'REAL', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', billingPeriodEnd: new Date('2026-09-01'), catalogItems: 12, publishedStore: false, checkoutStarted: true, shopperSessions: 0, intents: 0, aiCommerceSessions: 0 },
      ],
    })

    expect(result.funnel).toEqual({ merchantCreated: 2, catalogReady: 2, storePublished: 1, checkoutStarted: 1, billingActivated: 1, firstAICommerceSession: 0, firstIntent: 0 })
  })
})
