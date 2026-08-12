import type { ExperienceType } from './experience'
import {
  CONTEXTUAL_DISTRIBUTION_SURFACES,
  type ContextualDistributionSurface,
} from './session-acquisition'

export const PRESENTATION_MODES = ['ACTION_FIRST', 'PRODUCT_FIRST', 'EDITORIAL_FIRST'] as const
export type PresentationMode = (typeof PRESENTATION_MODES)[number]

/**
 * Only known high-intent handoff surfaces may bypass the Store/Campaign
 * defaults. Unknown or generic distribution surfaces must not change the
 * presentation hierarchy.
 */
export const CONTEXTUAL_PRESENTATION_SURFACES = CONTEXTUAL_DISTRIBUTION_SURFACES
export type ContextualPresentationSurface = ContextualDistributionSurface

export type PresentationModeInput = {
  experienceType: ExperienceType
  acquisitionSurface?: string | null
  explicitPresentationMode?: PresentationMode | null
}

function isContextualPresentationSurface(value: string | null | undefined): value is ContextualPresentationSurface {
  return (CONTEXTUAL_PRESENTATION_SURFACES as readonly string[]).includes(value || '')
}

/**
 * Resolve presentation only. This has no effect on session acquisition,
 * attribution, or the shopper runtime state machine.
 */
export function resolvePresentationMode({
  experienceType,
  acquisitionSurface,
  explicitPresentationMode,
}: PresentationModeInput): PresentationMode {
  if (explicitPresentationMode) return explicitPresentationMode
  if (isContextualPresentationSurface(acquisitionSurface)) return 'ACTION_FIRST'
  return experienceType === 'CAMPAIGN' ? 'EDITORIAL_FIRST' : 'PRODUCT_FIRST'
}
