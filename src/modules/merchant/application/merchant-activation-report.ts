import { prisma } from '@/lib/prisma'
import { MERCHANT_ACTIVATION_EVENT, summarizeMerchantActivationEvents, type MerchantActivationEventRecord } from '../domain/merchant-activation'

type ReportInput = {
  from?: Date
  to?: Date
}

export type MerchantActivationReport = {
  cohort: {
    from: string | null
    to: string | null
    workspacesCreated: number
  }
  counts: {
    workspacesReturned: number
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
}

function percentage(count: number, denominator: number): number | null {
  return denominator > 0 ? Number(((count / denominator) * 100).toFixed(1)) : null
}

/**
 * Read-only post-Activation-v1 cohort report. The workspace-created event is
 * the denominator, so pre-instrumentation Merchants are never presented as
 * if they had a newly observed activation journey.
 */
export async function getMerchantActivationReport(input: ReportInput = {}): Promise<MerchantActivationReport> {
  const occurredAt = {
    ...(input.from ? { gte: input.from } : {}),
    ...(input.to ? { lt: input.to } : {}),
  }
  const workspaceEvents = await prisma.merchantActivationEvent.findMany({
    where: {
      eventType: MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED,
      ...(Object.keys(occurredAt).length ? { occurredAt } : {}),
      merchant: { classificationSource: 'SELF_SERVICE_SIGNUP' },
    },
    orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    select: { merchantId: true, occurredAt: true },
  })
  const merchantIds = workspaceEvents.map((event) => event.merchantId)
  if (merchantIds.length === 0) {
    return {
      cohort: { from: input.from?.toISOString() ?? null, to: input.to?.toISOString() ?? null, workspacesCreated: 0 },
      counts: { workspacesReturned: 0, firstItem: 0, catalogReady: 0, storeConfigured: 0, storePreviewed: 0, storePublished: 0, firstShopperSession: 0, commercialIntent: 0, checkoutStarted: 0 },
      rates: { workspaceReturnRate: null, firstItemActivationRate: null, catalogReadyRate: null, storePublishedRate: null },
      averageTimeToFirstItemMs: null,
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
  const times = summaries.map((summary) => summary.timeToFirstItemMs).filter((value): value is number => value != null)
  const workspacesCreated = summaries.length
  const workspacesReturned = count((summary) => summary.returnSessionCount > 0)
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
    cohort: { from: input.from?.toISOString() ?? null, to: input.to?.toISOString() ?? null, workspacesCreated },
    counts: { workspacesReturned, firstItem, catalogReady, storeConfigured, storePreviewed, storePublished, firstShopperSession, commercialIntent, checkoutStarted },
    rates: {
      workspaceReturnRate: percentage(workspacesReturned, workspacesCreated),
      firstItemActivationRate: percentage(firstItem, workspacesCreated),
      catalogReadyRate: percentage(catalogReady, workspacesCreated),
      storePublishedRate: percentage(storePublished, workspacesCreated),
    },
    averageTimeToFirstItemMs: times.length > 0 ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : null,
  }
}
