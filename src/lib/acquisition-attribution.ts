/**
 * Shared acquisition attribution helpers for client analytics and
 * Stripe / Payment persistence. Keep values short: Stripe metadata
 * values are capped at 500 characters.
 */

export type AcquisitionAttribution = {
  landing_page?: string
  page_path?: string
  acquisition_source?: string
  acquisition_medium?: string
  source_page?: string
  query_cluster?: string
  content_cluster?: string
  product_path?: string
  landing_locale?: string
  pricing_locale?: string
  checkout_locale?: string
  site_locale?: string
  browser_language?: string
  browser_languages?: string[]
  locale_changed?: boolean
  /** Billing geo supplied by Stripe Checkout, never by client analytics. */
  geo_country?: string
  geo_region?: string
}

const MAX_FIELD_LENGTH = 200
const MAX_SERIALIZED_LENGTH = 500

type StringAttributionKey =
  | 'landing_page'
  | 'page_path'
  | 'acquisition_source'
  | 'acquisition_medium'
  | 'source_page'
  | 'query_cluster'
  | 'content_cluster'
  | 'product_path'
  | 'landing_locale'
  | 'pricing_locale'
  | 'checkout_locale'
  | 'site_locale'
  | 'browser_language'
  | 'geo_country'
  | 'geo_region'

const ATTRIBUTION_KEYS: StringAttributionKey[] = [
  'landing_page',
  'page_path',
  'acquisition_source',
  'acquisition_medium',
  'source_page',
  'query_cluster',
  'content_cluster',
  'product_path',
  'landing_locale',
  'pricing_locale',
  'checkout_locale',
  'site_locale',
  'browser_language',
  'geo_country',
  'geo_region',
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

  const browserLanguages = record.browser_languages
  if (Array.isArray(browserLanguages)) {
    const cleanedLanguages = browserLanguages
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().slice(0, 32))
      .filter(Boolean)
      .slice(0, 8)
    if (cleanedLanguages.length > 0) {
      sanitized.browser_languages = cleanedLanguages
    }
  }

  if (typeof record.locale_changed === 'boolean') {
    sanitized.locale_changed = record.locale_changed
  }

  // Backward compatibility for payloads created before the attribution split.
  // Never map an internal `/path` source into acquisition_source.
  if (!sanitized.acquisition_source) {
    const legacySource = cleanString(record.growth_source)
    if (legacySource && !legacySource.startsWith('/')) {
      sanitized.acquisition_source = legacySource
    }
  }
  if (!sanitized.acquisition_medium) {
    const legacyMedium = cleanString(record.medium)
    if (legacyMedium) sanitized.acquisition_medium = legacyMedium
  }
  if (!sanitized.source_page) {
    const legacySource = cleanString(record.growth_source)
    if (legacySource?.startsWith('/')) sanitized.source_page = legacySource
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

function serializeIfFits(attribution: AcquisitionAttribution): string | undefined {
  const serialized = JSON.stringify(attribution)
  return serialized.length <= MAX_SERIALIZED_LENGTH ? serialized : undefined
}

/**
 * Serialize attribution for a single Stripe Checkout metadata field.
 * Always returns valid JSON; it never slices the serialized JSON string.
 */
export function serializeAttributionForStripe(
  attribution: AcquisitionAttribution | undefined,
): string | undefined {
  const sanitized = sanitizeAcquisitionAttribution(attribution)
  if (!sanitized) return undefined

  const direct = serializeIfFits(sanitized)
  if (direct) return direct

  const compact: AcquisitionAttribution = {
    ...(sanitized.landing_page
      ? { landing_page: truncate(sanitized.landing_page, 120) }
      : {}),
    ...(sanitized.page_path ? { page_path: truncate(sanitized.page_path, 100) } : {}),
    ...(sanitized.acquisition_source
      ? { acquisition_source: truncate(sanitized.acquisition_source, 80) }
      : {}),
    ...(sanitized.acquisition_medium
      ? { acquisition_medium: truncate(sanitized.acquisition_medium, 40) }
      : {}),
    ...(sanitized.source_page
      ? { source_page: truncate(sanitized.source_page, 100) }
      : {}),
    ...(sanitized.query_cluster
      ? { query_cluster: truncate(sanitized.query_cluster, 80) }
      : {}),
    ...(sanitized.content_cluster
      ? { content_cluster: truncate(sanitized.content_cluster, 60) }
      : {}),
    ...(sanitized.product_path
      ? { product_path: truncate(sanitized.product_path, 40) }
      : {}),
    ...(sanitized.landing_locale
      ? { landing_locale: truncate(sanitized.landing_locale, 16) }
      : {}),
    ...(sanitized.pricing_locale
      ? { pricing_locale: truncate(sanitized.pricing_locale, 16) }
      : {}),
    ...(sanitized.checkout_locale
      ? { checkout_locale: truncate(sanitized.checkout_locale, 16) }
      : {}),
    ...(sanitized.site_locale ? { site_locale: truncate(sanitized.site_locale, 16) } : {}),
    ...(sanitized.browser_language
      ? { browser_language: truncate(sanitized.browser_language, 32) }
      : {}),
    ...(sanitized.browser_languages
      ? { browser_languages: sanitized.browser_languages.slice(0, 4) }
      : {}),
    ...(typeof sanitized.locale_changed === 'boolean'
      ? { locale_changed: sanitized.locale_changed }
      : {}),
    ...(sanitized.geo_country ? { geo_country: truncate(sanitized.geo_country, 8) } : {}),
    ...(sanitized.geo_region ? { geo_region: truncate(sanitized.geo_region, 80) } : {}),
  }

  const compactDirect = serializeIfFits(compact)
  if (compactDirect) return compactDirect

  // Drop lower-value fields first. Acquisition entry point + internal source
  // page + query cluster are the last fields removed.
  const dropOrder: Array<keyof AcquisitionAttribution> = [
    'page_path',
    'content_cluster',
    'product_path',
    'acquisition_medium',
    'query_cluster',
    'source_page',
    'site_locale',
    'geo_region',
  ]

  for (const key of dropOrder) {
    delete compact[key]
    const serialized = serializeIfFits(compact)
    if (serialized) return serialized
  }

  // Final safety: preserve the acquisition source whenever possible and
  // progressively shorten remaining values. JSON remains valid at every step.
  for (const limit of [80, 60, 40, 24]) {
    if (compact.landing_page) compact.landing_page = truncate(compact.landing_page, limit)
    if (compact.acquisition_source) {
      compact.acquisition_source = truncate(compact.acquisition_source, limit)
    }
    const serialized = serializeIfFits(compact)
    if (serialized) return serialized
  }

  return undefined
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
