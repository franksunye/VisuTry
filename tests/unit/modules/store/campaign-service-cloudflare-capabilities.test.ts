jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-commercial-entitlements-cloudflare', () => ({
  getMerchantCommercialCapabilityCloudflare: jest.fn(),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { getMerchantCommercialCapabilityCloudflare } from '@/modules/merchant/application/merchant-commercial-entitlements-cloudflare'
import { getCampaign } from '@/modules/store/application/campaign-service-cloudflare'

describe('Cloudflare single-Campaign entitlement read parity', () => {
  const merchant = {
    id: 'merchant-test', slug: 'merchant-test', referenceData: false,
    classification: 'MERCHANT', planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE',
    tryOnEnabled: true, compareEnabled: true,
  }
  const campaign = {
    id: 'campaign-test', merchantId: 'merchant-test', type: 'CAMPAIGN',
    slug: 'test-campaign', name: 'Test Campaign', status: 'DRAFT',
    campaignObjective: 'INTENT', campaignGate: 'NONE',
    presentationMode: 'EDITORIAL_FIRST',
    journeyPolicy: null, deliveryPolicy: null, referenceData: false,
  }

  it.each([
    { label: 'merchant explicitly disables Compare', merchantCompare: false, entitledCompare: true, expected: false },
    { label: 'merchant inherits entitlement but plan denies Compare', merchantCompare: null, entitledCompare: false, expected: false },
    { label: 'merchant explicitly enables Compare but plan denies it', merchantCompare: true, entitledCompare: false, expected: false },
    { label: 'merchant and entitlement both allow Compare', merchantCompare: true, entitledCompare: true, expected: true },
    { label: 'merchant inherits enabled Compare', merchantCompare: null, entitledCompare: true, expected: true },
  ])('returns the actual intersection: $label', async ({ merchantCompare, entitledCompare, expected }) => {
    const sql = jest.fn(async (template: TemplateStringsArray) => {
      const query = template.join('')
      if (query.includes('FROM "Merchant"')) return [{ ...merchant, compareEnabled: merchantCompare }]
      if (query.includes('FROM "Experience" e LEFT JOIN')) return [campaign]
      throw new Error(`Unexpected Cloudflare query: ${query.slice(0, 90)}`)
    })
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    ;(getMerchantCommercialCapabilityCloudflare as jest.Mock).mockResolvedValue({
      decisions: {
        GENERATIVE_TRY_ON: { allowed: true },
        COMPARE: { allowed: entitledCompare },
        KIOSK_DELIVERY: { allowed: false },
      },
    })

    const result = await getCampaign({ merchantId: merchant.id, campaignId: campaign.id })
    expect(result.journeyCapabilities.compareEnabled).toBe(expected)
    expect(result.effectiveJourneyPolicy.enabledStages.includes('COMPARE')).toBe(expected)
    expect(result.journeyCapabilities.tryOnEnabled).toBe(true)
    expect(getMerchantCommercialCapabilityCloudflare).toHaveBeenCalledWith({
      merchantId: merchant.id,
      includeResourceUsage: false,
    })
    expect(sql.mock.calls).toHaveLength(2)
  })
})
