import { getCloudflareSql } from '@/data/neon-cloudflare'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import { isHighIntentSession, type MerchantAnalyticsSessionSignals } from '@/modules/store/domain/merchant-analytics'
import type { MerchantCommerceIntelligence } from './merchant-control-center'

export type MerchantControlExperience = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  name: string
  slug: string
  status: string
  frameCount: number
  referenceData: boolean
  publicPath: string
  policy: { objective: 'TRAFFIC' | 'INTENT' | 'LEAD' | null; gate: 'NONE' | 'OPT_IN_AFTER_VALUE' | 'OPT_IN_BEFORE_AI' | null; presentation: PresentationMode }
  updatedAt: string
}

export type MerchantControlCenter = {
  merchant: { id: string; slug: string; name: string; websiteUrl: string | null; status: string; referenceData: boolean }
  store: MerchantControlExperience | null
  experiences: MerchantControlExperience[]
  activeCampaignCount: number
  shopperActivityAvailable: boolean
  credentialUsage: { active: number }
  commerceIntelligence: MerchantCommerceIntelligence
}

const INSIGHT_WINDOW_DAYS = 30
const ENGAGEMENT_EVENTS = new Set(['merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed', 'merchant_compare_started', 'merchant_product_clicked', 'merchant_inquiry_submitted'])

function rate(value: number, total: number): number | null {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : null
}

function buildCommerceIntelligence(input: {
  experiences: Array<{ id: string; type: 'STORE' | 'CAMPAIGN'; name: string; status: string; referenceData: boolean }>
  sessions: Array<{ id: string; experienceId: string | null; source: string | null; medium: string | null; aiAgentSource: string | null }>
  events: Array<{ merchantSessionId: string | null; experienceId: string | null; merchantFrameId: string | null; type: string; count: number }>
  intents: Array<{ merchantSessionId: string; experienceId: string | null; type: string; count: number }>
  from: Date
  to: Date
}): MerchantCommerceIntelligence {
  const sessionIds = new Set(input.sessions.map((session) => session.id))
  const experienceById = new Map(input.experiences.map((experience) => [experience.id, experience]))
  type SessionSignals = MerchantAnalyticsSessionSignals & { triedFrameIds: Set<string> }
  type Metric = { visitors: number; engaged: Set<string>; recommendation: number; tryOn: number; compare: number; productClicks: number; highIntent: Set<string>; signals: Map<string, SessionSignals> }
  const metrics = new Map<string, Metric>()
  const ensure = (id: string) => {
    const existing = metrics.get(id)
    if (existing) return existing
    const created: Metric = { visitors: 0, engaged: new Set<string>(), recommendation: 0, tryOn: 0, compare: 0, productClicks: 0, highIntent: new Set<string>(), signals: new Map() }
    metrics.set(id, created)
    return created
  }
  const ensureSignal = (metric: Metric, sessionId: string) => {
    const existing = metric.signals.get(sessionId)
    if (existing) return existing
    const created: SessionSignals = { tryOnStarts: 0, tryOnCompletions: 0, uniqueFramesTried: 0, favorites: 0, compares: 0, frameInteractions: 0, productInteractions: 0, triedFrameIds: new Set() }
    metric.signals.set(sessionId, created)
    return created
  }
  const overall = ensure('__all__')
  const sources = new Map<string, number>()
  for (const session of input.sessions) {
    const bucket = session.experienceId && experienceById.has(session.experienceId) ? ensure(session.experienceId) : null
    overall.visitors += 1
    if (bucket) bucket.visitors += 1
    const source = session.aiAgentSource ? `AI · ${session.aiAgentSource}` : session.source ? `${session.source}${session.medium ? ` / ${session.medium}` : ''}` : 'Direct'
    sources.set(source, (sources.get(source) ?? 0) + 1)
  }
  for (const event of input.events) {
    if (!event.merchantSessionId || !sessionIds.has(event.merchantSessionId)) continue
    const bucket = event.experienceId && experienceById.has(event.experienceId) ? ensure(event.experienceId) : null
    const targets = bucket ? [overall, bucket] : [overall]
    for (const target of targets) {
      if (ENGAGEMENT_EVENTS.has(event.type)) target.engaged.add(event.merchantSessionId)
      if (event.type === 'merchant_recommendation_completed') target.recommendation += event.count
      const signal = ensureSignal(target, event.merchantSessionId)
      if (event.type === 'merchant_tryon_started') signal.tryOnStarts += event.count
      if (event.type === 'merchant_tryon_completed') {
        target.tryOn += event.count
        signal.tryOnCompletions += event.count
        if (event.merchantFrameId) {
          signal.triedFrameIds.add(String(event.merchantFrameId))
          signal.uniqueFramesTried = signal.triedFrameIds.size
        }
      }
      if (event.type === 'merchant_frame_selected') signal.frameInteractions += event.count
      if (event.type === 'merchant_compare_started') {
        target.compare += event.count
        signal.compares += event.count
      }
    }
  }
  for (const intent of input.intents) {
    if (!sessionIds.has(intent.merchantSessionId)) continue
    const bucket = intent.experienceId && experienceById.has(intent.experienceId) ? ensure(intent.experienceId) : null
    const targets = bucket ? [overall, bucket] : [overall]
    for (const target of targets) {
      const signal = ensureSignal(target, intent.merchantSessionId)
      if (intent.type === 'PRODUCT_CLICK') {
        target.productClicks += intent.count
        signal.productInteractions += intent.count
      }
      if (intent.type === 'FAVORITE') signal.favorites += intent.count
      if (intent.type === 'INQUIRY') signal.productInteractions += intent.count
    }
  }
  for (const metric of metrics.values()) {
    for (const [sessionId, signal] of metric.signals) if (isHighIntentSession(signal)) metric.highIntent.add(sessionId)
  }
  const toExperience = (experience: typeof input.experiences[number]) => {
    const value = ensure(experience.id)
    return { id: experience.id, type: experience.type, name: experience.name, status: experience.status, referenceData: experience.referenceData, visitors: value.visitors, engagedShoppers: value.engaged.size, recommendationActivity: value.recommendation, tryOnCompletions: value.tryOn, compareActivity: value.compare, productClicks: value.productClicks, highIntentShoppers: value.highIntent.size }
  }
  return {
    period: { from: input.from.toISOString(), to: input.to.toISOString(), timezone: 'UTC' },
    hasActivity: overall.visitors > 0,
    totals: { visitors: overall.visitors, engagedShoppers: overall.engaged.size, recommendationActivity: overall.recommendation, tryOnCompletions: overall.tryOn, compareActivity: overall.compare, productClicks: overall.productClicks, highIntentShoppers: overall.highIntent.size },
    rates: { engagement: rate(overall.engaged.size, overall.visitors), recommendation: rate(overall.recommendation, overall.visitors), tryOn: rate(overall.tryOn, overall.visitors), compare: rate(overall.compare, overall.visitors) },
    acquisitionSources: [...sources.entries()].map(([source, visitors]) => ({ source, visitors })).sort((a, b) => b.visitors - a.visitors).slice(0, 8),
    experiences: input.experiences.map(toExperience),
  }
}

export async function getMerchantControlCenter(input: { merchantId: string }): Promise<MerchantControlCenter | null> {
  const sql = getCloudflareSql()
  const merchantRows = await sql`
    SELECT "id", "slug", "name", "websiteUrl", "status", "referenceData"
    FROM "Merchant"
    WHERE "id" = ${input.merchantId}
    LIMIT 1
  `
  const merchant = merchantRows[0]
  if (!merchant) return null

  const [experiences, sessions, events, intents, credentialCount] = await Promise.all([
    sql`
      SELECT e."id", e."type", e."name", e."slug", e."status", e."campaignObjective",
        e."campaignGate", e."presentationMode", e."referenceData", e."updatedAt",
        count(ef."merchantFrameId") FILTER (WHERE ef."active" = true)::int AS "frameCount"
      FROM "Experience" e
      LEFT JOIN "ExperienceFrame" ef ON ef."experienceId" = e."id"
      WHERE e."merchantId" = ${input.merchantId}
      GROUP BY e."id"
      ORDER BY e."updatedAt" DESC
    `,
    sql`SELECT "id", "experienceId", "source", "medium", "aiAgentSource" FROM "MerchantSession" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${new Date(Date.now() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000)} ORDER BY "createdAt" DESC`,
    sql`SELECT "merchantSessionId", "experienceId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantEvent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${new Date(Date.now() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000)} GROUP BY "merchantSessionId", "experienceId", "merchantFrameId", "type"`,
    sql`SELECT "merchantSessionId", "experienceId", "type", count(*)::int AS "count" FROM "MerchantIntent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${new Date(Date.now() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000)} GROUP BY "merchantSessionId", "experienceId", "type"`,
    sql`SELECT count(*)::int AS "count" FROM "MerchantAgentCredential" WHERE "merchantId" = ${input.merchantId} AND "status" = 'ACTIVE'`,
  ])

  const mapped = experiences.map((experience): MerchantControlExperience => {
    const policy = resolveCampaignConversionPolicy({
      type: String(experience.type),
      campaignObjective: experience.campaignObjective == null ? null : String(experience.campaignObjective),
      campaignGate: experience.campaignGate == null ? null : String(experience.campaignGate),
    } as never)
    const type = String(experience.type) as 'STORE' | 'CAMPAIGN'
    const slug = String(experience.slug)
    return {
      id: String(experience.id),
      type,
      name: String(experience.name),
      slug,
      status: String(experience.status),
      frameCount: Number(experience.frameCount ?? 0),
      referenceData: Boolean(merchant.referenceData) || Boolean(experience.referenceData),
      publicPath: type === 'STORE' ? `/en/store/${String(merchant.slug)}` : `/en/c/${String(merchant.slug)}/${slug}`,
      policy: {
        objective: policy?.objective ?? null,
        gate: policy?.gate ?? null,
        presentation: resolvePresentationMode({ experienceType: type, persistedPresentationMode: experience.presentationMode == null ? null : String(experience.presentationMode) as PresentationMode }),
      },
      updatedAt: (experience.updatedAt instanceof Date ? experience.updatedAt : new Date(String(experience.updatedAt))).toISOString(),
    }
  })

  const to = new Date()
  const from = new Date(to.getTime() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const commerceIntelligence = buildCommerceIntelligence({
    experiences: mapped.map(({ id, type, name, status, referenceData }) => ({ id, type, name, status, referenceData })),
    sessions: sessions.map((session) => ({ id: String(session.id), experienceId: session.experienceId == null ? null : String(session.experienceId), source: session.source == null ? null : String(session.source), medium: session.medium == null ? null : String(session.medium), aiAgentSource: session.aiAgentSource == null ? null : String(session.aiAgentSource) })),
    events: events.map((event) => ({ merchantSessionId: event.merchantSessionId == null ? null : String(event.merchantSessionId), experienceId: event.experienceId == null ? null : String(event.experienceId), merchantFrameId: event.merchantFrameId == null ? null : String(event.merchantFrameId), type: String(event.type), count: Number(event.count ?? 0) })),
    intents: intents.map((intent) => ({ merchantSessionId: String(intent.merchantSessionId), experienceId: intent.experienceId == null ? null : String(intent.experienceId), type: String(intent.type), count: Number(intent.count ?? 0) })),
    from,
    to,
  })

  return {
    merchant: {
      id: String(merchant.id),
      slug: String(merchant.slug),
      name: String(merchant.name),
      websiteUrl: merchant.websiteUrl == null ? null : String(merchant.websiteUrl),
      status: String(merchant.status),
      referenceData: Boolean(merchant.referenceData),
    },
    store: mapped.find((experience) => experience.type === 'STORE') ?? null,
    experiences: mapped,
    activeCampaignCount: mapped.filter((experience) => experience.type === 'CAMPAIGN' && experience.status === 'ACTIVE').length,
    shopperActivityAvailable: commerceIntelligence.hasActivity,
    credentialUsage: { active: Number(credentialCount[0]?.count ?? 0) },
    commerceIntelligence,
  }
}
