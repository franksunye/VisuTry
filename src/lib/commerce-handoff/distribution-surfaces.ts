/**
 * Shared Consumer↔Store distribution surface vocabulary.
 * Neutral contract — no Store orchestration.
 */

export const INTERNAL_DISTRIBUTION_SURFACES = [
  'home',
  'discover',
  'face-analysis',
  'face-shape',
  'try-on',
  'compare',
  'style-explorer',
  'seo',
  'dashboard',
  'other',
] as const

/** High-intent internal surfaces that can change the shopper's first action. */
export const CONTEXTUAL_DISTRIBUTION_SURFACES = [
  'face-analysis',
  'compare',
  'style-explorer',
] as const

export type ContextualDistributionSurface = (typeof CONTEXTUAL_DISTRIBUTION_SURFACES)[number]

export type InternalDistributionSurface = (typeof INTERNAL_DISTRIBUTION_SURFACES)[number]

export function normalizeInternalSurface(value: unknown): InternalDistributionSurface | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return (INTERNAL_DISTRIBUTION_SURFACES as readonly string[]).includes(normalized)
    ? normalized as InternalDistributionSurface
    : null
}
