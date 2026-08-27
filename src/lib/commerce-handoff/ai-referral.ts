/**
 * Shared AI-referral classification for Consumer analytics and Store session
 * acquisition. Domain-only: no Store orchestration, no framework imports.
 */

export type AiReferralSource =
  | 'chatgpt'
  | 'openai'
  | 'perplexity'
  | 'gemini'
  | 'copilot'
  | 'claude'

function normalizeToken(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

export function classifyAiSourceToken(value: string | null): AiReferralSource | null {
  const token = normalizeToken(value)
  if (!token) return null
  if (token.includes('chatgpt') || token.includes('chat.openai')) return 'chatgpt'
  if (token === 'openai' || token.includes('openai.com')) return 'openai'
  if (token.includes('claude') || token.includes('anthropic')) return 'claude'
  if (token.includes('perplexity')) return 'perplexity'
  if (token.includes('gemini')) return 'gemini'
  if (token.includes('copilot')) return 'copilot'
  return null
}

function classifyAiReferrer(referrer: string | null): AiReferralSource | null {
  if (!referrer) return null
  try {
    const hostname = new URL(referrer).hostname.toLowerCase()
    if (
      hostname === 'chatgpt.com' ||
      hostname.endsWith('.chatgpt.com') ||
      hostname === 'chat.openai.com' ||
      hostname.endsWith('.chat.openai.com')
    ) return 'chatgpt'
    if (hostname === 'openai.com' || hostname.endsWith('.openai.com')) return 'openai'
    if (hostname === 'claude.ai' || hostname.endsWith('.claude.ai')) return 'claude'
    if (hostname === 'perplexity.ai' || hostname.endsWith('.perplexity.ai')) return 'perplexity'
    if (hostname === 'gemini.google.com' || hostname.endsWith('.gemini.google.com')) return 'gemini'
    if (hostname === 'copilot.com' || hostname.endsWith('.copilot.com') || hostname === 'copilot.microsoft.com') return 'copilot'
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
}): AiReferralSource | null {
  const sourceMatch = classifyAiSourceToken(input.source)
  if (sourceMatch) return sourceMatch

  const referrerMatch = classifyAiReferrer(input.referrer)
  if (referrerMatch) return referrerMatch

  return null
}

export function isAiAssistantMedium(medium: string | null): boolean {
  const token = normalizeToken(medium)
  return token.includes('ai-assistant') || token.includes('ai_assistant')
}
