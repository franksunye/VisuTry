export const MERCHANT_FRAME_ENRICHMENT_STATUSES = ['NOT_REQUIRED', 'PENDING', 'REVIEW_REQUIRED', 'APPROVED'] as const
export type MerchantFrameEnrichmentStatus = (typeof MERCHANT_FRAME_ENRICHMENT_STATUSES)[number]

export type MerchantFrameReadinessInput = {
  id?: string | null
  sku?: string | null
  externalId?: string | null
  name?: string | null
  imageUrl?: string | null
  productUrl?: string | null
  shape?: string | null
  source?: string | null
  status?: string | null
  enrichmentStatus?: string | null
}

export type MerchantFrameReadiness = {
  valid: boolean
  importReady: boolean
  recommendationReady: boolean
  enrichmentStatus: MerchantFrameEnrichmentStatus
  issues: string[]
  importIssues: string[]
  recommendationIssues: string[]
  warnings: string[]
}

function clean(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized || null
}

function validUrl(value: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return value.startsWith('/')
  }
}

function isEnrichmentStatus(value: string | null | undefined): value is MerchantFrameEnrichmentStatus {
  return Boolean(value && (MERCHANT_FRAME_ENRICHMENT_STATUSES as readonly string[]).includes(value))
}

export function resolveMerchantFrameEnrichmentStatus(input: {
  shape?: string | null
  enrichmentStatus?: string | null
}): MerchantFrameEnrichmentStatus {
  const shape = clean(input.shape)
  if (input.enrichmentStatus === 'NOT_REQUIRED') return 'NOT_REQUIRED'
  // Shape is a required recommendation attribute for ordinary frames. Never
  // allow an explicit APPROVED/REVIEW_REQUIRED value to hide an importable
  // frame that still needs enrichment.
  if (!shape) return 'PENDING'
  if (isEnrichmentStatus(input.enrichmentStatus)) return input.enrichmentStatus
  return 'APPROVED'
}

export function validateMerchantFrameReadiness(frame: MerchantFrameReadinessInput): MerchantFrameReadiness {
  const sku = clean(frame.sku)
  const externalId = clean(frame.externalId)
  const name = clean(frame.name)
  const imageUrl = clean(frame.imageUrl)
  const productUrl = clean(frame.productUrl)
  const importIssues: string[] = []

  if (!sku && !externalId && !productUrl) importIssues.push('MISSING_STABLE_IDENTITY')
  if (!name) importIssues.push('MISSING_NAME')
  if (!imageUrl || !validUrl(imageUrl)) importIssues.push('MISSING_IMAGE_URL')
  if (productUrl && !validUrl(productUrl)) importIssues.push('INVALID_PRODUCT_URL')
  if (frame.source === 'EXTERNAL' && !productUrl) importIssues.push('MISSING_PRODUCT_URL')

  const enrichmentStatus = resolveMerchantFrameEnrichmentStatus({ shape: frame.shape, enrichmentStatus: frame.enrichmentStatus })
  const recommendationIssues: string[] = []
  if (!clean(frame.shape) && enrichmentStatus !== 'NOT_REQUIRED') recommendationIssues.push('MISSING_SHAPE')
  if (enrichmentStatus === 'PENDING') recommendationIssues.push('ENRICHMENT_PENDING')
  if (enrichmentStatus === 'REVIEW_REQUIRED') recommendationIssues.push('ENRICHMENT_REVIEW_REQUIRED')

  const warnings = frame.status && frame.status !== 'ACTIVE' ? ['FRAME_NOT_ACTIVE'] : []
  const importReady = importIssues.length === 0
  const recommendationReady = importReady
    && frame.status === 'ACTIVE'
    && recommendationIssues.length === 0
    && (enrichmentStatus === 'APPROVED' || enrichmentStatus === 'NOT_REQUIRED')

  return {
    valid: recommendationReady,
    importReady,
    recommendationReady,
    enrichmentStatus,
    issues: [...importIssues, ...recommendationIssues],
    importIssues,
    recommendationIssues,
    warnings,
  }
}

export function isMerchantFrameRecommendationReady(frame: MerchantFrameReadinessInput): boolean {
  return validateMerchantFrameReadiness(frame).recommendationReady
}
