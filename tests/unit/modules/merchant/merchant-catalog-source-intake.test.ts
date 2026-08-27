/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: { merchantFrame: { findMany: jest.fn() } },
}))
jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn() } }))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/modules/merchant/application/merchant-source-network', () => ({
  MERCHANT_SOURCE_FETCH_TIMEOUT_MS: 3_000,
  MERCHANT_SOURCE_MAX_RESPONSE_BYTES: 512 * 1024,
  MERCHANT_SOURCE_MAX_REDIRECTS: 2,
  MerchantSourceNetworkError: class MerchantSourceNetworkError extends Error {
    readonly code = 'SOURCE_UNREACHABLE'
  },
  fetchMerchantSourceDocument: jest.fn(),
}))

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { recordMerchantAgentOperation } from '@/modules/merchant/application/merchant-agent-credentials'
import { fetchMerchantSourceDocument } from '@/modules/merchant/application/merchant-source-network'
import {
  extractCatalogProductsFromHtml,
  inspectCatalogSource,
} from '@/modules/merchant/application/merchant-catalog-source-intake'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'

const mockFindMany = prisma.merchantFrame.findMany as jest.Mock
const mockFetch = fetchMerchantSourceDocument as jest.Mock
const mockAudit = recordMerchantAgentOperation as jest.Mock
const fixture = (name: string) => readFileSync(resolve(process.cwd(), 'tests/fixtures/merchant-catalog', name), 'utf8')
const actor: AgentMerchantActor = {
  actorType: 'AGENT_CREDENTIAL',
  actorId: 'credential-a',
  merchantId: 'merchant-a',
  scopes: ['catalog:read'],
}

describe('reviewed merchant catalog source intake', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindMany.mockResolvedValue([])
  })

  it('extracts deterministic JSON-LD products without accepting malformed metadata', () => {
    const products = extractCatalogProductsFromHtml(fixture('round-acetate.html'), 'https://catalog.example.test/products/round-acetate')
    expect(products[0]).toMatchObject({ sku: 'VT-ROUND-01', name: 'Round Acetate', shape: 'round', price: 12900, currency: 'usd' })
    expect(extractCatalogProductsFromHtml(fixture('malformed.html'), 'https://catalog.example.test/products/malformed')).toEqual([])
  })

  it('inspects a bounded collection, normalizes candidates, and returns a proposal without catalog writes', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.endsWith('/collection')) return { url, status: 200, contentType: 'text/html', body: fixture('collection.html') }
      if (url.endsWith('/round-acetate')) return { url, status: 200, contentType: 'text/html', body: fixture('round-acetate.html') }
      return { url, status: 200, contentType: 'text/html', body: fixture('wayfarer-black.html') }
    })

    const result = await inspectCatalogSource({ actor, sourceUrls: ['https://catalog.example.test/collection'] })

    expect(result.writePerformed).toBe(false)
    expect(result.requiresApproval).toBe(true)
    expect(result.sourceSummary).toMatchObject({ foundCount: 2, readyToImport: 2, needsReview: 0, invalid: 0, fetchedPageCount: 3 })
    expect(result.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ sku: 'VT-ROUND-01', status: 'READY', dedupeStatus: 'NEW' }),
      expect.objectContaining({ sku: 'VT-WAY-02', status: 'READY', dedupeStatus: 'NEW' }),
    ]))
    expect(result.importReady).toHaveLength(2)
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { merchantId: 'merchant-a' } }))
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'catalog.source_inspected', resourceType: 'CatalogSource' }))
    expect(logger.info).toHaveBeenCalledWith('store', 'Merchant catalog source inspected', expect.objectContaining({ candidateCount: 2, importReadyCount: 2 }))
  })

  it('marks missing fields for review and detects existing and proposal duplicates', async () => {
    mockFetch.mockResolvedValue({ url: 'https://catalog.example.test/products/review', status: 200, contentType: 'text/html', body: fixture('missing-fields.html') })
    mockFindMany.mockResolvedValue([{ id: 'frame-a', sku: 'VT-EXISTING', productUrl: 'https://catalog.example.test/products/existing' }])

    const result = await inspectCatalogSource({
      actor,
      sourceUrls: ['https://catalog.example.test/products/review'],
      manualProducts: [
        { sku: 'VT-EXISTING', name: 'Existing', shape: 'round', imageUrl: 'https://cdn.example.test/existing.jpg', productUrl: 'https://catalog.example.test/products/existing' },
        { sku: 'VT-NEW', name: 'New', shape: 'round', imageUrl: 'https://cdn.example.test/new.jpg', productUrl: 'https://catalog.example.test/products/new' },
        { sku: 'VT-NEW', name: 'New duplicate', shape: 'round', imageUrl: 'https://cdn.example.test/new-2.jpg', productUrl: 'https://catalog.example.test/products/new-2' },
      ],
    })

    expect(result.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Needs Catalog Review', readiness: 'IMPORT_READY', importReady: true, recommendationReady: false, recommendationIssues: ['MISSING_SHAPE'] }),
      expect.objectContaining({ sku: 'VT-EXISTING', dedupeStatus: 'ALREADY_EXISTS', status: 'NEEDS_REVIEW' }),
      expect.objectContaining({ sku: 'VT-NEW', dedupeStatus: 'POSSIBLE_DUPLICATE', status: 'NEEDS_REVIEW' }),
    ]))
    expect(result.importReady).toHaveLength(2)
  })

  it('supports a small manual product set through the same proposal pipeline', async () => {
    const result = await inspectCatalogSource({
      actor,
      manualProducts: [{ sku: 'MANUAL-01', name: 'Manual Frame', shape: 'oval', imageUrl: 'https://cdn.example.test/manual.jpg' }],
    })

    expect(result.importReady).toEqual([expect.objectContaining({ sku: 'MANUAL-01', source: 'MANUAL', shape: 'oval' })])
    expect(result.proposal).toBe(true)
    expect(result.writePerformed).toBe(false)
  })

  it('reports unsafe or unreachable sources as actionable source issues', async () => {
    mockFetch.mockRejectedValue({ code: 'UNSAFE_SOURCE_URL', message: 'Local source is not allowed.' })

    const result = await inspectCatalogSource({ actor, sourceUrls: ['http://127.0.0.1/products/a'] })

    expect(result.sourceSummary.sourceIssues).toEqual([{ sourceUrl: 'http://127.0.0.1/products/a', code: 'UNSAFE_SOURCE_URL', message: 'Local source is not allowed.' }])
    expect(result.candidates).toEqual([])
    expect(result.writePerformed).toBe(false)
  })

  it('reports non-product and unsupported content without guessing catalog facts', async () => {
    mockFetch.mockResolvedValue({ url: 'https://catalog.example.test/about', status: 200, contentType: 'text/html', body: '<html><body>About the brand</body></html>' })
    const nonProduct = await inspectCatalogSource({ actor, sourceUrls: ['https://catalog.example.test/about'] })
    expect(nonProduct.sourceSummary.sourceIssues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'NO_PRODUCTS_FOUND' })]))

    mockFetch.mockResolvedValue({ url: 'https://catalog.example.test/catalog.pdf', status: 200, contentType: 'application/pdf', body: '%PDF' })
    const unsupported = await inspectCatalogSource({ actor, sourceUrls: ['https://catalog.example.test/catalog.pdf'] })
    expect(unsupported.sourceSummary.sourceIssues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'UNSUPPORTED_SOURCE' })]))
    expect(unsupported.candidates).toEqual([])
  })

  it('requires catalog read scope and derives the tenant from the actor', async () => {
    await expect(inspectCatalogSource({ actor: { ...actor, scopes: [] }, manualProducts: [] })).rejects.toThrow()
    await inspectCatalogSource({ actor, manualProducts: [{ sku: 'TENANT-01', name: 'Tenant Frame', shape: 'round', imageUrl: 'https://cdn.example.test/tenant.jpg' }] })
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { merchantId: 'merchant-a' } }))
  })
})
