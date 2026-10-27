import { simulateMerchantEconomics, type MerchantEconomicsScenario } from '@/modules/merchant/domain/merchant-economics-scenario'

function scenario(overrides: Partial<MerchantEconomicsScenario> = {}): MerchantEconomicsScenario {
  return {
    subscriptionRevenueUsd: 199,
    includedAiCommerceSessions: 1000,
    includedStandardRenders: 1000,
    successfulRenders: 1000,
    paidAttemptCostUsd: 0.02,
    paidAttemptsPerSuccess: 1,
    paymentFeeRate: 0.036,
    paymentFixedFeeUsd: 0.30,
    merchantServiceCostUsd: 15,
    channelShareRate: 0.25,
    otherVariableCostUsd: 0,
    ...overrides,
  }
}

describe('Merchant Commercial Model v2 — internal scenario calculation only', () => {
  it('keeps successful renders separate from AI Commerce Sessions, without inventing a usage distribution', () => {
    const result = simulateMerchantEconomics(scenario())
    expect(result.providerSpendUsd).toBe(20)
    expect(result.aiOnlyMarginPercent).toBe(89.95)
    expect(result.postChannelContributionUsd).toBe(106.79)
    expect(result.postChannelContributionPercent).toBe(53.66)
    expect(result.renderedShareOfAllowancePercent).toBe(100)
  })

  it('shows risk in a fully consumed 3,500-render legacy Founding Pilot under Kie', () => {
    const result = simulateMerchantEconomics(scenario({
      subscriptionRevenueUsd: 149,
      includedAiCommerceSessions: 1500,
      includedStandardRenders: 3500,
      successfulRenders: 3500,
      merchantServiceCostUsd: 30,
    }))
    expect(result.providerSpendUsd).toBe(70)
    expect(result.aiOnlyMarginPercent).toBe(53.02)
    expect(result.postChannelContributionUsd).toBe(6.09)
    expect(result.postChannelContributionPercent).toBe(4.08)
  })

  it('models billable failures without charging a merchant extra successful renders', () => {
    const result = simulateMerchantEconomics(scenario({ paidAttemptsPerSuccess: 1.2 }))
    expect(result.paidAttemptEquivalent).toBe(1200)
    expect(result.providerSpendUsd).toBe(24)
    expect(result.renderedShareOfAllowancePercent).toBe(100)
  })

  it('shows unbounded legacy recurring allowance as a risk rather than fabricating a limit', () => {
    const result = simulateMerchantEconomics(scenario({
      includedStandardRenders: null,
      successfulRenders: 10_000,
    }))
    expect(result.renderedShareOfAllowancePercent).toBeNull()
    expect(result.providerSpendUsd).toBe(200)
    expect(result.overAllowanceRenders).toBe(0)
  })

  it('models above-allowance stress separately from entitlement enforcement', () => {
    const result = simulateMerchantEconomics(scenario({ successfulRenders: 1200 }))
    expect(result.overAllowanceRenders).toBe(200)
    expect(result.renderedShareOfAllowancePercent).toBe(120)
  })

  it('distinguishes no channel, referral, and reseller without stacking rates', () => {
    const direct = simulateMerchantEconomics(scenario({ channelShareRate: 0 }))
    const referral = simulateMerchantEconomics(scenario({ channelShareRate: 0.15 }))
    const reseller = simulateMerchantEconomics(scenario({ channelShareRate: 0.25 }))
    expect(direct.postChannelContributionUsd).toBeGreaterThan(referral.postChannelContributionUsd)
    expect(referral.postChannelContributionUsd).toBeGreaterThan(reseller.postChannelContributionUsd)
  })

  it.each([
    { successfulRenders: -1 },
    { subscriptionRevenueUsd: Number.NaN },
    { paidAttemptCostUsd: Number.POSITIVE_INFINITY },
    { paidAttemptsPerSuccess: 0.9 },
    { paymentFeeRate: 1.01 },
    { includedStandardRenders: -5 },
    { includedAiCommerceSessions: 0.5 },
  ])('rejects invalid scenario inputs %j', (override) => {
    expect(() => simulateMerchantEconomics(scenario(override))).toThrow('Invalid merchant scenario')
  })

  it('uses null percentages when there is no revenue and no included renders', () => {
    const result = simulateMerchantEconomics(scenario({
      subscriptionRevenueUsd: 0,
      includedStandardRenders: 0,
      successfulRenders: 0,
      paymentFeeRate: 0,
      paymentFixedFeeUsd: 0,
      merchantServiceCostUsd: 0,
      channelShareRate: 0,
    }))
    expect(result.aiOnlyMarginPercent).toBeNull()
    expect(result.postChannelContributionPercent).toBeNull()
    expect(result.renderedShareOfAllowancePercent).toBeNull()
  })
})
