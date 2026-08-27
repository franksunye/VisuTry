import {
  validateMerchantFrameReadiness,
  type MerchantFrameReadinessInput,
} from './merchant-frame-readiness'

export type MerchantFrameStoreReadiness = {
  storeEligible: boolean
  issues: string[]
}

/**
 * Store/display eligibility is deliberately less strict than recommendation
 * readiness. A product can be shown in a public Store while shape enrichment
 * is still pending, but unsafe identity, image, URL, or inactive frames stay
 * out of the public surface.
 */
export function validateMerchantFrameStoreReadiness(
  frame: MerchantFrameReadinessInput,
): MerchantFrameStoreReadiness {
  const catalogReadiness = validateMerchantFrameReadiness(frame)
  const issues = [...catalogReadiness.importIssues]
  if (frame.status !== 'ACTIVE') issues.push('FRAME_NOT_ACTIVE')

  return {
    storeEligible: issues.length === 0,
    issues,
  }
}

export function isMerchantFrameStoreEligible(
  frame: MerchantFrameReadinessInput,
): boolean {
  return validateMerchantFrameStoreReadiness(frame).storeEligible
}
