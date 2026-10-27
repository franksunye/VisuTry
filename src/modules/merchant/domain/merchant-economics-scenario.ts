/**
 * Internal merchant pricing stress-test only.
 *
 * No live entitlement, billing, credits, provider routing, or public price
 * consumes this module. Monetary values and procurement assumptions are
 * supplied by the caller and must not be confused with reconciled invoices.
 */
export type MerchantEconomicsScenario = {
  subscriptionRevenueUsd: number
  includedAiCommerceSessions: number | null
  includedStandardRenders: number | null
  successfulRenders: number
  /** Actual/invoiced price per paid attempt; pass zero for no-charge failures. */
  paidAttemptCostUsd: number
  /** Paid attempts per usable success, >= 1; includes billable failures. */
  paidAttemptsPerSuccess: number
  paymentFeeRate: number
  paymentFixedFeeUsd: number
  merchantServiceCostUsd: number
  /** Revenue share OR reseller discount, not both stacked. */
  channelShareRate: number
  otherVariableCostUsd: number
}

export type MerchantEconomicsResult = {
  paidAttemptEquivalent: number
  providerSpendUsd: number
  paymentFeesUsd: number
  channelCostUsd: number
  otherCostsUsd: number
  aiOnlyMarginPercent: number | null
  postChannelContributionUsd: number
  postChannelContributionPercent: number | null
  renderedShareOfAllowancePercent: number | null
  overAllowanceRenders: number
}

function requireNonnegativeFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid merchant scenario ${name}: must be finite and nonnegative`)
  }
}

function requireRate(name: string, value: number): void {
  requireNonnegativeFinite(name, value)
  if (value > 1) throw new Error(`Invalid merchant scenario ${name}: must not exceed 1`)
}

function usd(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function percentage(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : Math.round((numerator / denominator) * 10_000) / 100
}

/**
 * Planning projection of a single merchant's realized/worst-case usage.
 * aiOnlyMarginPercent is NOT GAAP gross margin; it excludes all but provider.
 */
export function simulateMerchantEconomics(input: MerchantEconomicsScenario): MerchantEconomicsResult {
  const nonnegative = [
    'subscriptionRevenueUsd', 'successfulRenders', 'paidAttemptCostUsd',
    'paidAttemptsPerSuccess', 'paymentFixedFeeUsd', 'merchantServiceCostUsd',
    'otherVariableCostUsd',
  ] as const
  for (const field of nonnegative) requireNonnegativeFinite(field, input[field])
  if (input.paidAttemptsPerSuccess < 1) {
    throw new Error('Invalid merchant scenario paidAttemptsPerSuccess: must be at least 1')
  }
  for (const field of ['paymentFeeRate', 'channelShareRate'] as const) {
    requireRate(field, input[field])
  }
  for (const field of ['includedAiCommerceSessions', 'includedStandardRenders'] as const) {
    const allowance = input[field]
    if (allowance !== null) {
      requireNonnegativeFinite(field, allowance)
      if (!Number.isInteger(allowance)) throw new Error(`Invalid merchant scenario ${field}: must be integer`)
    }
  }
  if (!Number.isInteger(input.successfulRenders)) {
    throw new Error('Invalid merchant scenario successfulRenders: must be integer')
  }

  const paidAttemptEquivalent = input.successfulRenders * input.paidAttemptsPerSuccess
  const providerSpend = paidAttemptEquivalent * input.paidAttemptCostUsd
  const paymentFees = input.subscriptionRevenueUsd * input.paymentFeeRate + input.paymentFixedFeeUsd
  const channelCost = input.subscriptionRevenueUsd * input.channelShareRate
  const otherCosts = paymentFees + channelCost + input.merchantServiceCostUsd + input.otherVariableCostUsd
  const contribution = input.subscriptionRevenueUsd - providerSpend - otherCosts
  const limit = input.includedStandardRenders
  return {
    paidAttemptEquivalent,
    providerSpendUsd: usd(providerSpend),
    paymentFeesUsd: usd(paymentFees),
    channelCostUsd: usd(channelCost),
    otherCostsUsd: usd(otherCosts),
    aiOnlyMarginPercent: percentage(input.subscriptionRevenueUsd - providerSpend, input.subscriptionRevenueUsd),
    postChannelContributionUsd: usd(contribution),
    postChannelContributionPercent: percentage(contribution, input.subscriptionRevenueUsd),
    renderedShareOfAllowancePercent: limit === null || limit === 0 ? null : percentage(input.successfulRenders, limit),
    overAllowanceRenders: limit === null ? 0 : Math.max(0, input.successfulRenders - limit),
  }
}
