/**
 * Resolve a single public analytics bootstrap for locale routes.
 *
 * Production previously loaded both GTM and gtag with the same GA4 ID
 * (`G-…` passed to `gtm.js`), which double-initialized the property.
 *
 * Rules:
 * - A real GTM container (`GTM-…`) wins → GTM-only (GA4 is expected to live
 *   inside the container; do not also load gtag.js for the same property).
 * - A GA4 measurement ID (`G-…`) → gtag-only.
 * - A `G-…` value in NEXT_PUBLIC_GTM_ID is a misconfiguration, not a container.
 */

export type PublicAnalyticsBootstrap =
  | { mode: 'none' }
  | { mode: 'gtm'; gtmId: string }
  | { mode: 'gtag'; gaId: string }

const GTM_CONTAINER_ID = /^GTM-[A-Z0-9]+$/i
const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/i

function normalizeId(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export function isGtmContainerId(value: string | null | undefined): boolean {
  return GTM_CONTAINER_ID.test(normalizeId(value))
}

export function isGaMeasurementId(value: string | null | undefined): boolean {
  return GA_MEASUREMENT_ID.test(normalizeId(value))
}

export function resolvePublicAnalyticsBootstrap(input: {
  gtmId?: string | null
  gaId?: string | null
}): PublicAnalyticsBootstrap {
  const gtmId = normalizeId(input.gtmId)
  const gaId = normalizeId(input.gaId)

  if (isGtmContainerId(gtmId)) {
    return { mode: 'gtm', gtmId: gtmId.toUpperCase() }
  }

  const gaFromMisusedGtmSlot = isGaMeasurementId(gtmId) ? gtmId : ''
  const resolvedGaId = isGaMeasurementId(gaId) ? gaId : gaFromMisusedGtmSlot
  if (resolvedGaId) {
    return { mode: 'gtag', gaId: resolvedGaId.toUpperCase() }
  }

  return { mode: 'none' }
}
