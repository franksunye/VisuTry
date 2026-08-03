/**
 * Shared acquisition attribution helpers for client analytics and
 * Stripe / Payment persistence. Keep values short: Stripe metadata
 * values are capped at 500 characters.
 */

export type AcquisitionAttribution = {
  landing_page?: string
  page_path?: string
  growth_source?: string
  medium?: string
  query_cluster?: string
  content_cluster?: string
  product_path?: string
  landing_locale?: string
}

const MAX_FIELD_LENGTH = 200
const MAX_SERIALIZED_LENGTH = 500

const ATTRIBUTION_KEYS: Array<keyof AcquisitionAttribution> = [
  'landing_page',
  'page_path',
  'growth_source',
  'medium',
  'query_cluster',
  'content_cluster',
  'product_path',
  'landing_locale',
]

function truncate(value: string, max = MAX_FIELD_LENGTH): string {
  return value.length > max ? value.slice(0, max) : value
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return truncate(trimmed)
}

/** Normalize unknown client/server payloads into a compact attribution object. */
export function sanitizeAcquisitionAttribution(
  input: unknown,
): AcquisitionAttribution | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined
  }

  const record = input as Record<string, unknown>
  const sanitized: AcquisitionAttribution = {}

  for (const key of ATTRIBUTION_KEYS) {
    const value = cleanString(record[key])
    if (value) {
      sanitized[key] = value
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

/** Serialize attribution for a single Stripe Checkout metadata field. */
export function serializeAttributionForStripe(
  attribution: AcquisitionAttribution | undefined,
): string | undefined {
  if (!attribution) return undefined

  const serialized = JSON.stringify(attribution)
  if (serialized.length <= MAX_SERIALIZED_LENGTH) {
    return serialized
  }

  // Prefer the acquisition entry point over the checkout page path.
  const compact: AcquisitionAttribution = {
    ...(attribution.landing_page
      ? { landing_page: truncate(attribution.landing_page, 120) }
      : {}),
    ...(attribution.growth_source
      ? { growth_source: truncate(attribution.growth_source, 80) }
      : {}),
    ...(attribution.medium ? { medium: truncate(attribution.medium, 40) } : {}),
    ...(attribution.query_cluster
      ? { query_cluster: truncate(attribution.query_cluster, 80) }
      : {}),
    ...(attribution.content_cluster
      ? { content_cluster: truncate(attribution.content_cluster, 80) }
      : {}),
    ...(attribution.product_path
      ? { product_path: truncate(attribution.product_path, 40) }
      : {}),
    ...(attribution.landing_locale
      ? { landing_locale: truncate(attribution.landing_locale, 16) }
      : {}),
  }

  const compactSerialized = JSON.stringify(compact)
  return compactSerialized.length <= MAX_SERIALIZED_LENGTH
    ? compactSerialized
    : compactSerialized.slice(0, MAX_SERIALIZED_LENGTH)
}

/** Parse attribution stored on Stripe Checkout Session metadata. */
export function parseAttributionFromStripeMetadata(
  metadata: Record<string, string> | null | undefined,
): AcquisitionAttribution | undefined {
  if (!metadata?.attribution) return undefined

  try {
    return sanitizeAcquisitionAttribution(JSON.parse(metadata.attribution))
  } catch {
    return undefined
  }
}
