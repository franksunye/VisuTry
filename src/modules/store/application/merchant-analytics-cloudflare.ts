import { getCloudflareSql } from '@/data/neon-cloudflare'
import { requireAgentScope, type MerchantActorContext } from '@/modules/merchant/domain/actor'
import { resolveCampaignConversionPolicy } from '../domain/campaign-policy'
import { buildCampaignScorecard } from '../domain/merchant-analytics'
import {
  analyticsPeriodDto,
  computeExperienceAnalytics,
  MerchantAnalyticsError,
  referencedAnalyticsFrameIds,
  resolveAnalyticsPeriod,
  type AnalyticsRangeInput,
} from './merchant-analytics-compute'

export { MerchantAnalyticsError }
export type { AnalyticsRangeInput }

export type MerchantAnalyticsContext = { actor: MerchantActorContext; experienceId: string } & AnalyticsRangeInput

async function loadAnalytics(input: MerchantAnalyticsContext) {
  requireAgentScope(input.actor, 'analytics:read')
  const range = resolveAnalyticsPeriod(input)
  const sql = getCloudflareSql()
  const experienceRows = await sql`
    SELECT e."id", e."merchantId", e."type", e."slug", e."name", e."status", e."campaignObjective", e."campaignGate", e."referenceData",
      m."referenceData" AS "merchantReferenceData"
    FROM "Experience" e JOIN "Merchant" m ON m."id" = e."merchantId"
    WHERE e."id" = ${input.experienceId} AND e."merchantId" = ${input.actor.merchantId} AND e."type" IN ('STORE', 'CAMPAIGN')
    LIMIT 1
  `
  const experience = experienceRows[0]
  if (!experience) throw new MerchantAnalyticsError('EXPERIENCE_NOT_FOUND', 'Experience not found.')
  const [sessions, events, intents] = await Promise.all([
    sql`SELECT "id" FROM "MerchantSession" WHERE "merchantId" = ${input.actor.merchantId} AND "experienceId" = ${input.experienceId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to}`,
    sql`SELECT "merchantSessionId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantEvent" WHERE "merchantId" = ${input.actor.merchantId} AND "experienceId" = ${input.experienceId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to} GROUP BY "merchantSessionId", "merchantFrameId", "type"`,
    sql`SELECT "merchantSessionId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantIntent" WHERE "merchantId" = ${input.actor.merchantId} AND "experienceId" = ${input.experienceId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to} GROUP BY "merchantSessionId", "merchantFrameId", "type"`,
  ])
  const sessionIds = sessions.map((row) => String(row.id))
  const eventRows = events.map((row) => ({
    merchantSessionId: row.merchantSessionId == null ? null : String(row.merchantSessionId),
    merchantFrameId: row.merchantFrameId == null ? null : String(row.merchantFrameId),
    type: String(row.type),
    count: Number(row.count ?? 0),
  }))
  const intentRows = intents.map((row) => ({
    merchantSessionId: String(row.merchantSessionId),
    merchantFrameId: row.merchantFrameId == null ? null : String(row.merchantFrameId),
    type: String(row.type),
    count: Number(row.count ?? 0),
  }))
  const frameIds = referencedAnalyticsFrameIds(eventRows, intentRows)
  const frames = frameIds.length
    ? await sql`SELECT "id", "sku", "name", "imageUrl" FROM "MerchantFrame" WHERE "merchantId" = ${input.actor.merchantId} AND "id" = ANY(${frameIds})`
    : []
  const computed = computeExperienceAnalytics({
    sessionIds,
    events: eventRows,
    intents: intentRows,
    frames: frames.map((frame) => ({
      id: String(frame.id),
      sku: frame.sku == null ? null : String(frame.sku),
      name: frame.name == null ? 'Unknown frame' : String(frame.name),
      imageUrl: frame.imageUrl == null ? null : String(frame.imageUrl),
    })),
  })
  const objective = resolveCampaignConversionPolicy({
    type: String(experience.type),
    campaignObjective: experience.campaignObjective == null ? null : String(experience.campaignObjective),
    campaignGate: experience.campaignGate == null ? null : String(experience.campaignGate),
  } as never)?.objective ?? null
  return {
    experience,
    range,
    computed,
    objective,
    referenceData: Boolean(experience.referenceData) || Boolean(experience.merchantReferenceData),
  }
}

export async function getExperienceAnalyticsSummary(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  return {
    experience: {
      id: String(data.experience.id),
      type: String(data.experience.type) as 'STORE' | 'CAMPAIGN',
      slug: String(data.experience.slug),
      name: String(data.experience.name),
      status: String(data.experience.status),
      objective: data.objective,
      gate: String(data.experience.type) === 'CAMPAIGN' ? String(data.experience.campaignGate ?? 'NONE') : null,
    },
    period: analyticsPeriodDto(data.range),
    referenceData: data.referenceData,
    metrics: data.computed.metrics,
    scorecard: buildCampaignScorecard(data.objective, data.computed.metrics),
  }
}

export async function getExperienceFunnel(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  return {
    experienceId: String(data.experience.id),
    period: analyticsPeriodDto(data.range),
    referenceData: data.referenceData,
    stages: data.computed.funnelStages,
  }
}

export async function getTopFramesByIntent(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  return { experienceId: String(data.experience.id), period: analyticsPeriodDto(data.range), referenceData: data.referenceData, frames: data.computed.topFrames }
}

export async function getMerchantIntentSummary(input: MerchantAnalyticsContext) {
  const data = await loadAnalytics(input)
  return {
    experienceId: String(data.experience.id),
    period: analyticsPeriodDto(data.range),
    referenceData: data.referenceData,
    ...data.computed.intent,
  }
}
