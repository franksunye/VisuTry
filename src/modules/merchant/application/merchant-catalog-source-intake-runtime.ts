import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireAgentScope, type MerchantActorContext } from '../domain/actor'
import { recordMerchantAgentOperation } from './merchant-agent-credentials'
import { fetchMerchantSourceDocument, MERCHANT_SOURCE_MAX_REDIRECTS, MERCHANT_SOURCE_MAX_RESPONSE_BYTES, MERCHANT_SOURCE_FETCH_TIMEOUT_MS } from './merchant-source-network'
import type { CatalogFrameInput } from './merchant-onboarding'
import { inspectCatalogUrlProgressively } from './merchant-catalog-url-progressive'
import {
  buildCatalogInspectionProposal,
  MAX_CSV_BYTES,
  MAX_CSV_ROWS,
  MAX_HUMAN_URL_PRODUCTS,
  MAX_SOURCE_PRODUCTS,
  MerchantSourceIntakeError,
  parseCatalogCsv,
} from './merchant-catalog-source-shared'

export async function inspectHumanMerchantCatalogSource(input: {
  actor: MerchantActorContext
  sourceUrls?: string[]
  manualProducts?: CatalogFrameInput[]
  csvText?: string
}) {
  requireAgentScope(input.actor, 'catalog:read')
  if (input.csvText !== undefined && ((input.sourceUrls?.length ?? 0) > 0 || (input.manualProducts?.length ?? 0) > 0)) throw new MerchantSourceIntakeError('INVALID_SOURCE', 'Choose one catalog source at a time.')
  let manualProducts = input.manualProducts
  let initialSourceIssues: Array<{ sourceUrl: string; code: string; message: string }> = []
  let maxProducts = input.sourceUrls?.length ? MAX_HUMAN_URL_PRODUCTS : MAX_SOURCE_PRODUCTS
  if (input.csvText !== undefined) {
    if (new TextEncoder().encode(input.csvText).byteLength > MAX_CSV_BYTES) throw new MerchantSourceIntakeError('CSV_TOO_LARGE', 'CSV files must be smaller than 2 MB.')
    const parsed = parseCatalogCsv(input.csvText)
    manualProducts = parsed.products
    maxProducts = MAX_CSV_ROWS
    initialSourceIssues = parsed.issues.map((issue) => ({ sourceUrl: 'csv://merchant-upload', code: issue.code, message: `Row ${issue.row}: ${issue.message}` }))
  }
  const existing = await prisma.merchantFrame.findMany({
    where: { merchantId: input.actor.merchantId },
    select: { id: true, sku: true, productUrl: true },
  })
  const fetchSource = async (target: string) => fetchMerchantSourceDocument(target, {
    timeoutMs: MERCHANT_SOURCE_FETCH_TIMEOUT_MS,
    maxBytes: MERCHANT_SOURCE_MAX_RESPONSE_BYTES,
    maxRedirects: MERCHANT_SOURCE_MAX_REDIRECTS,
  })
  const result = await buildCatalogInspectionProposal({
    sourceUrls: input.sourceUrls,
    manualProducts,
    existing,
    fetchSource,
    inspectSource: (sourceUrl, remaining) => inspectCatalogUrlProgressively({ sourceUrl, maxProducts: remaining, fetchSource }),
    maxProducts,
    initialSourceIssues,
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'catalog.source_inspected', resourceType: 'CatalogSource', result: 'SUCCESS' })
  logger.info('store', 'Human merchant catalog source inspected', {
    merchantId: input.actor.merchantId,
    actorId: input.actor.actorId,
    sourceHostnames: result.sourceSummary.sourceHostnames,
    platforms: result.sourceSummary.platforms,
    candidateCount: result.sourceSummary.foundCount,
    importReadyCount: result.sourceSummary.readyToImport,
    result: 'SUCCESS',
  })
  return result
}
