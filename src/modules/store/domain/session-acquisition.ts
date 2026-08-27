/**
 * Store session acquisition context — persists first-touch source/campaign/
 * surface through the intent journey. Domain-only: no framework imports.
 *
 * AI referral + distribution surface vocab live in `@/lib/commerce-handoff`
 * so Consumer analytics can share them without importing Store.
 */

import {
  classifyAiSourceToken,
  inferAiReferralSource,
  isAiAssistantMedium,
  type AiReferralSource,
} from '@/lib/commerce-handoff/ai-referral'
import {
  INTERNAL_DISTRIBUTION_SURFACES,
  CONTEXTUAL_DISTRIBUTION_SURFACES,
  normalizeInternalSurface,
  type ContextualDistributionSurface,
  type InternalDistributionSurface,
} from '@/lib/commerce-handoff/distribution-surfaces'

export {
  INTERNAL_DISTRIBUTION_SURFACES,
  CONTEXTUAL_DISTRIBUTION_SURFACES,
  inferAiReferralSource,
  type AiReferralSource,
  type ContextualDistributionSurface,
  type InternalDistributionSurface,
}

const MAX_FIELD = 500

export type SessionAcquisitionInput = {
  source?: string | null
  medium?: string | null
  campaign?: string | null
  surface?: string | null
  acquisitionSurface?: string | null
  referrer?: string | null
  landingUrl?: string | null
  aiAgentSource?: string | null
}

export type SessionAcquisition = {
  source: string | null
  medium: string | null
  campaign: string | null
  acquisitionSurface: InternalDistributionSurface | null
  referrer: string | null
  landingUrl: string | null
  aiAgentSource: AiReferralSource | null
}

function clean(value: unknown, max = MAX_FIELD): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

function normalizeToken(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

/** Normalize client/server acquisition payload for MerchantSession persistence. */
export function sanitizeSessionAcquisition(
  input: unknown,
): SessionAcquisition {
  const empty: SessionAcquisition = {
    source: null,
    medium: null,
    campaign: null,
    acquisitionSurface: null,
    referrer: null,
    landingUrl: null,
    aiAgentSource: null,
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return empty
  }

  const record = input as Record<string, unknown>
  const source =
    clean(record.source) ??
    clean(record.utm_source) ??
    clean(record.acquisition_source)
  const medium =
    clean(record.medium, 120) ??
    clean(record.utm_medium, 120) ??
    clean(record.acquisition_medium, 120)
  const campaign = clean(record.campaign) ?? clean(record.utm_campaign)
  const requestedSurface = record.acquisitionSurface ?? record.surface
  const referrer = clean(record.referrer)
  const landingUrl = clean(record.landingUrl) ?? clean(record.landing_page)
  const aiAgentHint = clean(record.aiAgentSource, 120)

  const explicitAiSource = inferAiReferralSource({ source, referrer, aiAgentHint })
  const corroboratedHint =
    isAiAssistantMedium(medium)
      ? classifyAiSourceToken(aiAgentHint)
      : null
  const isInternalDistribution =
    normalizeToken(source) === 'visutry' && normalizeToken(medium) === 'internal'

  return {
    source,
    medium,
    campaign,
    acquisitionSurface: isInternalDistribution ? normalizeInternalSurface(requestedSurface) : null,
    referrer,
    landingUrl,
    aiAgentSource: explicitAiSource ?? corroboratedHint,
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
