import { prisma } from '@/lib/prisma'
import { MERCHANT_ACTIVATION_EVENT, summarizeMerchantActivationEvents, type MerchantActivationEventRecord } from '../domain/merchant-activation'

type ReportInput = {
  from?: Date
  to?: Date
}

const FIRST_VALUE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

type FirstValueCohortSegment = {
  maturedWorkspaces: number
  achievedWithin7Days: number
  rate: number | null
}

export type MerchantFirstValue7DayReport = {
  windowDays: 7
  asOf: string
  maturedWorkspaces: number
  pendingWorkspaces: number
  achievedWithin7Days: number
  rate: number | null
  medianTimeToPreviewMs: number | null
  p90TimeToPreviewMs: number | null
  confirmedReal: FirstValueCohortSegment
  possibleExternal: FirstValueCohortSegment
}

export type MerchantActivationReport = {
  cohort: {
    from: string | null
    to: string | null
    candidateWorkspacesCreated: number
    confirmedRealWorkspacesCreated: number
    possibleExternalCandidates: number
  }
  counts: {
    workspacesReturned: number
    catalogInspectionAttempted: number
    catalogInspectionReady: number
    catalogInspectionEmpty: number
    catalogInspectionFailed: number
    firstItem: number
    catalogReady: number
    storeConfigured: number
    storePreviewed: number
    storePublished: number
    firstShopperSession: number
    commercialIntent: number
    checkoutStarted: number
  }
  rates: {
    workspaceReturnRate: number | null
    firstItemActivationRate: number | null
    catalogReadyRate: number | null
    storePublishedRate: number | null
  }
  averageTimeToFirstItemMs: number | null
  firstValue7Day: MerchantFirstValue7DayReport
}

function percentage(count: number, denominator: number): number | null {
  return denominator > 0 ? Number(((count / denominator) * 100).toFixed(1)) : null
}

function percentile(sorted: number[], rank: number): number | null {
  if (sorted.length === 0) return null
  return sorted[Math.max(0, Math.ceil(rank * sorted.length) - 1)]
}

/**
 * Only fully observed, mature signup cohorts enter the 7-day denominator.
 * The preview event is client-observed telemetry, not an independent proof
 * of server Store readiness, and POSSIBLE_EXTERNAL is never called REAL.
 */
function buildFirstValue7DayReport(input: {
  asOf: Date
  merchantIds: string[]
  createdAtByMerchant: Map<string, Date>
  classificationByMerchant: Map<string, 'REAL' | 'POSSIBLE_EXTERNAL'>
  byMerchant: Map<string, MerchantActivationEventRecord[]>
}): MerchantFirstValue7DayReport {
  const segments = {
    REAL: { maturedWorkspaces: 0, achievedWithin7Days: 0 },
    POSSIBLE_EXTERNAL: { maturedWorkspaces: 0, achievedWithin7Days: 0 },
  }
  const durations: number[] = []
  let pendingWorkspaces = 0
  const now = input.asOf.getTime()
  for (const merchantId of input.merchantIds) {
    const created = input.createdAtByMerchant.get(merchantId)
    const classification = input.classificationByMerchant.get(merchantId)
    if (!created || !classification) continue
    const start = created.getTime()
    if (now - start < FIRST_VALUE_WINDOW_MS) {
      pendingWorkspaces += 1
      continue
    }
    const segment = segments[classification]
    segment.maturedWorkspaces += 1
    const preview = input.byMerchant.get(merchantId)?.find((event) =>
      event.eventType === MERCHANT_ACTIVATION_EVENT.STORE_PREVIEWED &&
      event.occurredAt.getTime() >= start &&
      event.occurredAt.getTime() <= start + FIRST_VALUE_WINDOW_MS &&
      event.occurredAt.getTime() <= now)
    if (preview) {
      segment.achievedWithin7Days += 1
      durations.push(preview.occurredAt.getTime() - start)
    }
  }
  durations.sort((left, right) => left - right)
  const maturedWorkspaces = segments.REAL.maturedWorkspaces + segments.POSSIBLE_EXTERNAL.maturedWorkspaces
  const achievedWithin7Days = segments.REAL.achievedWithin7Days + segments.POSSIBLE_EXTERNAL.achievedWithin7Days
  const midpoint = Math.floor(durations.length / 2)
  const medianTimeToPreviewMs = durations.length === 0 ? null : durations.length % 2 === 1
    ? durations[midpoint]
    : Math.round((durations[midpoint - 1] + durations[midpoint]) / 2)
  const segmentReport = (segment: typeof segments.REAL): FirstValueCohortSegment => ({
    ...segment, rate: percentage(segment.achievedWithin7Days, segment.maturedWorkspaces),
  })
  return {
    windowDays: 7,
    asOf: input.asOf.toISOString(),
    maturedWorkspaces,
    pendingWorkspaces,
    achievedWithin7Days,
    rate: percentage(achievedWithin7Days, maturedWorkspaces),
    medianTimeToPreviewMs,
    p90TimeToPreviewMs: percentile(durations, 0.9),
    confirmedReal: segmentReport(segments.REAL),
    possibleExternal: segmentReport(segments.POSSIBLE_EXTERNAL),
  }
}

/**
 * Read-only post-Activation-v1 cohort report. The workspace-created event is
 * the denominator, so pre-instrumentation Merchants are never presented as
 * if they had a newly observed activation journey. Only explicitly classified
 * self-service workspaces without reference data enter the operating cohort;
 * TEST, INTERNAL, REFERENCE, AUTOMATION, SUSPICIOUS, and UNKNOWN fail closed.
 */
export async function getMerchantActivationReport(input: ReportInput = {}): Promise<MerchantActivationReport> {
  const asOf = new Date()
  const occurredAt = {
    ...(input.from ? { gte: input.from } : {}),
    ...(input.to ? { lt: input.to } : {}),
  }
  const workspaceEvents = await prisma.merchantActivationEvent.findMany({
    where: {
      eventType: MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED,
      ...(Object.keys(occurredAt).length ? { occurredAt } : {}),
      merchant: {
        classificationSource: 'SELF_SERVICE_SIGNUP',
        classification: { in: ['REAL', 'POSSIBLE_EXTERNAL'] },
        referenceData: false,
      },
    },
    orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    select: { merchantId: true, occurredAt: true, merchant: { select: { classification: true } } },
  })
  const classificationByMerchant = new Map<string, 'REAL' | 'POSSIBLE_EXTERNAL'>()
  const createdAtByMerchant = new Map<string, Date>()
  for (const event of workspaceEvents) {
    const classification = event.merchant.classification
    if (classification === 'REAL' || classification === 'POSSIBLE_EXTERNAL') {
      classificationByMerchant.set(event.merchantId, classification)
      // The first recorded A0 is the cohort anchor even if duplicate rows exist.
      if (!createdAtByMerchant.has(event.merchantId)) createdAtByMerchant.set(event.merchantId, event.occurredAt)
    }
  }
  const merchantIds = [...classificationByMerchant.keys()]
  const confirmedRealWorkspacesCreated = [...classificationByMerchant.values()].filter((classification) => classification === 'REAL').length
  const possibleExternalCandidates = [...classificationByMerchant.values()].filter((classification) => classification === 'POSSIBLE_EXTERNAL').length
  const candidateWorkspacesCreated = merchantIds.length
  if (merchantIds.length === 0) {
    return {
      cohort: { from: input.from?.toISOString() ?? null, to: input.to?.toISOString() ?? null, candidateWorkspacesCreated: 0, confirmedRealWorkspacesCreated: 0, possibleExternalCandidates: 0 },
      counts: { workspacesReturned: 0, catalogInspectionAttempted: 0, catalogInspectionReady: 0, catalogInspectionEmpty: 0, catalogInspectionFailed: 0, firstItem: 0, catalogReady: 0, storeConfigured: 0, storePreviewed: 0, storePublished: 0, firstShopperSession: 0, commercialIntent: 0, checkoutStarted: 0 },
      rates: { workspaceReturnRate: null, firstItemActivationRate: null, catalogReadyRate: null, storePublishedRate: null },
      averageTimeToFirstItemMs: null,
      firstValue7Day: buildFirstValue7DayReport({ asOf, merchantIds: [], createdAtByMerchant, classificationByMerchant, byMerchant: new Map() }),
    }
  }

  const rows = await prisma.merchantActivationEvent.findMany({
    where: { merchantId: { in: merchantIds } },
    orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, merchantId: true, eventType: true, occurredAt: true, source: true, correlationId: true, sessionId: true, dedupeKey: true, metadata: true },
  })
  const byMerchant = new Map<string, MerchantActivationEventRecord[]>()
  for (const row of rows) {
    const events = byMerchant.get(row.merchantId) ?? []
    events.push({
      id: row.id,
      merchantId: row.merchantId,
      eventType: row.eventType as MerchantActivationEventRecord['eventType'],
      occurredAt: row.occurredAt,
      source: row.source as MerchantActivationEventRecord['source'],
      correlationId: row.correlationId,
      sessionId: row.sessionId,
      dedupeKey: row.dedupeKey,
      metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : null,
    })
    byMerchant.set(row.merchantId, events)
  }

  const summaries = merchantIds.map((merchantId) => summarizeMerchantActivationEvents(byMerchant.get(merchantId) ?? []))
  const count = (predicate: (summary: ReturnType<typeof summarizeMerchantActivationEvents>) => boolean) => summaries.filter(predicate).length
  const countMerchantsWithEvent = (eventType: string) => merchantIds.filter((id) => byMerchant.get(id)?.some((event) => event.eventType === eventType)).length
  const times = summaries.map((summary) => summary.timeToFirstItemMs).filter((value): value is number => value != null)
  const workspacesReturned = count((summary) => summary.returnSessionCount > 0)
  const catalogInspectionAttempted = countMerchantsWithEvent(MERCHANT_ACTIVATION_EVENT.CATALOG_INSPECTION_ATTEMPTED)
  const catalogInspectionReady = countMerchantsWithEvent(MERCHANT_ACTIVATION_EVENT.CATALOG_INSPECTION_READY)
  const catalogInspectionEmpty = countMerchantsWithEvent(MERCHANT_ACTIVATION_EVENT.CATALOG_INSPECTION_EMPTY)
  const catalogInspectionFailed = countMerchantsWithEvent(MERCHANT_ACTIVATION_EVENT.CATALOG_INSPECTION_FAILED)
  const firstItem = count((summary) => summary.firstItemAt != null)
  const catalogReady = count((summary) => summary.catalogReadyAt != null)
  const storeConfigured = count((summary) => summary.storeConfiguredAt != null)
  const storePreviewed = count((summary) => summary.storePreviewedAt != null)
  const storePublished = count((summary) => summary.storePublishedAt != null)
  const firstShopperSession = count((summary) => summary.firstShopperSessionAt != null)
  const commercialIntent = count((summary) => summary.commercialIntentAt != null)
  const checkoutStarted = summaries.reduce((total, _summary, index) => {
    const hasCheckout = byMerchant.get(merchantIds[index])?.some((event) => event.eventType === MERCHANT_ACTIVATION_EVENT.CHECKOUT_STARTED) ?? false
    return total + (hasCheckout ? 1 : 0)
  }, 0)

  return {
    cohort: { from: input.from?.toISOString() ?? null, to: input.to?.toISOString() ?? null, candidateWorkspacesCreated, confirmedRealWorkspacesCreated, possibleExternalCandidates },
    counts: { workspacesReturned, catalogInspectionAttempted, catalogInspectionReady, catalogInspectionEmpty, catalogInspectionFailed, firstItem, catalogReady, storeConfigured, storePreviewed, storePublished, firstShopperSession, commercialIntent, checkoutStarted },
    rates: {
      workspaceReturnRate: percentage(workspacesReturned, candidateWorkspacesCreated),
      firstItemActivationRate: percentage(firstItem, candidateWorkspacesCreated),
      catalogReadyRate: percentage(catalogReady, candidateWorkspacesCreated),
      storePublishedRate: percentage(storePublished, candidateWorkspacesCreated),
    },
    averageTimeToFirstItemMs: times.length > 0 ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : null,
    firstValue7Day: buildFirstValue7DayReport({ asOf, merchantIds, createdAtByMerchant, classificationByMerchant, byMerchant }),
  }
}
