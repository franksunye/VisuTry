jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: jest.fn() }))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { getMerchantCommercialCapabilityCloudflare } from '@/modules/merchant/application/merchant-commercial-entitlements-cloudflare'
import { listCampaigns } from '@/modules/store/application/campaign-service-cloudflare'

const merchant = {
  id: 'merchant-usage-ci',
  slug: 'merchant-usage-ci',
  referenceData: false,
  classification: 'TEST',
  pilotType: 'DEMO',
  commercialExceptionCode: 'VISUTRY_DEMO',
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  tryOnEnabled: true,
  compareEnabled: true,
}

type Query = { text: string; params: unknown[] }

function fakeSql(campaignCount = 0, merchantData: Record<string, unknown> = merchant) {
  const queries: Query[] = []
  const sql = jest.fn((parts: TemplateStringsArray, ...params: unknown[]) => {
    const text = parts.join('?')
    queries.push({ text, params })
    if (text.includes('FROM "MerchantUsageLedger"')) {
      return Promise.resolve([{ count: params.includes('AI_COMMERCE_SESSION') ? 70 : 12 }])
    }
    if (text.includes('FROM "Merchant"')) return Promise.resolve([merchantData])
    if (text.includes('SELECT "id" FROM "Experience"')) {
      return Promise.resolve(Array.from({ length: campaignCount }, (_, index) => ({ id: 'c-' + index })))
    }
    if (text.includes('FROM "Experience" e LEFT JOIN')) {
      const id = String(params[0])
      return Promise.resolve([{
        id, merchantId: merchant.id, type: 'CAMPAIGN', slug: id,
        name: 'Campaign ' + id, status: 'DRAFT', headline: 'Campaign headline',
        campaignObjective: 'TRAFFIC', campaignGate: 'NONE', presentationMode: 'PRODUCT_FIRST',
        referenceData: false, startAt: null, endAt: null,
        primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
        secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null,
        journeyPolicy: null, deliveryPolicy: null, merchantFrameId: null,
      }])
    }
    return Promise.resolve([{ count: 2 }])
  })
  ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
  return queries
}

describe('bounded Cloudflare Merchant usage reads', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns database aggregate counts, never materializes historical ledger rows', async () => {
    const queries = fakeSql()
    const result = await getMerchantCommercialCapabilityCloudflare({ merchantId: merchant.id })
    expect(result.state.usage).toMatchObject({
      aiCommerceSessions: 70,
      standardTryOnGenerations: 12,
      activeCampaigns: 2,
      catalogItems: 2,
    })
    const ledger = queries.filter((query) => query.text.includes('FROM "MerchantUsageLedger"'))
    expect(ledger).toHaveLength(2)
    for (const query of ledger) {
      expect(query.text).toContain('count(*)')
      expect(query.text).not.toContain('ORDER BY')
      expect(query.text).not.toMatch(/SELECT\s+"createdAt"/)
      expect(query.params[0]).toBe(merchant.id)
    }
  })


  it('uses the canonical commercial period bounds in SQL and skips resource counts when requested', async () => {
    const start = new Date('2026-10-01T00:00:00.000Z')
    const end = new Date('2026-11-01T00:00:00.000Z')
    const queries = fakeSql(0, {
      ...merchant,
      classification: 'MERCHANT',
      pilotType: null,
      commercialExceptionCode: null,
      planCode: 'LAUNCH',
      commercialStatus: 'PAID_ACTIVE',
      entitlementEffectiveFrom: start,
      billingPeriodEnd: end,
    })
    await getMerchantCommercialCapabilityCloudflare({
      merchantId: merchant.id,
      includeResourceUsage: false,
      now: new Date('2026-10-09T20:00:00.000Z'),
    })
    const ledger = queries.filter((query) => query.text.includes('FROM "MerchantUsageLedger"'))
    expect(ledger).toHaveLength(2)
    for (const query of ledger) {
      expect(query.text).toContain('count(*)')
      expect(query.text).toContain('"createdAt" >=')
      expect(query.text).toContain('"createdAt" <')
      expect(query.params).toContainEqual(start)
      expect(query.params).toContainEqual(end)
    }
    expect(queries.some((query) => query.text.includes('FROM "MerchantFrame"'))).toBe(false)
  })

  it('reuses one entitlement read for a 4-item Campaign listing', async () => {
    const queries = fakeSql(4)
    const results = await listCampaigns({ merchantId: merchant.id, limit: 10 })
    expect(results.items).toHaveLength(4)
    const ledger = queries.filter((query) => query.text.includes('FROM "MerchantUsageLedger"'))
    expect(ledger).toHaveLength(2)
    expect(queries.filter((query) => query.text.includes('FROM "Merchant"'))).toHaveLength(2)
  })
})
