/**
 * Store session acquisition context — persists source/campaign through the
 * intent journey. Domain-only: no framework imports.
 */

const MAX_FIELD = 500

export type SessionAcquisitionInput = {
  source?: string | null
  medium?: string | null
  campaign?: string | null
  referrer?: string | null
  landingUrl?: string | null
  aiAgentSource?: string | null
}

export type SessionAcquisition = {
  source: string | null
  medium: string | null
  campaign: string | null
  referrer: string | null
  landingUrl: string | null
  aiAgentSource: string | null
}

function clean(value: unknown, max = MAX_FIELD): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

/** Normalize client/server acquisition payload for MerchantSession persistence. */
export function sanitizeSessionAcquisition(
  input: unknown,
): SessionAcquisition {
  const empty: SessionAcquisition = {
    source: null,
    medium: null,
    campaign: null,
    referrer: null,
    landingUrl: null,
    aiAgentSource: null,
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return empty
  }

  const record = input as Record<string, unknown>

  // Accept both Store field names and UTM aliases from the client.
  return {
    source:
      clean(record.source) ??
      clean(record.utm_source) ??
      clean(record.acquisition_source),
    medium:
      clean(record.medium, 120) ??
      clean(record.utm_medium, 120) ??
      clean(record.acquisition_medium, 120),
    campaign:
      clean(record.campaign) ?? clean(record.utm_campaign),
    referrer: clean(record.referrer),
    landingUrl: clean(record.landingUrl) ?? clean(record.landing_page),
    aiAgentSource: clean(record.aiAgentSource, 120),
  }
}

export function sessionAcquisitionToMetadata(
  acquisition: SessionAcquisition,
): Record<string, string> | null {
  const entries = Object.entries(acquisition).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0,
  )
  if (entries.length === 0) return null
  return Object.fromEntries(entries)
}
