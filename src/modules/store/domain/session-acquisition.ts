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

function normalizeToken(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

function classifyAiSourceToken(value: string | null): string | null {
  const token = normalizeToken(value)
  if (!token) return null
  if (token.includes('chatgpt') || token === 'openai') return 'chatgpt'
  if (token.includes('claude') || token.includes('anthropic')) return 'claude'
  if (token.includes('perplexity')) return 'perplexity'
  if (token.includes('gemini')) return 'gemini'
  return null
}

function classifyAiReferrer(referrer: string | null): string | null {
  if (!referrer) return null
  try {
    const hostname = new URL(referrer).hostname.toLowerCase()
    if (hostname === 'chatgpt.com' || hostname.endsWith('.chatgpt.com')) return 'chatgpt'
    if (hostname === 'claude.ai' || hostname.endsWith('.claude.ai')) return 'claude'
    if (hostname === 'perplexity.ai' || hostname.endsWith('.perplexity.ai')) return 'perplexity'
    if (hostname === 'gemini.google.com' || hostname.endsWith('.gemini.google.com')) return 'gemini'
  } catch {
    return null
  }
  return null
}

/**
 * AI referral classification is intentionally evidence-first:
 * explicit campaign/source > trusted referrer hostname > no classification.
 *
 * Client UA hints are not trusted on their own because crawler identities such
 * as GPTBot / Google-Extended are not shopper referrals.
 */
export function inferAiReferralSource(input: {
  source: string | null
  referrer: string | null
  aiAgentHint?: string | null
}): string | null {
  const sourceMatch = classifyAiSourceToken(input.source)
  if (sourceMatch) return sourceMatch

  const referrerMatch = classifyAiReferrer(input.referrer)
  if (referrerMatch) return referrerMatch

  // Preserve a client hint only when it is corroborated by an AI-assistant medium.
  // This supports explicit campaign tagging without promoting crawler-only UAs.
  return null
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
  const source =
    clean(record.source) ??
    clean(record.utm_source) ??
    clean(record.acquisition_source)
  const medium =
    clean(record.medium, 120) ??
    clean(record.utm_medium, 120) ??
    clean(record.acquisition_medium, 120)
  const campaign = clean(record.campaign) ?? clean(record.utm_campaign)
  const referrer = clean(record.referrer)
  const landingUrl = clean(record.landingUrl) ?? clean(record.landing_page)
  const aiAgentHint = clean(record.aiAgentSource, 120)

  const explicitAiSource = inferAiReferralSource({ source, referrer, aiAgentHint })
  const corroboratedHint =
    normalizeToken(medium).includes('ai-assistant') || normalizeToken(medium).includes('ai_assistant')
      ? classifyAiSourceToken(aiAgentHint)
      : null

  return {
    source,
    medium,
    campaign,
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
