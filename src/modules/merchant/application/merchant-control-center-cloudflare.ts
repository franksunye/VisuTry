import { getCloudflareSql } from '@/data/neon-cloudflare'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { campaignReadinessForControlCenter, evaluateCampaignReadiness } from '@/modules/store/domain/campaign-readiness'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import type { MerchantDistributionReport } from '@/modules/store/domain/merchant-distribution-report'
import { resolveAnalyticsPeriod } from '@/modules/store/application/merchant-analytics-compute'
import { validateMerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import type { MerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import { buildMerchantCommerceIntelligence, type MerchantCommerceActivity } from './merchant-commerce-intelligence'
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

type CatalogRow = {
  id: unknown
  sku: unknown
  externalId: unknown
  productUrl: unknown
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
    externalId: row.externalId == null ? null : String(row.externalId),
    productUrl: row.productUrl == null ? null : String(row.productUrl),
    name: String(row.name ?? ''),
    brand: row.brand == null ? null : String(row.brand),
    imageUrl: row.imageUrl == null ? null : String(row.imageUrl),
    shape: String(row.shape ?? ''),
    widthClass: row.widthClass == null ? null : String(row.widthClass),
    source: String(row.source ?? 'UNKNOWN'),
    enrichmentStatus: String(row.enrichmentStatus ?? 'UNKNOWN'),
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
    validation: validateMerchantFrameReadiness(frame),
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
  if (action === 'campaign.archived') return 'Archived'
  if (action === 'campaign.updated') return 'Updated'
  return null
}

function operationActor(actorType: unknown): string {
  if (actorType === 'HUMAN') return 'Human'
  if (actorType === 'AGENT') return 'Agent'
  return 'System'
}

function toActivity(
  experiences: Array<{ id: string; type: 'STORE' | 'CAMPAIGN'; name: string; status: string; referenceData: boolean }>,
  sessions: unknown[],
  events: unknown[],
  intents: unknown[],
): MerchantCommerceActivity {
  return {
    experiences,
    sessions: sessions.map((session) => {
      const row = session as Record<string, unknown>
      return {
        id: String(row.id),
        experienceId: row.experienceId == null ? null : String(row.experienceId),
        source: row.source == null ? null : String(row.source),
        medium: row.medium == null ? null : String(row.medium),
        referrer: row.referrer == null ? null : String(row.referrer),
        aiAgentSource: row.aiAgentSource == null ? null : String(row.aiAgentSource),
      }
    }),
    events: events.map((event) => {
      const row = event as Record<string, unknown>
      return {
        merchantSessionId: row.merchantSessionId == null ? null : String(row.merchantSessionId),
        experienceId: row.experienceId == null ? null : String(row.experienceId),
        merchantFrameId: row.merchantFrameId == null ? null : String(row.merchantFrameId),
        type: String(row.type),
        count: Number(row.count ?? 0),
      }
    }),
    intents: intents.map((intent) => {
      const row = intent as Record<string, unknown>
      return {
        merchantSessionId: String(row.merchantSessionId),
        experienceId: row.experienceId == null ? null : String(row.experienceId),
        merchantFrameId: row.merchantFrameId == null ? null : String(row.merchantFrameId),
        type: String(row.type),
        count: Number(row.count ?? 0),
      }
    }),
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

  const currentPeriod = resolveAnalyticsPeriod({})
  const windowMs = currentPeriod.to.getTime() - currentPeriod.from.getTime()
  const previousPeriod = { from: new Date(currentPeriod.from.getTime() - windowMs), to: currentPeriod.from }
  const loadWindow = (from: Date, until: Date) => Promise.all([
    sql`SELECT "id", "experienceId", "source", "medium", "referrer", "aiAgentSource" FROM "MerchantSession" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} ORDER BY "createdAt" DESC`,
    sql`SELECT "merchantSessionId", "experienceId", "merchantFrameId", "type", count(*)::int AS "count" FROM "MerchantEvent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} GROUP BY "merchantSessionId", "experienceId", "merchantFrameId", "type"`,
    sql`SELECT "merchantSessionId", "experienceId", "type", count(*)::int AS "count" FROM "MerchantIntent" WHERE "merchantId" = ${input.merchantId} AND "createdAt" >= ${from} AND "createdAt" < ${until} GROUP BY "merchantSessionId", "experienceId", "type"`,
  ])
  const [experiences, catalogRows, selectedFrameRows, auditRows, currentWindow, previousWindow, credentialCount] = await Promise.all([
    sql`
      SELECT e."id", e."type", e."name", e."slug", e."status", e."campaignObjective",
        e."campaignGate", e."presentationMode", e."referenceData", e."headline", e."description",
        e."primaryCtaLabel", e."primaryCtaUrl", e."secondaryCtaUrl", e."startAt", e."endAt", e."updatedAt",
        count(ef."merchantFrameId") FILTER (WHERE ef."active" = true)::int AS "frameCount"
      FROM "Experience" e
      LEFT JOIN "ExperienceFrame" ef ON ef."experienceId" = e."id"
      WHERE e."merchantId" = ${input.merchantId}
      GROUP BY e."id"
      ORDER BY e."updatedAt" DESC
    `,
    sql`SELECT "id", "sku", "externalId", "productUrl", "name", "brand", "imageUrl", "shape", "widthClass", "source", "status", "enrichmentStatus" FROM "MerchantFrame" WHERE "merchantId" = ${input.merchantId} ORDER BY "name" ASC`,
    sql`SELECT ef."experienceId", mf."id", mf."sku", mf."externalId", mf."productUrl", mf."name", mf."brand", mf."imageUrl", mf."shape", mf."widthClass", mf."source", mf."status", mf."enrichmentStatus" FROM "ExperienceFrame" ef JOIN "MerchantFrame" mf ON mf."id" = ef."merchantFrameId" AND mf."merchantId" = ef."merchantId" WHERE ef."merchantId" = ${input.merchantId} AND ef."active" = true ORDER BY ef."experienceId", ef."sortOrder" ASC NULLS LAST, ef."createdAt" ASC`,
    sql`SELECT "resourceId", "action", "actorType", "createdAt" FROM "MerchantOperationAudit" WHERE "merchantId" = ${input.merchantId} AND "resourceType" = 'Experience' ORDER BY "createdAt" DESC`,
    loadWindow(currentPeriod.from, currentPeriod.to),
    loadWindow(previousPeriod.from, previousPeriod.to),
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
    const startAt = experience.startAt == null ? null : (experience.startAt instanceof Date ? experience.startAt : new Date(String(experience.startAt)))
    const endAt = experience.endAt == null ? null : (experience.endAt instanceof Date ? experience.endAt : new Date(String(experience.endAt)))
    const readiness = type === 'CAMPAIGN'
      ? campaignReadinessForControlCenter(
        evaluateCampaignReadiness({
          name: String(experience.name),
          headline: experience.headline == null ? null : String(experience.headline),
          status: String(experience.status),
          startAt,
          endAt,
          primaryCtaUrl: experience.primaryCtaUrl == null ? null : String(experience.primaryCtaUrl),
          secondaryCtaUrl: experience.secondaryCtaUrl == null ? null : String(experience.secondaryCtaUrl),
          frames: selectedFrames.map((frame) => ({ status: frame.status, valid: frame.validation.valid })),
        }),
        selectedFrames,
      )
      : experienceReadiness(selectedFrames)
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
      startAt: startAt?.toISOString() ?? null,
      endAt: endAt?.toISOString() ?? null,
      selectedFrames,
      readiness,
      lastOperation: latestOperationByResource.get(String(experience.id)) ?? null,
      policy: {
        objective: policy?.objective ?? null,
        gate: policy?.gate ?? null,
        presentation: resolvePresentationMode({ experienceType: type, persistedPresentationMode: experience.presentationMode == null ? null : String(experience.presentationMode) as PresentationMode }),
      },
      updatedAt: (experience.updatedAt instanceof Date ? experience.updatedAt : new Date(String(experience.updatedAt))).toISOString(),
    }
  })

  const currentInsights = buildMerchantCommerceIntelligence({
    current: toActivity(
      mapped.map(({ id, type, name, status, referenceData }) => ({ id, type, name, status, referenceData })),
      currentWindow[0],
      currentWindow[1],
      currentWindow[2],
    ),
    previous: toActivity(
      mapped.map(({ id, type, name, status, referenceData }) => ({ id, type, name, status, referenceData })),
      previousWindow[0],
      previousWindow[1],
      previousWindow[2],
    ),
    currentPeriod,
    previousPeriod,
  })
  const commerceIntelligence: MerchantCommerceIntelligence = currentInsights

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
