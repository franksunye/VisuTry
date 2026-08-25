import { getCloudflareSql } from '@/data/neon-cloudflare'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import { isHighIntentSession, type MerchantAnalyticsSessionSignals } from '@/modules/store/domain/merchant-analytics'
import { buildMerchantDistributionReport, MERCHANT_DISTRIBUTION_SOURCE_LABELS, type MerchantDistributionReport } from '@/modules/store/domain/merchant-distribution-report'
import { validateCatalogFrame } from './merchant-onboarding-cloudflare'
import { buildMerchantCommerceComparison, buildMerchantCommerceInterpretation, buildMerchantExperiencePerformance, buildMerchantSourceHighlights, type MerchantCommerceMetricValues } from '../domain/merchant-control-insights'
import type { MerchantCatalogFrameSummary, MerchantCatalogSummary, MerchantCommerceIntelligence } from './merchant-control-center'

export type MerchantControlExperience = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  name: string
  slug: string
  status: string
  frameCount: number
  referenceData: boolean
  publicPath: string
  headline: string | null
  description: string | null
  primaryCtaLabel: string | null
  startAt: string | null
  endAt: string | null
  selectedFrames: MerchantCatalogFrameSummary[]
  readiness: { status: 'VALID' | 'NEEDS_ATTENTION' | 'INCOMPLETE'; validCount: number; invalidCount: number; issues: string[] }
  lastOperation: { label: string; actor: string; at: string } | null
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
  catalog: MerchantCatalogSummary
  distributionReport?: MerchantDistributionReport
}

const INSIGHT_WINDOW_DAYS = 30
const ENGAGEMENT_EVENTS = new Set(['merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed', 'merchant_compare_started', 'merchant_product_clicked', 'merchant_inquiry_submitted'])

type CatalogRow = {
  id: unknown
  sku: unknown
  name: unknown
  brand: unknown
  imageUrl: unknown
  shape: unknown
  widthClass: unknown
  source: unknown
  status: unknown
  enrichmentStatus: unknown
}

type SelectedFrameRow = CatalogRow & { experienceId: unknown }

function catalogFrame(row: CatalogRow): MerchantCatalogFrameSummary {
  const frame = {
    id: String(row.id),
    sku: row.sku == null ? null : String(row.sku),
    name: String(row.name ?? ''),
    brand: row.brand == null ? null : String(row.brand),
    imageUrl: row.imageUrl == null ? null : String(row.imageUrl),
    shape: String(row.shape ?? ''),
    widthClass: row.widthClass == null ? null : String(row.widthClass),
    status: String(row.status ?? 'UNKNOWN'),
  }
  return {
    id: frame.id,
    sku: frame.sku,
    name: frame.name,
    brand: frame.brand,
    imageUrl: frame.imageUrl,
    source: String(row.source ?? 'UNKNOWN'),
    status: frame.status,
    enrichmentStatus: String(row.enrichmentStatus ?? 'UNKNOWN'),
    validation: validateCatalogFrame(frame),
  }
}

function catalogSummary(rows: CatalogRow[]): MerchantCatalogSummary {
  const sourceCounts = new Map<string, number>()
  let active = 0
  let valid = 0
  for (const row of rows) {
    const frame = catalogFrame(row)
    if (frame.status === 'ACTIVE') active += 1
    if (frame.validation.valid) valid += 1
    sourceCounts.set(frame.source, (sourceCounts.get(frame.source) ?? 0) + 1)
  }
  return {
    total: rows.length,
    active,
    valid,
    invalid: rows.length - valid,
    sourceCounts: [...sourceCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([source, count]) => ({ source, count })),
  }
}

function experienceReadiness(frames: MerchantCatalogFrameSummary[]): MerchantControlExperience['readiness'] {
  if (frames.length === 0) return { status: 'INCOMPLETE', validCount: 0, invalidCount: 0, issues: ['NO_SELECTED_FRAMES'] }
  const issues = [...new Set(frames.flatMap((frame) => [...frame.validation.issues, ...frame.validation.warnings]))]
  const validCount = frames.filter((frame) => frame.validation.valid).length
  return { status: validCount === frames.length ? 'VALID' : 'NEEDS_ATTENTION', validCount, invalidCount: frames.length - validCount, issues }
}

function operationLabel(action: string): string | null {
  if (action === 'store.created' || action === 'campaign.created') return 'Created'
  if (action === 'store.frames_updated' || action === 'campaign.frames_updated') return 'Catalog updated'
  if (action === 'store.published' || action === 'campaign.published') return 'Published'
  if (action === 'campaign.updated') return 'Updated'
  return null
}

function operationActor(actorType: unknown): string {
  if (actorType === 'HUMAN') return 'Human'
  if (actorType === 'AGENT') return 'Agent'
  return 'System'
}

function rate(value: number, total: number): number | null {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : null
}

function buildCommerceIntelligence(input: {
  experiences: Array<{ id: string; type: 'STORE' | 'CAMPAIGN'; name: string; status: string; referenceData: boolean }>
  sessions: Array<{ id: string; experienceId: string | null; source: string | null; medium: string | null; referrer: string | null; aiAgentSource: string | null }>
  events: Array<{ merchantSessionId: string | null; experienceId: string | null; merchantFrameId: string | null; type: string; count: number }>
  intents: Array<{ merchantSessionId: string; experienceId: string | null; type: string; count: number }>
  from: Date
  to: Date
}): Omit<MerchantCommerceIntelligence, 'comparison' | 'experiencePerformance' | 'sourceHighlights' | 'interpretation'> {
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
    distributionReport: buildMerchantDistributionReport({ sessions: input.sessions, events: input.events, intents: input.intents }),
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

  const to = new Date()
  const currentFrom = new Date(to.getTime() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const previousFrom = new Date(currentFrom.getTime() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const loadWindow = (from: Date, until: Date) => Promise.all([
    sql`SELECT "id", "experienceId", "source", "medium", "referrer", "aiAgentSource" FROM "MerchantSession" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} ORDER BY "createdAt" DESC`,
    sql`SELECT "merchantSessionId", "experienceId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantEvent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} GROUP BY "merchantSessionId", "experienceId", "merchantFrameId", "type"`,
    sql`SELECT "merchantSessionId", "experienceId", "type", count(*)::int AS "count" FROM "MerchantIntent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} GROUP BY "merchantSessionId", "experienceId", "type"`,
  ])
  const [experiences, catalogRows, selectedFrameRows, auditRows, currentWindow, previousWindow, credentialCount] = await Promise.all([
    sql`
      SELECT e."id", e."type", e."name", e."slug", e."status", e."campaignObjective",
        e."campaignGate", e."presentationMode", e."referenceData", e."headline", e."description",
        e."primaryCtaLabel", e."startAt", e."endAt", e."updatedAt",
        count(ef."merchantFrameId") FILTER (WHERE ef."active" = true)::int AS "frameCount"
      FROM "Experience" e
      LEFT JOIN "ExperienceFrame" ef ON ef."experienceId" = e."id"
      WHERE e."merchantId" = ${input.merchantId}
      GROUP BY e."id"
      ORDER BY e."updatedAt" DESC
    `,
    sql`SELECT "id", "sku", "name", "brand", "imageUrl", "shape", "widthClass", "source", "status", "enrichmentStatus" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId} ORDER BY "name" ASC`,
    sql`SELECT ef."experienceId", mf."id", mf."sku", mf."name", mf."brand", mf."imageUrl", mf."shape", mf."widthClass", mf."source", mf."status", mf."enrichmentStatus" FROM "ExperienceFrame" ef JOIN "MerchantFrame" mf ON mf."id" = ef."merchantFrameId" AND mf."merchantId" = ef."merchantId" WHERE ef."merchantId" = ${input.merchantId} AND ef."active" = true ORDER BY ef."experienceId", ef."sortOrder" ASC NULLS LAST, ef."createdAt" ASC`,
    sql`SELECT "resourceId", "action", "actorType", "createdAt" FROM "MerchantOperationAudit" WHERE "merchantId" = ${input.merchantId} AND "resourceType" = 'Experience' ORDER BY "createdAt" DESC`,
    loadWindow(currentFrom, to),
    loadWindow(previousFrom, currentFrom),
    sql`SELECT count(*)::int AS "count" FROM "MerchantAgentCredential" WHERE "merchantId" = ${input.merchantId} AND "status" = 'ACTIVE'`,
  ])

  const selectedByExperience = new Map<string, MerchantCatalogFrameSummary[]>()
  for (const row of selectedFrameRows as SelectedFrameRow[]) {
    const experienceId = String(row.experienceId)
    const frames = selectedByExperience.get(experienceId) ?? []
    frames.push(catalogFrame(row))
    selectedByExperience.set(experienceId, frames)
  }
  const latestOperationByResource = new Map<string, { label: string; actor: string; at: string }>()
  for (const row of auditRows as Array<{ resourceId: unknown; action: unknown; actorType: unknown; createdAt: unknown }>) {
    const resourceId = row.resourceId == null ? null : String(row.resourceId)
    const label = operationLabel(String(row.action ?? ''))
    if (!resourceId || !label || latestOperationByResource.has(resourceId)) continue
    const date = row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    latestOperationByResource.set(resourceId, { label, actor: operationActor(row.actorType), at: date.toISOString() })
  }

  const mapped = experiences.map((experience): MerchantControlExperience => {
    const policy = resolveCampaignConversionPolicy({
      type: String(experience.type),
      campaignObjective: experience.campaignObjective == null ? null : String(experience.campaignObjective),
      campaignGate: experience.campaignGate == null ? null : String(experience.campaignGate),
    } as never)
    const type = String(experience.type) as 'STORE' | 'CAMPAIGN'
    const slug = String(experience.slug)
    const selectedFrames = selectedByExperience.get(String(experience.id)) ?? []
    return {
      id: String(experience.id),
      type,
      name: String(experience.name),
      slug,
      status: String(experience.status),
      frameCount: Number(experience.frameCount ?? 0),
      referenceData: Boolean(merchant.referenceData) || Boolean(experience.referenceData),
      publicPath: type === 'STORE' ? `/en/store/${String(merchant.slug)}` : `/en/c/${String(merchant.slug)}/${slug}`,
      headline: experience.headline == null ? null : String(experience.headline),
      description: experience.description == null ? null : String(experience.description),
      primaryCtaLabel: experience.primaryCtaLabel == null ? null : String(experience.primaryCtaLabel),
      startAt: experience.startAt == null ? null : (experience.startAt instanceof Date ? experience.startAt : new Date(String(experience.startAt))).toISOString(),
      endAt: experience.endAt == null ? null : (experience.endAt instanceof Date ? experience.endAt : new Date(String(experience.endAt))).toISOString(),
      selectedFrames,
      readiness: experienceReadiness(selectedFrames),
      lastOperation: latestOperationByResource.get(String(experience.id)) ?? null,
      policy: {
        objective: policy?.objective ?? null,
        gate: policy?.gate ?? null,
        presentation: resolvePresentationMode({ experienceType: type, persistedPresentationMode: experience.presentationMode == null ? null : String(experience.presentationMode) as PresentationMode }),
      },
      updatedAt: (experience.updatedAt instanceof Date ? experience.updatedAt : new Date(String(experience.updatedAt))).toISOString(),
    }
  })

  const currentInsights = buildCommerceIntelligence({
    experiences: mapped.map(({ id, type, name, status, referenceData }) => ({ id, type, name, status, referenceData })),
    sessions: currentWindow[0].map((session) => ({ id: String(session.id), experienceId: session.experienceId == null ? null : String(session.experienceId), source: session.source == null ? null : String(session.source), medium: session.medium == null ? null : String(session.medium), referrer: session.referrer == null ? null : String(session.referrer), aiAgentSource: session.aiAgentSource == null ? null : String(session.aiAgentSource) })),
    events: currentWindow[1].map((event) => ({ merchantSessionId: event.merchantSessionId == null ? null : String(event.merchantSessionId), experienceId: event.experienceId == null ? null : String(event.experienceId), merchantFrameId: event.merchantFrameId == null ? null : String(event.merchantFrameId), type: String(event.type), count: Number(event.count ?? 0) })),
    intents: currentWindow[2].map((intent) => ({ merchantSessionId: String(intent.merchantSessionId), experienceId: intent.experienceId == null ? null : String(intent.experienceId), type: String(intent.type), count: Number(intent.count ?? 0) })),
    from: currentFrom,
    to,
  })
  const previousInsights = buildCommerceIntelligence({
    experiences: mapped.map(({ id, type, name, status, referenceData }) => ({ id, type, name, status, referenceData })),
    sessions: previousWindow[0].map((session) => ({ id: String(session.id), experienceId: session.experienceId == null ? null : String(session.experienceId), source: session.source == null ? null : String(session.source), medium: session.medium == null ? null : String(session.medium), referrer: session.referrer == null ? null : String(session.referrer), aiAgentSource: session.aiAgentSource == null ? null : String(session.aiAgentSource) })),
    events: previousWindow[1].map((event) => ({ merchantSessionId: event.merchantSessionId == null ? null : String(event.merchantSessionId), experienceId: event.experienceId == null ? null : String(event.experienceId), merchantFrameId: event.merchantFrameId == null ? null : String(event.merchantFrameId), type: String(event.type), count: Number(event.count ?? 0) })),
    intents: previousWindow[2].map((intent) => ({ merchantSessionId: String(intent.merchantSessionId), experienceId: intent.experienceId == null ? null : String(intent.experienceId), type: String(intent.type), count: Number(intent.count ?? 0) })),
    from: previousFrom,
    to: currentFrom,
  })
  const currentMetricValues = currentInsights.totals satisfies MerchantCommerceMetricValues
  const previousMetricValues = previousInsights.totals satisfies MerchantCommerceMetricValues
  const comparison = buildMerchantCommerceComparison({ current: currentMetricValues, previous: previousMetricValues, previousPeriod: { from: previousFrom.toISOString(), to: currentFrom.toISOString(), timezone: 'UTC' } })
  const experiencePerformance = buildMerchantExperiencePerformance(currentInsights.experiences.map((experience) => ({ id: experience.id, name: experience.name, type: experience.type, visitors: experience.visitors, engagedShoppers: experience.engagedShoppers, tryOnCompletions: experience.tryOnCompletions, productClicks: experience.productClicks, highIntentShoppers: experience.highIntentShoppers })))
  const sourceHighlights = buildMerchantSourceHighlights((currentInsights.distributionReport?.sources ?? []).map((source) => ({ source: MERCHANT_DISTRIBUTION_SOURCE_LABELS[source.sourceClass], visitors: source.visitors, productClicks: source.productClicks, inquiries: source.inquiries, highIntentShoppers: source.highIntentShoppers })))
  const experienceNames = new Map(mapped.map((experience) => [experience.id, experience.name]))
  const interpretation = buildMerchantCommerceInterpretation({ current: currentMetricValues, comparison, experiences: experiencePerformance, sources: sourceHighlights, experienceNames })
  const commerceIntelligence: MerchantCommerceIntelligence = { ...currentInsights, comparison, experiencePerformance, sourceHighlights, interpretation }

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
    catalog: catalogSummary(catalogRows as CatalogRow[]),
    activeCampaignCount: mapped.filter((experience) => experience.type === 'CAMPAIGN' && experience.status === 'ACTIVE').length,
    shopperActivityAvailable: commerceIntelligence.hasActivity,
    credentialUsage: { active: Number(credentialCount[0]?.count ?? 0) },
    commerceIntelligence,
  }
}
