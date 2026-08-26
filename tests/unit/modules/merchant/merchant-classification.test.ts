import {
  filterMerchantPortfolioRows,
  isCommercialMerchant,
  classificationForPilotConfig,
  summarizeMerchantPortfolio,
} from '@/modules/merchant/domain/merchant-classification'

const row = (classification: string, sessions: number, intents: number) => ({
  classification,
  status: 'ACTIVE',
  _count: { experiences: 1, frames: 2, sessions, intents },
})

describe('canonical merchant classification and commercial portfolio metrics', () => {
  const merchants = [
    row('REAL', 10, 2),
    row('REFERENCE', 100, 5),
    row('TEST', 25, 1),
    row('AUTOMATION', 25, 2),
    row('POSSIBLE_EXTERNAL', 7, 1),
  ]

  it('admits only REAL merchants to commercial KPIs', () => {
    expect(isCommercialMerchant('REAL')).toBe(true)
    expect(isCommercialMerchant({ classification: 'POSSIBLE_EXTERNAL' })).toBe(false)
    expect(isCommercialMerchant({ classification: 'REFERENCE' })).toBe(false)
    expect(isCommercialMerchant({ classification: null })).toBe(false)
    expect(summarizeMerchantPortfolio(merchants)).toEqual({
      active: 1,
      experiences: 1,
      frames: 2,
      sessions: 10,
      intents: 2,
    })
  })

  it('keeps reference and test/automation activity out of Commercial while All remains complete', () => {
    expect(summarizeMerchantPortfolio(merchants, 'COMMERCIAL').sessions).toBe(10)
    expect(summarizeMerchantPortfolio(merchants, 'COMMERCIAL').intents).toBe(2)
    expect(summarizeMerchantPortfolio(merchants, 'ALL')).toEqual({
      active: 5,
      experiences: 5,
      frames: 10,
      sessions: 167,
      intents: 11,
    })
    expect(filterMerchantPortfolioRows(merchants, 'REFERENCE')).toHaveLength(1)
    expect(filterMerchantPortfolioRows(merchants, 'INTERNAL_TEST')).toHaveLength(2)
    expect(filterMerchantPortfolioRows(merchants, 'POSSIBLE_EXTERNAL')).toHaveLength(1)
  })

  it('does not turn classification into an authorization decision', () => {
    const tenantRow = { merchantId: 'merchant-a', classification: 'REAL' }
    expect(isCommercialMerchant(tenantRow)).toBe(true)
    expect(tenantRow.merchantId).toBe('merchant-a')
  })

  it('classifies delivery-kit seed modes explicitly', () => {
    expect(classificationForPilotConfig({ pilotType: 'REFERENCE', referenceData: true })).toBe('REFERENCE')
    expect(classificationForPilotConfig({ pilotType: 'DEMO', referenceData: false })).toBe('INTERNAL')
    expect(classificationForPilotConfig({ pilotType: 'LIVE', referenceData: false })).toBe('POSSIBLE_EXTERNAL')
  })
})
