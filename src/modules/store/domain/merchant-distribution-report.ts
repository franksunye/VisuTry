import { isHighIntentSession, type MerchantAnalyticsSessionSignals } from './merchant-analytics'

export const MERCHANT_DISTRIBUTION_SOURCE_CLASSES = [
  'chatgpt',
  'openai',
  'perplexity',
  'gemini',
  'copilot',
  'claude',
  'organic_search',
  'generic_referral',
  'paid',
  'direct',
  'social',
  'other',
] as const

export type MerchantDistributionSourceClass = typeof MERCHANT_DISTRIBUTION_SOURCE_CLASSES[number]

export const MERCHANT_DISTRIBUTION_SOURCE_LABELS: Record<MerchantDistributionSourceClass, string> = {
  chatgpt: 'ChatGPT',
  openai: 'OpenAI',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
  copilot: 'Copilot',
  claude: 'Claude',
  organic_search: 'Organic search',
  generic_referral: 'Generic referral',
  paid: 'Paid',
  direct: 'Direct',
  social: 'Social',
  other: 'Other',
}

export type MerchantDistributionReport = {
  scope: 'MERCHANT_STORE_CAMPAIGN_SESSIONS'
  consumerEventBoundary: string
  sources: Array<{
    sourceClass: MerchantDistributionSourceClass
    visitors: number
    engagedShoppers: number
    recommendationActivity: number
    tryOnCompletions: number
    compareActivity: number
    productClicks: number
    inquiries: number
    highIntentShoppers: number
  }>
}

type DistributionSession = {
  id: string
  source: string | null
  medium: string | null
  referrer: string | null
  aiAgentSource: string | null
}

type DistributionEvent = {
  merchantSessionId: string | null
  merchantFrameId: string | null
  type: string
  count: number
}

type DistributionIntent = {
  merchantSessionId: string
  type: string
  count: number
}

type SourceMetrics = {
  visitors: number
  engaged: Set<string>
  recommendationActivity: number
  tryOnCompletions: number
  compareActivity: number
  productClicks: number
  inquiries: number
  signals: Map<string, MerchantAnalyticsSessionSignals & { triedFrameIds: Set<string> }>
}

function normalize(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

function matchesDomain(value: string, domains: readonly string[]): boolean {
  return domains.some((domain) => value === domain || value.endsWith(`.${domain}`))
}

function sourceToken(session: DistributionSession): string {
  return normalize(session.aiAgentSource) || normalize(session.source)
}

export function classifyMerchantDistributionSource(session: DistributionSession): MerchantDistributionSourceClass {
  const aiSource = sourceToken(session)
  if (aiSource === 'chatgpt') return 'chatgpt'
  if (aiSource === 'openai') return 'openai'
  if (aiSource === 'perplexity') return 'perplexity'
  if (aiSource === 'gemini') return 'gemini'
  if (aiSource === 'copilot') return 'copilot'
  if (aiSource === 'claude') return 'claude'

  const source = normalize(session.source)
  const medium = normalize(session.medium)
  const referrer = normalize(session.referrer)
  const sourceOrReferrer = source || referrer

  if (/(^|[_-])(cpc|ppc|paid|ads|display|affiliate)([_-]|$)/.test(medium) || medium.includes('paid')) {
    return 'paid'
  }

  if (
    medium.includes('organic') ||
    medium.includes('search') ||
    matchesDomain(sourceOrReferrer, ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com', 'yandex.ru'])
  ) {
    return 'organic_search'
  }

  if (
    medium.includes('social') ||
    matchesDomain(sourceOrReferrer, ['facebook.com', 'instagram.com', 'tiktok.com', 'pinterest.com', 'linkedin.com', 'x.com', 'twitter.com'])
  ) {
    return 'social'
  }

  if (!sourceOrReferrer || source === 'direct' || medium === 'none' || medium === 'direct') {
    return 'direct'
  }

  if (medium === 'referral' || referrer) return 'generic_referral'
  return 'other'
}

function emptySignals(): MerchantAnalyticsSessionSignals & { triedFrameIds: Set<string> } {
  return {
    tryOnStarts: 0,
    tryOnCompletions: 0,
    uniqueFramesTried: 0,
    favorites: 0,
    compares: 0,
    frameInteractions: 0,
    productInteractions: 0,
    triedFrameIds: new Set<string>(),
  }
}

function ensureMetrics(metrics: Map<MerchantDistributionSourceClass, SourceMetrics>, sourceClass: MerchantDistributionSourceClass): SourceMetrics {
  const existing = metrics.get(sourceClass)
  if (existing) return existing
  const created: SourceMetrics = {
    visitors: 0,
    engaged: new Set<string>(),
    recommendationActivity: 0,
    tryOnCompletions: 0,
    compareActivity: 0,
    productClicks: 0,
    inquiries: 0,
    signals: new Map(),
  }
  metrics.set(sourceClass, created)
  return created
}

function ensureSignals(metrics: SourceMetrics, sessionId: string) {
  const existing = metrics.signals.get(sessionId)
  if (existing) return existing
  const created = emptySignals()
  metrics.signals.set(sessionId, created)
  return created
}

const ENGAGEMENT_EVENTS = new Set([
  'merchant_recommendation_completed',
  'merchant_frame_selected',
  'merchant_tryon_started',
  'merchant_tryon_completed',
  'merchant_compare_started',
  'merchant_product_clicked',
  'merchant_inquiry_submitted',
])

/**
 * Build a source-class report from durable MerchantSession/Store event data.
 * Core Consumer GA4 events are intentionally not joined to this report because
 * they do not carry a durable MerchantSession identifier.
 */
export function buildMerchantDistributionReport(input: {
  sessions: DistributionSession[]
  events: DistributionEvent[]
  intents: DistributionIntent[]
}): MerchantDistributionReport {
  const sessionSource = new Map<string, MerchantDistributionSourceClass>()
  const metrics = new Map<MerchantDistributionSourceClass, SourceMetrics>()

  for (const session of input.sessions) {
    const sourceClass = classifyMerchantDistributionSource(session)
    sessionSource.set(session.id, sourceClass)
    ensureMetrics(metrics, sourceClass).visitors += 1
  }

  for (const event of input.events) {
    if (!event.merchantSessionId) continue
    const sourceClass = sessionSource.get(event.merchantSessionId)
    if (!sourceClass) continue
    const target = ensureMetrics(metrics, sourceClass)
    const signals = ensureSignals(target, event.merchantSessionId)
    if (ENGAGEMENT_EVENTS.has(event.type)) target.engaged.add(event.merchantSessionId)
    if (event.type === 'merchant_recommendation_completed') target.recommendationActivity += event.count
    if (event.type === 'merchant_tryon_completed') {
      target.tryOnCompletions += event.count
      signals.tryOnCompletions += event.count
      if (event.merchantFrameId) {
        signals.triedFrameIds.add(event.merchantFrameId)
        signals.uniqueFramesTried = signals.triedFrameIds.size
      }
    }
    if (event.type === 'merchant_tryon_started') signals.tryOnStarts += event.count
    if (event.type === 'merchant_frame_selected') signals.frameInteractions += event.count
    if (event.type === 'merchant_compare_started') {
      target.compareActivity += event.count
      signals.compares += event.count
    }
  }

  for (const intent of input.intents) {
    const sourceClass = sessionSource.get(intent.merchantSessionId)
    if (!sourceClass) continue
    const target = ensureMetrics(metrics, sourceClass)
    const signals = ensureSignals(target, intent.merchantSessionId)
    if (intent.type === 'PRODUCT_CLICK') {
      target.productClicks += intent.count
      signals.productInteractions += intent.count
    }
    if (intent.type === 'INQUIRY') {
      target.inquiries += intent.count
      signals.productInteractions += intent.count
    }
    if (intent.type === 'FAVORITE') signals.favorites += intent.count
  }

  return {
    scope: 'MERCHANT_STORE_CAMPAIGN_SESSIONS',
    consumerEventBoundary: 'Detector and Advisor events currently live in GA4/dataLayer without a durable MerchantSession join; this report does not claim those Consumer actions.',
    sources: Array.from(metrics.entries())
      .map(([sourceClass, value]) => ({
        sourceClass,
        visitors: value.visitors,
        engagedShoppers: value.engaged.size,
        recommendationActivity: value.recommendationActivity,
        tryOnCompletions: value.tryOnCompletions,
        compareActivity: value.compareActivity,
        productClicks: value.productClicks,
        inquiries: value.inquiries,
        highIntentShoppers: Array.from(value.signals.values()).filter(isHighIntentSession).length,
      }))
      .sort((a, b) => b.visitors - a.visitors || a.sourceClass.localeCompare(b.sourceClass)),
  }
}
