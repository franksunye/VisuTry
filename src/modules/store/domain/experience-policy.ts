export const STORE_EXPERIENCE_DEFAULTS = {
  tryOnEnabled: true,
  compareEnabled: true,
  maxCompareFrames: 2,
  inquiryEnabled: false,
} as const

export type MaxCompareFrames = 2 | 3 | 4

export type StoreExperiencePolicy = {
  tryOnEnabled: boolean
  compareEnabled: boolean
  maxCompareFrames: MaxCompareFrames
  inquiryEnabled: boolean
}

export function isMaxCompareFrames(value: unknown): value is MaxCompareFrames {
  return value === 2 || value === 3 || value === 4
}

export function assertMaxCompareFrames(value: unknown): asserts value is MaxCompareFrames {
  if (!isMaxCompareFrames(value)) {
    throw new Error('maxCompareFrames must be 2, 3, or 4')
  }
}

export function resolveStoreExperiencePolicy(input: {
  tryOnEnabled?: boolean | null
  compareEnabled?: boolean | null
  maxCompareFrames?: number | null
  inquiryEnabled?: boolean | null
}): StoreExperiencePolicy {
  const maxCompareFrames = input.maxCompareFrames ?? STORE_EXPERIENCE_DEFAULTS.maxCompareFrames
  assertMaxCompareFrames(maxCompareFrames)
  return {
    tryOnEnabled: input.tryOnEnabled ?? STORE_EXPERIENCE_DEFAULTS.tryOnEnabled,
    compareEnabled: input.compareEnabled ?? STORE_EXPERIENCE_DEFAULTS.compareEnabled,
    maxCompareFrames,
    inquiryEnabled: input.inquiryEnabled ?? STORE_EXPERIENCE_DEFAULTS.inquiryEnabled,
  }
}

export type StoreFrameSelectionContext = {
  /** Sponsored guest generation ceiling. Null means no sponsored cap (commercial/compare policy applies). */
  guestSponsoredTryOnLimit?: number | null
  /** Signed-in / continuation shoppers may use the full compare shortlist. */
  guestCompareUnlocked?: boolean
}

/** Selection is shared by the Try-On shortlist; disabled compare never exposes a multi-frame path. */
export function maxSelectableStoreFrames(
  policy: StoreExperiencePolicy,
  context: StoreFrameSelectionContext = {},
): number {
  const policyMax = policy.compareEnabled ? policy.maxCompareFrames : 1
  if (context.guestCompareUnlocked) return policyMax
  const guestLimit = context.guestSponsoredTryOnLimit
  if (typeof guestLimit === 'number' && guestLimit > 0) {
    return Math.min(policyMax, guestLimit)
  }
  return policyMax
}

export function experiencePolicyMetadata(
  policy: StoreExperiencePolicy,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    maxCompareFrames: policy.maxCompareFrames,
    tryOnEnabled: policy.tryOnEnabled,
    compareEnabled: policy.compareEnabled,
    inquiryEnabled: policy.inquiryEnabled,
    ...extra,
  }
}
