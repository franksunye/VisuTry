import type { ExperienceStatus, ExperienceType } from './experience'

export const EXPERIENCE_SEARCH_VISIBILITIES = [
  'PUBLIC_INDEX',
  'PUBLIC_NOINDEX',
  'PRIVATE',
] as const

export type ExperienceSearchVisibility = (typeof EXPERIENCE_SEARCH_VISIBILITIES)[number]

export type ExperienceSearchVisibilityReason =
  | 'MISSING_MERCHANT'
  | 'MISSING_EXPERIENCE'
  | 'MERCHANT_INACTIVE'
  | 'DRAFT'
  | 'NO_READABLE_CONTENT'
  | 'EXPERIENCE_ENDED'
  | 'EXPERIENCE_ARCHIVED'
  | 'EXPERIENCE_INACTIVE'
  | 'REFERENCE'
  | 'MERCHANT_NOT_INDEXABLE'
  | 'INSUFFICIENT_FRAMES'
  | 'MISSING_DESTINATION'

/** Saved-page eligibility, not a claim that a search engine has indexed it. */
export type ExperienceSearchReadiness = {
  visibility: ExperienceSearchVisibility
  reasons: ExperienceSearchVisibilityReason[]
  indexableLocale: 'en'
  activeFrameCount: number
  minimumFrameCount: number
}

export type SearchVisibilityMerchant = {
  name: string
  status: string
  websiteUrl?: string | null
  pilotType?: string | null
  referenceData?: boolean
  sponsoredUsagePolicyKey?: string | null
}

export type SearchVisibilityExperience = {
  type: ExperienceType
  name: string
  status: ExperienceStatus
  headline?: string | null
  description?: string | null
  referenceData?: boolean
}

export type SearchVisibilityFrame = {
  productUrl?: string | null
}

export type ExperienceSearchVisibilityInput = {
  merchant: SearchVisibilityMerchant | null
  experience: SearchVisibilityExperience | null
  frames: SearchVisibilityFrame[]
  /** Optional aggregate form used by bounded route admission. */
  frameCount?: number
  hasProductDestination?: boolean
}

export const MINIMUM_INDEXABLE_CATALOG_ITEMS = 4
export const VISUTRY_OWNED_SEARCH_POLICY_KEY = 'VISUTRY_OWNED'

function hasHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function hasMeaningfulTitle(experience: SearchVisibilityExperience): boolean {
  return Boolean((experience.headline || experience.name).trim())
}

function hasReadableDiscoveryContent(input: ExperienceSearchVisibilityInput): boolean {
  return Boolean(
    input.merchant
    && input.merchant.name.trim()
    && input.experience
    && hasMeaningfulTitle(input.experience)
    && (input.frameCount ?? input.frames.length) > 0,
  )
}

function isReferenceExperience(input: ExperienceSearchVisibilityInput): boolean {
  return Boolean(
    input.merchant?.referenceData
    || input.experience?.referenceData
    || input.merchant?.pilotType?.toUpperCase() === 'REFERENCE',
  )
}

function isIndexableMerchant(input: ExperienceSearchVisibilityInput): boolean {
  const pilotType = input.merchant?.pilotType?.toUpperCase()
  return Boolean(
    pilotType === 'LIVE'
    || input.merchant?.sponsoredUsagePolicyKey === VISUTRY_OWNED_SEARCH_POLICY_KEY,
  )
}

/**
 * Server-authoritative policy for public Store/Campaign discovery URLs.
 * Reference provenance is deliberately handled before indexability so a
 * reference catalog cannot become indexable merely by having enough frames.
 */
export function resolveExperienceSearchReadiness(
  input: ExperienceSearchVisibilityInput,
): ExperienceSearchReadiness {
  const activeFrameCount = input.frameCount ?? input.frames.length
  const result = (
    visibility: ExperienceSearchVisibility,
    reasons: ExperienceSearchVisibilityReason[] = [],
  ): ExperienceSearchReadiness => ({
    visibility,
    reasons,
    indexableLocale: 'en',
    activeFrameCount,
    minimumFrameCount: MINIMUM_INDEXABLE_CATALOG_ITEMS,
  })

  if (!input.merchant || !input.experience) {
    const reasons: ExperienceSearchVisibilityReason[] = []
    if (!input.merchant) reasons.push('MISSING_MERCHANT')
    if (!input.experience) reasons.push('MISSING_EXPERIENCE')
    return result('PRIVATE', reasons)
  }
  if (input.merchant.status !== 'ACTIVE') return result('PRIVATE', ['MERCHANT_INACTIVE'])
  if (input.experience.status === 'DRAFT') return result('PRIVATE', ['DRAFT'])
  if (!hasReadableDiscoveryContent(input)) return result('PUBLIC_NOINDEX', ['NO_READABLE_CONTENT'])

  if (input.experience.status === 'ENDED') {
    return result('PUBLIC_NOINDEX', ['EXPERIENCE_ENDED'])
  }
  if (input.experience.status === 'ARCHIVED') {
    return result('PUBLIC_NOINDEX', ['EXPERIENCE_ARCHIVED'])
  }

  if (input.experience.status !== 'ACTIVE') return result('PRIVATE', ['EXPERIENCE_INACTIVE'])
  if (isReferenceExperience(input)) return result('PUBLIC_NOINDEX', ['REFERENCE'])

  const hasMerchantDestination = hasHttpUrl(input.merchant.websiteUrl)
  const hasProductDestination = input.hasProductDestination
    ?? input.frames.some((frame) => hasHttpUrl(frame.productUrl))
  const reasons: ExperienceSearchVisibilityReason[] = []
  if (!isIndexableMerchant(input)) reasons.push('MERCHANT_NOT_INDEXABLE')
  if (!(activeFrameCount >= MINIMUM_INDEXABLE_CATALOG_ITEMS)) reasons.push('INSUFFICIENT_FRAMES')
  if (!hasMerchantDestination && !hasProductDestination) reasons.push('MISSING_DESTINATION')

  return result(reasons.length > 0 ? 'PUBLIC_NOINDEX' : 'PUBLIC_INDEX', reasons)
}

export function resolveExperienceSearchVisibility(
  input: ExperienceSearchVisibilityInput,
): ExperienceSearchVisibility {
  return resolveExperienceSearchReadiness(input).visibility
}

export function visibilityToRobots(visibility: ExperienceSearchVisibility): {
  index: boolean
  follow: boolean
} {
  switch (visibility) {
    case 'PUBLIC_INDEX':
      return { index: true, follow: true }
    case 'PUBLIC_NOINDEX':
      return { index: false, follow: true }
    case 'PRIVATE':
      return { index: false, follow: false }
  }
}
