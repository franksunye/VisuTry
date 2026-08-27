jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async <T>(input: { mutation: () => Promise<T> }) => input.mutation()),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access-cloudflare'
import { createMerchantStore, importMerchantFrames, publishMerchantStore, setMerchantStoreFrames } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { createCampaignDraft, previewCampaign, publishCampaign, archiveCampaign, setCampaignFrames } from '@/modules/store/application/campaign-service-cloudflare'
import type { MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'

type SqlMock = jest.Mock & { transaction: jest.Mock; unsafe: jest.Mock }

function sqlMock(results: unknown[][], transactions: unknown[][][] = []): SqlMock {
  const sql = jest.fn(() => Promise.resolve(results.shift() ?? [])) as SqlMock
  sql.unsafe = jest.fn((value: string) => value)
  sql.transaction = jest.fn(() => Promise.resolve(transactions.shift() ?? []))
  return sql
}

const actor = {
  actorType: 'AGENT_CREDENTIAL' as const,
  actorId: 'credential-a',
  merchantId: 'merchant-a',
  scopes: ['merchant:read', 'experience:read', 'experience:write'] as MerchantAgentScope[],
}

const activeFrame = { id: 'frame-a', sku: null, externalId: 'shopify:product-1', productUrl: 'https://shop.example.test/products/frame-a', name: 'Frame A', imageUrl: 'https://example.test/frame-a.png', shape: 'oval', widthClass: null, source: 'EXTERNAL', enrichmentStatus: 'APPROVED', status: 'ACTIVE' }

describe('Cloudflare direct-Neon merchant and experience writes', () => {
  afterEach(() => jest.clearAllMocks())

  it('creates one Store DRAFT idempotently inside a Serializable transaction', async () => {
    const sql = sqlMock([
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
      [],
      [],
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Merchant A Store', status: 'DRAFT' }],
      [],
    ], [[[/* existing */], [{ id: 'store-a' }], [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Merchant A Store', status: 'DRAFT' }]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantStore({ actor })

    expect(result).toMatchObject({ id: 'store-a', status: 'DRAFT', created: true })
    expect(sql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
  })

  it('rejects Store frame replacement when the Store belongs to another merchant', async () => {
    const sql = sqlMock([[]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(setMerchantStoreFrames({ actor, storeId: 'store-other', frameIds: ['frame-a'] })).rejects.toBeInstanceOf(MerchantAccessError)
    expect(sql.transaction).not.toHaveBeenCalled()
  })

  it('replaces Store frames in one tenant-scoped Serializable transaction', async () => {
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'DRAFT' }],
      [{ merchantFrameId: 'old-frame', sortOrder: 0, id: 'old-frame', sku: 'old', name: 'Old', imageUrl: 'https://example.test/old.png', shape: 'oval', widthClass: null, status: 'ACTIVE' }],
      [activeFrame],
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
    ], [[], []])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await setMerchantStoreFrames({ actor, storeId: 'store-a', frameIds: ['frame-a'] })

    expect(result).toEqual({ storeId: 'store-a', frameIds: ['frame-a'], frameCount: 1 })
    expect(sql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
    expect(sql.mock.calls.map((call) => call[0]?.join?.('') ?? '').some((query) => query.includes('"experienceId"'))).toBe(true)
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: null },
    }))
  })

  it('creates a Campaign DRAFT and keeps the merchant boundary in every read', async () => {
    const campaignRow = { id: 'campaign-a', merchantId: 'merchant-a', slug: 'spring-edit', name: 'Spring Edit', status: 'DRAFT', headline: 'Try the edit', description: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null, secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, startAt: null, endAt: null, campaignObjective: 'INTENT', campaignGate: 'NONE', presentationMode: 'EDITORIAL_FIRST', referenceData: false, merchantFrameId: null }
    const sql = sqlMock([
      [{ slug: 'merchant-a', referenceData: false }],
      [{ id: 'campaign-a' }],
      [{ slug: 'merchant-a', referenceData: false }],
      [campaignRow],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createCampaignDraft({ merchantId: 'merchant-a', name: 'Spring Edit', headline: 'Try the edit' })

    expect(result).toMatchObject({ id: 'campaign-a', merchantId: 'merchant-a', status: 'DRAFT', slug: 'spring-edit' })
    expect(sql.mock.calls.some((call) => call[0].join('').includes('e."merchantId"'))).toBe(true)
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'spring-edit' },
    }))
  })

  it('uses a Serializable replacement for Campaign frames and publishes only when approved and ready', async () => {
    const campaignRow = {
      id: 'campaign-a', merchantId: 'merchant-a', slug: 'spring-edit', name: 'Spring Edit', status: 'DRAFT',
      headline: 'Try the edit', description: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
      secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, startAt: null, endAt: null,
      campaignObjective: 'INTENT', campaignGate: 'NONE', presentationMode: 'EDITORIAL_FIRST', referenceData: false,
      merchantFrameId: 'frame-a', frameId: 'frame-a', sku: null, frameExternalId: 'shopify:product-1', frameProductUrl: 'https://shop.example.test/products/frame-a', frameName: 'Frame A', frameImageUrl: 'https://example.test/frame-a.png',
      frameShape: 'oval', frameWidthClass: null, frameSource: 'EXTERNAL', frameEnrichmentStatus: 'APPROVED', frameStatus: 'ACTIVE',
    }
    const sql = sqlMock([
      [{ slug: 'merchant-a', referenceData: false }], [campaignRow], [activeFrame],
    ], [[]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await setCampaignFrames({ merchantId: 'merchant-a', campaignId: 'campaign-a', frameIds: ['frame-a'] })
    expect(result).toEqual({ frameIds: ['frame-a'] })
    expect(sql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: 'spring-edit' },
    }))

    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: false })).rejects.toMatchObject({ code: 'PUBLISH_APPROVAL_REQUIRED' })

    const publishSql = sqlMock([
      [{ id: 'merchant-a', slug: 'merchant-a', referenceData: false }], [campaignRow],
      [{ id: 'campaign-a' }],
      [{ id: 'merchant-a', slug: 'merchant-a', referenceData: false }], [{ ...campaignRow, status: 'ACTIVE' }],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(publishSql)
    const published = await publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })
    expect(published.status).toBe('ACTIVE')
    expect(publishSql.mock.calls.some((call) => String(call[0]?.join?.('') ?? '').includes('UPDATE "Experience"'))).toBe(true)

    const archiveSql = sqlMock([
      [{ id: 'merchant-a', slug: 'merchant-a', referenceData: false }], [{ ...campaignRow, status: 'ACTIVE' }],
      [{ id: 'campaign-a' }],
      [{ id: 'merchant-a', slug: 'merchant-a', referenceData: false }], [{ ...campaignRow, status: 'ARCHIVED' }],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(archiveSql)
    const archived = await archiveCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a' })
    expect(archived.status).toBe('ARCHIVED')
  })

  it('accepts the same stable external identity without a merchant SKU for Campaign readiness', async () => {
    const campaignRow = {
      id: 'campaign-a', merchantId: 'merchant-a', slug: 'spring-edit', name: 'Spring Edit', status: 'DRAFT',
      headline: 'Try the edit', description: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
      secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, startAt: null, endAt: null,
      campaignObjective: 'INTENT', campaignGate: 'NONE', presentationMode: 'EDITORIAL_FIRST', referenceData: false,
      merchantFrameId: 'frame-a', frameId: 'frame-a', sku: null, frameExternalId: 'shopify:product-1', frameProductUrl: 'https://shop.example.test/products/frame-a', frameName: 'Frame A', frameImageUrl: 'https://example.test/frame-a.png',
      frameShape: 'oval', frameWidthClass: null, frameSource: 'EXTERNAL', frameEnrichmentStatus: 'APPROVED', frameStatus: 'ACTIVE',
    }
    const sql = sqlMock([[{ id: 'merchant-a', slug: 'merchant-a', referenceData: false }], [campaignRow]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await previewCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a' })

    expect(result.readiness.ready).toBe(true)
    expect(result.readiness.blockingIssues).toEqual([])
  })

  it('returns the same structured Campaign limit decision for a full Launch plan', async () => {
    const campaignRow = {
      id: 'campaign-a', merchantId: 'merchant-a', slug: 'spring-edit', name: 'Spring Edit', status: 'DRAFT',
      headline: 'Try the edit', description: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
      secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, startAt: null, endAt: null,
      campaignObjective: 'INTENT', campaignGate: 'NONE', presentationMode: 'EDITORIAL_FIRST', referenceData: false,
      merchantFrameId: 'frame-a', frameId: 'frame-a', sku: null, frameExternalId: 'shopify:product-1', frameProductUrl: 'https://shop.example.test/products/frame-a', frameName: 'Frame A', frameImageUrl: 'https://example.test/frame-a.png',
      frameShape: 'oval', frameWidthClass: null, frameSource: 'EXTERNAL', frameEnrichmentStatus: 'APPROVED', frameStatus: 'ACTIVE',
    }
    const sql = sqlMock([
      [{ id: 'merchant-a', slug: 'merchant-a', referenceData: false, planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE' }],
      [campaignRow],
      [{ count: 1 }],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })).rejects.toMatchObject({ code: 'CAMPAIGN_LIMIT_REACHED', httpStatus: 409 })
    expect(sql.mock.calls.some((call) => String(call[0]?.join?.('') ?? '').includes('UPDATE "Experience"'))).toBe(false)
  })

  it('requires approval and publishes a ready Store through the direct-Neon boundary', async () => {
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'DRAFT' }],
      [{ merchantFrameId: 'frame-a', sortOrder: 0, id: 'frame-a', sku: 'sku-a', name: 'Frame A', imageUrl: 'https://example.test/frame-a.png', shape: 'oval', widthClass: null, status: 'ACTIVE' }],
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
      [activeFrame],
      [{ id: 'store-a', status: 'ACTIVE' }],
    ], [[], []])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(publishMerchantStore({ actor, storeId: 'store-a', approved: false })).rejects.toMatchObject({ code: 'PUBLISH_APPROVAL_REQUIRED' })
    const result = await publishMerchantStore({ actor, storeId: 'store-a', approved: true })
    expect(result).toEqual({ id: 'store-a', status: 'ACTIVE', publicPath: '/en/store/merchant-a', approvalRecorded: true })
    expect(sql.mock.calls.some((call) => call[0].join('').includes('UPDATE "Experience"'))).toBe(true)
  })

  it('persists PENDING enrichment for an importable frame without shape', async () => {
    const calls: Array<{ values: unknown[] }> = []
    const sql = jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
      calls.push({ values })
      return Promise.resolve([])
    }) as SqlMock
    sql.transaction = jest.fn(() => Promise.resolve([[{ id: 'frame-url', created: true }]]))
    sql.unsafe = jest.fn((value: string) => value)
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await importMerchantFrames({
      actor: { ...actor, scopes: ['catalog:write'] },
      frames: [{
        sku: null,
        name: 'URL Identified Frame',
        imageUrl: 'https://cdn.example.test/url-only.jpg',
        productUrl: 'https://catalog.example.test/products/url-only',
        source: 'EXTERNAL',
        shape: null,
      }],
    })

    expect(result).toMatchObject({ imported: 1, created: 1 })
    expect(calls.some(({ values }) => values.includes('PENDING'))).toBe(true)
  })
})
