import type { ExperienceStatus, ExperienceType } from './experience'

export const EXPERIENCE_SEARCH_VISIBILITIES = [
  'PUBLIC_INDEX',
  'PUBLIC_NOINDEX',
  'PRIVATE',
] as const

export type ExperienceSearchVisibility = (typeof EXPERIENCE_SEARCH_VISIBILITIES)[number]

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
    && input.frames.length > 0,
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
export function resolveExperienceSearchVisibility(
  input: ExperienceSearchVisibilityInput,
): ExperienceSearchVisibility {
  if (!input.merchant || !input.experience) return 'PRIVATE'
  if (input.merchant.status !== 'ACTIVE') return 'PRIVATE'
  if (input.experience.status === 'DRAFT') return 'PRIVATE'
  if (!hasReadableDiscoveryContent(input)) return 'PUBLIC_NOINDEX'

  if (
    input.experience.status === 'ENDED'
    || input.experience.status === 'ARCHIVED'
  ) {
    return 'PUBLIC_NOINDEX'
  }

  if (input.experience.status !== 'ACTIVE') return 'PRIVATE'
  if (isReferenceExperience(input)) return 'PUBLIC_NOINDEX'

  const hasMerchantDestination = hasHttpUrl(input.merchant.websiteUrl)
  const hasProductDestination = input.frames.some((frame) => hasHttpUrl(frame.productUrl))
  const hasMeaningfulCollection = input.frames.length >= MINIMUM_INDEXABLE_CATALOG_ITEMS

  if (
    !isIndexableMerchant(input)
    || !hasMeaningfulCollection
    || (!hasMerchantDestination && !hasProductDestination)
  ) {
    return 'PUBLIC_NOINDEX'
  }

  return 'PUBLIC_INDEX'
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
