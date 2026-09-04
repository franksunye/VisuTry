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
  'reddit',
  'youtube',
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
  reddit: 'Reddit',
  youtube: 'YouTube',
  other: 'Other',
}

export type MerchantDistributionExperience = {
  experienceId: string
  merchantSlug: string | null
  merchantName: string | null
  experienceType: string | null
  experienceSlug: string | null
  experienceName: string | null
  visitors: number
  engagedShoppers: number
  recommendationActivity: number
  tryOnCompletions: number
  compareActivity: number
  productClicks: number
  inquiries: number
  highIntentShoppers: number
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
  experiences: MerchantDistributionExperience[]
}

type DistributionSession = {
  id: string
  source: string | null
  medium: string | null
  referrer: string | null
  aiAgentSource: string | null
  experienceId?: string | null
  merchantSlug?: string | null
  merchantName?: string | null
  experienceType?: string | null
  experienceSlug?: string | null
  experienceName?: string | null
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

type DistributionMetrics = {
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
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  let host = normalized
  try {
    host = new URL(normalized).hostname.toLowerCase()
  } catch {
    host = normalized
      .replace(/^https?:\/\//, '')
      .split(/[/?#]/, 1)[0]
      .replace(/:\d+$/, '')
      .replace(/^www\./, '')
  }
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
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

  if (source === 'reddit' || matchesDomain(sourceOrReferrer, ['reddit.com', 'redd.it'])) {
    return 'reddit'
  }

  if (source === 'youtube' || matchesDomain(sourceOrReferrer, ['youtube.com', 'youtu.be'])) {
    return 'youtube'
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

function ensureMetrics<T extends string>(metrics: Map<T, DistributionMetrics>, key: T): DistributionMetrics {
  const existing = metrics.get(key)
  if (existing) return existing
  const created: DistributionMetrics = {
    visitors: 0,
    engaged: new Set<string>(),
    recommendationActivity: 0,
    tryOnCompletions: 0,
    compareActivity: 0,
    productClicks: 0,
    inquiries: 0,
    signals: new Map(),
  }
  metrics.set(key, created)
  return created
}

function ensureSignals(metrics: DistributionMetrics, sessionId: string) {
  const existing = metrics.signals.get(sessionId)
  if (existing) return existing
  const created = emptySignals()
  metrics.signals.set(sessionId, created)
  return created
}

function applyEvent(metrics: DistributionMetrics, event: DistributionEvent) {
  if (!event.merchantSessionId) return
  const signals = ensureSignals(metrics, event.merchantSessionId)
  if (ENGAGEMENT_EVENTS.has(event.type)) metrics.engaged.add(event.merchantSessionId)
  if (event.type === 'merchant_recommendation_completed') metrics.recommendationActivity += event.count
  if (event.type === 'merchant_tryon_completed') {
    metrics.tryOnCompletions += event.count
    signals.tryOnCompletions += event.count
    if (event.merchantFrameId) {
      signals.triedFrameIds.add(event.merchantFrameId)
      signals.uniqueFramesTried = signals.triedFrameIds.size
    }
  }
  if (event.type === 'merchant_tryon_started') signals.tryOnStarts += event.count
  if (event.type === 'merchant_frame_selected') signals.frameInteractions += event.count
  if (event.type === 'merchant_compare_started') {
    metrics.compareActivity += event.count
    signals.compares += event.count
  }
}

function applyIntent(metrics: DistributionMetrics, intent: DistributionIntent) {
  const signals = ensureSignals(metrics, intent.merchantSessionId)
  if (intent.type === 'PRODUCT_CLICK') {
    metrics.productClicks += intent.count
    signals.productInteractions += intent.count
  }
  if (intent.type === 'INQUIRY') {
    metrics.inquiries += intent.count
    signals.productInteractions += intent.count
  }
  if (intent.type === 'FAVORITE') signals.favorites += intent.count
}

type ExperienceDescriptor = Pick<MerchantDistributionExperience, 'experienceId' | 'merchantSlug' | 'merchantName' | 'experienceType' | 'experienceSlug' | 'experienceName'>

function metricsToExperience(
  descriptor: ExperienceDescriptor,
  metrics: DistributionMetrics,
): MerchantDistributionExperience {
  return {
    ...descriptor,
    visitors: metrics.visitors,
    engagedShoppers: metrics.engaged.size,
    recommendationActivity: metrics.recommendationActivity,
    tryOnCompletions: metrics.tryOnCompletions,
    compareActivity: metrics.compareActivity,
    productClicks: metrics.productClicks,
    inquiries: metrics.inquiries,
    highIntentShoppers: Array.from(metrics.signals.values()).filter(isHighIntentSession).length,
  }
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
  const sessionExperience = new Map<string, string>()
  const metrics = new Map<MerchantDistributionSourceClass, DistributionMetrics>()
  const experienceMetrics = new Map<string, DistributionMetrics>()
  const experienceDescriptors = new Map<string, ExperienceDescriptor>()

  for (const session of input.sessions) {
    const sourceClass = classifyMerchantDistributionSource(session)
    sessionSource.set(session.id, sourceClass)
    ensureMetrics(metrics, sourceClass).visitors += 1
    if (session.experienceId) {
      sessionExperience.set(session.id, session.experienceId)
      ensureMetrics(experienceMetrics, session.experienceId).visitors += 1
      experienceDescriptors.set(session.experienceId, {
        experienceId: session.experienceId,
        merchantSlug: session.merchantSlug ?? null,
        merchantName: session.merchantName ?? null,
        experienceType: session.experienceType ?? null,
        experienceSlug: session.experienceSlug ?? null,
        experienceName: session.experienceName ?? null,
      })
    }
  }

  for (const event of input.events) {
    if (!event.merchantSessionId) continue
    const sourceClass = sessionSource.get(event.merchantSessionId)
    if (!sourceClass) continue
    applyEvent(ensureMetrics(metrics, sourceClass), event)
    const experienceId = sessionExperience.get(event.merchantSessionId)
    if (experienceId) applyEvent(ensureMetrics(experienceMetrics, experienceId), event)
  }

  for (const intent of input.intents) {
    const sourceClass = sessionSource.get(intent.merchantSessionId)
    if (!sourceClass) continue
    applyIntent(ensureMetrics(metrics, sourceClass), intent)
    const experienceId = sessionExperience.get(intent.merchantSessionId)
    if (experienceId) applyIntent(ensureMetrics(experienceMetrics, experienceId), intent)
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
    experiences: Array.from(experienceMetrics.entries())
      .map(([experienceId, value]) => metricsToExperience(
        experienceDescriptors.get(experienceId) ?? {
          experienceId,
          merchantSlug: null,
          merchantName: null,
          experienceType: null,
          experienceSlug: null,
          experienceName: null,
        },
        value,
      ))
      .sort((a, b) => b.visitors - a.visitors || a.experienceId.localeCompare(b.experienceId)),
  }
}
