import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireAgentScope, type AgentMerchantActor } from '../domain/actor'
import { recordMerchantAgentOperation } from './merchant-agent-credentials'
import { fetchMerchantSourceDocument, MERCHANT_SOURCE_MAX_REDIRECTS, MERCHANT_SOURCE_MAX_RESPONSE_BYTES, MERCHANT_SOURCE_FETCH_TIMEOUT_MS } from './merchant-source-network'
import type { CatalogFrameInput } from './merchant-onboarding'
import {
  buildCatalogInspectionProposal,
  type CatalogSourceDocument,
} from './merchant-catalog-source-shared'

export * from './merchant-catalog-source-shared'

export async function inspectCatalogSource(input: {
  actor: AgentMerchantActor
  sourceUrls?: string[]
  manualProducts?: CatalogFrameInput[]
}) {
  requireAgentScope(input.actor, 'catalog:read')
  const existing = await prisma.merchantFrame.findMany({
    where: { merchantId: input.actor.merchantId },
    select: { id: true, sku: true, productUrl: true },
  })
  const fetchSource = async (target: string): Promise<CatalogSourceDocument> => fetchMerchantSourceDocument(target, {
    timeoutMs: MERCHANT_SOURCE_FETCH_TIMEOUT_MS,
    maxBytes: MERCHANT_SOURCE_MAX_RESPONSE_BYTES,
    maxRedirects: MERCHANT_SOURCE_MAX_REDIRECTS,
  })
  const result = await buildCatalogInspectionProposal({
    sourceUrls: input.sourceUrls,
    manualProducts: input.manualProducts,
    existing,
    fetchSource,
  })
  await recordMerchantAgentOperation({ actor: input.actor, action: 'catalog.source_inspected', resourceType: 'CatalogSource', result: 'SUCCESS' })
  logger.info('store', 'Merchant catalog source inspected', {
    merchantId: input.actor.merchantId,
    actorId: input.actor.actorId,
    sourceHostnames: result.sourceSummary.sourceHostnames,
    fetchedPageCount: result.sourceSummary.fetchedPageCount,
    candidateCount: result.sourceSummary.foundCount,
    importReadyCount: result.sourceSummary.readyToImport,
    result: 'SUCCESS',
  })
  return result
}

export const merchantCatalogSourceIntake = { inspectCatalogSource }
