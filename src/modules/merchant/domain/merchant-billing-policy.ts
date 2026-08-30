import type { MerchantClassification } from './merchant-classification'

export const MERCHANT_BILLING_ENVIRONMENTS = ['local', 'preview', 'production'] as const
export type MerchantBillingEnvironment = (typeof MERCHANT_BILLING_ENVIRONMENTS)[number]
export type MerchantBillingMode = 'test' | 'live'

export type MerchantBillingPolicy = {
  environment: MerchantBillingEnvironment
  stripeMode: MerchantBillingMode | null
  liveBillingAllowed: boolean
  testBillingAllowed: boolean
  billingWritesAllowed: boolean
  disabledReason: 'POLICY_DISABLED' | 'STRIPE_MODE_UNAVAILABLE' | null
}

/**
 * Billing policy is deliberately separate from Merchant authorization and
 * classification. TEST/INTERNAL workspaces may use Stripe TEST in Preview or
 * Local for QA, but they must never create Live billing objects by default.
 */
export function resolveMerchantBillingPolicy(input: {
  classification?: MerchantClassification | string | null
  environment: MerchantBillingEnvironment
  stripeMode: MerchantBillingMode | null
  explicitOverride?: {
    allowLiveBilling?: boolean
    allowTestBilling?: boolean
  }
}): MerchantBillingPolicy {
  const isTestOrInternal = input.classification === 'TEST' || input.classification === 'INTERNAL'
  const defaultLiveBillingAllowed = input.environment === 'production'
    && input.stripeMode === 'live'
    && !isTestOrInternal
  const defaultTestBillingAllowed = input.environment !== 'production'
    && input.stripeMode === 'test'

  const liveBillingAllowed = input.explicitOverride?.allowLiveBilling ?? defaultLiveBillingAllowed
  const testBillingAllowed = input.explicitOverride?.allowTestBilling ?? defaultTestBillingAllowed
  const billingWritesAllowed = input.stripeMode === 'live'
    ? liveBillingAllowed
    : input.stripeMode === 'test'
      ? testBillingAllowed
      : false

  return {
    environment: input.environment,
    stripeMode: input.stripeMode,
    liveBillingAllowed,
    testBillingAllowed,
    billingWritesAllowed,
    disabledReason: billingWritesAllowed
      ? null
      : input.stripeMode === null ? 'STRIPE_MODE_UNAVAILABLE' : 'POLICY_DISABLED',
  }
}
