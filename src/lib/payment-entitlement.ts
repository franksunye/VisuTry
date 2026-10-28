/** Public checkout intent is only a display hint, never an authorization input. */
const PREMIUM_PLAN_IDS = new Set([
  'PREMIUM_MONTHLY',
  'PREMIUM_MONTHLY_PROMO',
  'PREMIUM_YEARLY',
  'PREMIUM_YEARLY_PROMO',
])

export interface ConsumerBalanceSnapshot {
  creditsPurchased: number
  creditsUsed: number
  premiumUsageCount: number
  freeTrialsUsed: number
  isPremiumActive: boolean
  currentSubscriptionType: string | null
}

export function expectedPremiumPlan(value: string | null): string | null {
  return value && PREMIUM_PLAN_IDS.has(value) ? value : null
}

export function isPremiumCheckoutReady(
  expectedPlan: string,
  balance: Pick<ConsumerBalanceSnapshot, 'isPremiumActive' | 'currentSubscriptionType'>,
): boolean {
  return balance.isPremiumActive && balance.currentSubscriptionType === expectedPlan
}
