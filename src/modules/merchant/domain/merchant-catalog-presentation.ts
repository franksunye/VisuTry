import { validateMerchantFrameReadiness, type MerchantFrameReadiness, type MerchantFrameReadinessInput } from './merchant-frame-readiness'

export const MERCHANT_CATALOG_PRESENTATION_STATES = ['READY', 'NEEDS_REVIEW', 'NEEDS_ATTENTION'] as const
export type MerchantCatalogPresentationState = (typeof MERCHANT_CATALOG_PRESENTATION_STATES)[number]

export type MerchantCatalogPresentation = {
  state: MerchantCatalogPresentationState
  label: 'Ready' | 'Needs enrichment' | 'Needs attention'
  issueCodes: string[]
  issueSummary: string | null
  readiness: MerchantFrameReadiness
}

const issueLabels: Record<string, string> = {
  MISSING_STABLE_IDENTITY: 'Add a product URL, SKU, or external identity',
  MISSING_NAME: 'Add a product name',
  MISSING_IMAGE_URL: 'Add a usable product image',
  INVALID_PRODUCT_URL: 'Check the product URL',
  MISSING_PRODUCT_URL: 'Add the product URL',
  MISSING_SHAPE: 'Frame shape still needs review',
  ENRICHMENT_PENDING: 'Product details are still being prepared',
  ENRICHMENT_REVIEW_REQUIRED: 'Product details need review',
  FRAME_NOT_ACTIVE: 'Product is not active',
}

export function merchantCatalogIssueLabel(code: string): string {
  return issueLabels[code] ?? code.replace(/_/g, ' ').toLowerCase()
}

export function resolveMerchantCatalogPresentation(frame: MerchantFrameReadinessInput): MerchantCatalogPresentation {
  const readiness = validateMerchantFrameReadiness(frame)
  const issueCodes = [...readiness.importIssues, ...readiness.recommendationIssues, ...readiness.warnings]
  const state: MerchantCatalogPresentationState = !readiness.importReady || readiness.warnings.length > 0
    ? 'NEEDS_ATTENTION'
    : readiness.recommendationReady
      ? 'READY'
      : 'NEEDS_REVIEW'
  const label = state === 'READY' ? 'Ready' : state === 'NEEDS_REVIEW' ? 'Needs enrichment' : 'Needs attention'
  const issueSummary = issueCodes.length > 0 ? merchantCatalogIssueLabel(issueCodes[0]) : null
  return { state, label, issueCodes, issueSummary, readiness }
}

