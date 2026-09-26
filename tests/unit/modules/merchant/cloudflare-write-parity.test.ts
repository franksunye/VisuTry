jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async <T>(input: { mutation: () => Promise<T> }) => input.mutation()),
}))

jest.mock('@/modules/store/application/public-edge-paths-cloudflare', () => ({
  getPublicEdgeTagsForCloudflareMerchant: jest.fn(async () => []),
}))

jest.mock('@/modules/merchant/application/merchant-agent-credentials-cloudflare', () => ({
  recordMerchantAgentOperation: jest.fn().mockResolvedValue(undefined),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { recordMerchantAgentOperation } from '@/modules/merchant/application/merchant-agent-credentials-cloudflare'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access-cloudflare'
import { createMerchantStore, getMerchantStoreWorkspace, importMerchantFrames, publishMerchantStore, setMerchantStoreFrames, updateMerchantFrame, updateMerchantStore } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { createCampaignDraft, previewCampaign, publishCampaign, archiveCampaign, setCampaignFrames } from '@/modules/store/application/campaign-service-cloudflare'
import type { MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'

type SqlMock = jest.Mock & { transaction: jest.Mock; unsafe: jest.Mock }

function sqlMock(results: unknown[][], transactions: unknown[][][] = []): SqlMock {
  const seenRows: Record<string, unknown>[] = []
  const sql = jest.fn((...args: unknown[]) => {
    const strings = args[0] as TemplateStringsArray | undefined
    const query = strings?.join('') ?? ''
    if (query.includes('FROM "Experience" e JOIN "Merchant" m')) {
      const experienceId = String(args[1] ?? '')
      const merchantId = String(args[2] ?? '')
      const experience = seenRows.find((row) => row.id === experienceId && (!row.merchantId || row.merchantId === merchantId))
      const merchant = seenRows.find((row) => row.id === merchantId && typeof row.slug === 'string')
        ?? seenRows.find((row) => row.slug === merchantId)
      if (!experience || !merchant) return Promise.resolve([])
      return Promise.resolve([{
        id: experience.id,
        slug: experience.slug ?? (experience.type === 'STORE' ? 'store' : ''),
        type: experience.type ?? (experienceId.startsWith('campaign') ? 'CAMPAIGN' : 'STORE'),
        merchantSlug: merchant.slug,
      }])
    }
    const rows = results.shift() ?? []
    seenRows.push(...rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object'))
    return Promise.resolve(rows)
  }) as SqlMock
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

const activeLaunchPeriodStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
const activeLaunchPeriodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000)

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

  it('rejects a newly selected Store-ineligible product with Prisma-parity semantics', async () => {
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'DRAFT' }],
      [],
      [{ ...activeFrame, imageUrl: null }],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(setMerchantStoreFrames({ actor, storeId: 'store-a', frameIds: ['frame-a'] }))
      .rejects.toMatchObject({ code: 'STORE_FRAME_NOT_ELIGIBLE', httpStatus: 409 })

    expect(sql.transaction).not.toHaveBeenCalled()
    expect(withPublicDiscoveryInvalidation).not.toHaveBeenCalled()
    expect(recordMerchantAgentOperation).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'store.frames_updated' }))
  })

  it('allows Store-eligible PENDING shape products and preserves an existing ineligible selection for removal', async () => {
    const pending = { ...activeFrame, id: 'frame-pending', externalId: 'external-pending', productUrl: 'https://shop.example.test/pending', imageUrl: 'https://example.test/pending.png', shape: '', enrichmentStatus: 'PENDING' }
    const previouslySelectedInvalid = { ...activeFrame, id: 'frame-old-invalid', merchantFrameId: 'frame-old-invalid', sortOrder: 0, imageUrl: null }
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'DRAFT' }],
      [previouslySelectedInvalid],
      [previouslySelectedInvalid, pending],
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
    ], [[], []])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await setMerchantStoreFrames({ actor, storeId: 'store-a', frameIds: ['frame-old-invalid', 'frame-pending'] })

    expect(result.frameIds).toEqual(['frame-old-invalid', 'frame-pending'])
    expect(sql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
  })

  it('preserves selected product order in the Cloudflare Store read model', async () => {
    const selectedB = { ...activeFrame, id: 'frame-b', merchantFrameId: 'frame-b', sortOrder: 0, name: 'Frame B' }
    const selectedA = { ...activeFrame, id: 'frame-a', merchantFrameId: 'frame-a', sortOrder: 1, name: 'Frame A' }
    const sql = sqlMock([
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'DRAFT', headline: null, description: null }],
      [{ ...activeFrame, id: 'frame-a', name: 'Frame A' }, { ...activeFrame, id: 'frame-b', name: 'Frame B' }],
      [selectedB, selectedA],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await getMerchantStoreWorkspace({ actor })

    expect(result.store?.selectedFrameIds).toEqual(['frame-b', 'frame-a'])
    expect(result.catalog.map((frame) => frame.id)).toEqual(['frame-a', 'frame-b'])
  })

  it('does not create another publish transaction or public revision for an already Live Store', async () => {
    const selected = { merchantFrameId: 'frame-a', sortOrder: 0, ...activeFrame }
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'ACTIVE' }],
      [selected],
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
      [activeFrame],
      [],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await publishMerchantStore({ actor, storeId: 'store-a', approved: true })

    expect(result).toMatchObject({ status: 'ACTIVE', publicPath: '/en/store/merchant-a' })
    expect(sql.transaction).not.toHaveBeenCalled()
  })

  it('keeps Live Store detail updates in place and invalidates the public route without republishing', async () => {
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'ACTIVE', headline: null, description: null }],
      [],
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
      [],
    ], [[[{ id: 'store-a', slug: 'store', name: 'Store A', status: 'ACTIVE', headline: 'Live headline', description: null }], [{ id: 'activation-a' }]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await updateMerchantStore({ actor, storeId: 'store-a', headline: 'Live headline' })

    expect(result).toMatchObject({ status: 'ACTIVE', headline: 'Live headline', publicPath: '/en/store/merchant-a' })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: null } }))
    expect(sql.transaction).toHaveBeenCalledTimes(1)
    const updateSql = sql.mock.calls.map(([strings]) => (strings as TemplateStringsArray).join('')).find((query) => query.includes('UPDATE "Experience"'))
    expect(updateSql).toBeDefined()
    expect(updateSql).toContain('UPDATE "Experience"')
    expect(updateSql).toContain('"status" = CASE WHEN')
  })

  it('approves a manually completed pending shape and audits correction as MerchantFrame', async () => {
    const existing = {
      id: 'frame-pending', merchantId: 'merchant-a', sku: null, name: 'Pending frame', brand: null, variant: null,
      imageUrl: 'https://example.test/pending.png', productUrl: 'https://shop.example.test/products/pending', price: 9900,
      currency: 'usd', shape: '', material: null, color: null, widthClass: null, styleTags: [], collectionTags: [],
      source: 'EXTERNAL', externalId: 'shopify:pending', sourceNotes: null, status: 'ACTIVE', enrichmentStatus: 'PENDING',
    }
    const corrected = { ...existing, name: 'Reviewed frame', shape: 'oval', enrichmentStatus: 'APPROVED' }
    const sql = sqlMock([[existing], [], [{ slug: 'merchant-a' }]], [[[corrected], [{ id: 'activation-event' }]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await updateMerchantFrame({
      actor: { ...actor, scopes: [...actor.scopes, 'catalog:write'] },
      frameId: 'frame-pending',
      frame: { name: 'Reviewed frame', shape: 'oval', imageUrl: existing.imageUrl, productUrl: existing.productUrl, externalId: existing.externalId },
    })

    expect(result).toMatchObject({ shape: 'oval', enrichmentStatus: 'APPROVED' })
    expect(sql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
    expect(recordMerchantAgentOperation).toHaveBeenCalledWith(expect.objectContaining({
      action: 'catalog.corrected',
      resourceType: 'MerchantFrame',
      resourceId: 'frame-pending',
    }))
  })

  it('keeps pending enrichment when an unrelated correction echoes the unchanged shape', async () => {
    const existing = {
      id: 'frame-pending-round', merchantId: 'merchant-a', sku: null, name: 'Pending frame', brand: 'Old brand', variant: null,
      imageUrl: 'https://example.test/pending.png', productUrl: 'https://shop.example.test/products/pending', price: 9900,
      currency: 'usd', shape: 'round', material: null, color: null, widthClass: null, styleTags: [], collectionTags: [],
      source: 'EXTERNAL', externalId: 'shopify:pending-round', sourceNotes: null, status: 'ACTIVE', enrichmentStatus: 'PENDING',
    }
    const persisted = { ...existing, brand: 'Updated brand', shape: 'ROUND', price: 12900, enrichmentStatus: 'PENDING' }
    const sql = sqlMock([[existing], [], [{ slug: 'merchant-a' }]], [[[persisted]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await updateMerchantFrame({
      actor: { ...actor, scopes: [...actor.scopes, 'catalog:write'] },
      frameId: existing.id,
      frame: {
        name: existing.name,
        brand: 'Updated brand',
        shape: 'ROUND',
        imageUrl: existing.imageUrl,
        productUrl: existing.productUrl,
        externalId: existing.externalId,
        source: 'EXTERNAL',
        price: 12900,
      },
    })

    const updateCall = sql.mock.calls.find(([strings]) => Array.isArray(strings) && strings.join('').includes('UPDATE "MerchantFrame" SET'))
    expect(updateCall?.slice(1)).toContain('PENDING')
    expect(result).toMatchObject({ brand: 'Updated brand', price: 12900, enrichmentStatus: 'PENDING', presentation: { state: 'NEEDS_REVIEW' } })
  })

  it('rejects a cross-merchant frame id before the Cloudflare correction transaction', async () => {
    const sql = sqlMock([[]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(updateMerchantFrame({
      actor: { ...actor, scopes: [...actor.scopes, 'catalog:write'] },
      frameId: 'frame-owned-by-merchant-b',
      frame: { name: 'Tampered update', imageUrl: 'https://example.test/image.png' },
    })).rejects.toBeInstanceOf(MerchantAccessError)

    expect(sql.mock.calls[0]?.[0]?.join('')).toContain('"id" = ')
    expect(sql.mock.calls[0]?.[0]?.join('')).toContain('"merchantId" = ')
    expect(sql.transaction).not.toHaveBeenCalled()
    expect(recordMerchantAgentOperation).not.toHaveBeenCalled()
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

    const result = await createCampaignDraft({
      merchantId: 'merchant-a', name: 'Spring Edit', headline: 'Try the edit',
      primaryCtaType: 'LINK', secondaryCtaType: 'PRODUCT_OR_COLLECTION',
    })

    expect(result).toMatchObject({ id: 'campaign-a', merchantId: 'merchant-a', status: 'DRAFT', slug: 'spring-edit' })
    expect(sql.mock.calls.some((call) => call[0].join('').includes('e."merchantId"'))).toBe(true)
    const insert = sql.mock.calls.find((call) => call[0].join('').includes('INSERT INTO "Experience"'))
    expect(insert?.slice(1)).toContain('CUSTOM_LINK')
    expect(insert?.slice(1)).toContain('PRODUCT')
    expect(insert?.slice(1)).not.toContain('LINK')
    expect(insert?.slice(1)).not.toContain('PRODUCT_OR_COLLECTION')
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
      merchantFrameId: 'frame-a', frameId: 'frame-a', sku: null, frameExternalId: 'shopify:product-1', frameProductUrl: 'https://shop.example.test/products/frame-a', frameName: 'Frame A', frameImageUrl: 'https://example.test/frame-a.png', frameBrand: 'VisuTry', framePrice: 129, frameCurrency: 'USD',
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
      [{ count: 0 }],
      [],
      [{ id: 'merchant-a', slug: 'merchant-a', referenceData: false }], [{ ...campaignRow, status: 'ACTIVE' }],
    ], [[[{ activatedId: 'campaign-a', currentStatus: 'ACTIVE', campaignLimit: null }], []]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(publishSql)
    const published = await publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })
    expect(published.status).toBe('ACTIVE')
    expect(publishSql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
    expect(publishSql.mock.calls.some((call) => String(call[0]?.join?.('') ?? '').includes('campaign_limit AS MATERIALIZED'))).toBe(true)

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
      merchantFrameId: 'frame-a', frameId: 'frame-a', sku: null, frameExternalId: 'shopify:product-1', frameProductUrl: 'https://shop.example.test/products/frame-a', frameName: 'Frame A', frameImageUrl: 'https://example.test/frame-a.png', frameBrand: 'VisuTry', framePrice: 129, frameCurrency: 'USD',
      frameShape: 'oval', frameWidthClass: null, frameSource: 'EXTERNAL', frameEnrichmentStatus: 'APPROVED', frameStatus: 'ACTIVE',
    }
    const sql = sqlMock([[{ id: 'merchant-a', slug: 'merchant-a', referenceData: false }], [campaignRow]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await previewCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a' })

    expect(result.readiness.ready).toBe(true)
    expect(result.readiness.blockingIssues).toEqual([])
    expect(result.selectedFrames).toEqual([expect.objectContaining({
      id: 'frame-a', name: 'Frame A', brand: 'VisuTry', imageUrl: 'https://example.test/frame-a.png',
      productUrl: 'https://shop.example.test/products/frame-a', price: 129, currency: 'USD', shape: 'oval',
      status: 'ACTIVE', valid: true, issues: [],
    })])
    expect(sql.mock.calls.some((call) => call[0].join('').includes('mf."price" AS "framePrice"') && call[0].join('').includes('mf."currency" AS "frameCurrency"'))).toBe(true)
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
    ], [[[{ currentStatus: 'DRAFT', activeCount: 1, campaignLimit: 1, activatedId: null }]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true })).rejects.toMatchObject({ code: 'CAMPAIGN_LIMIT_REACHED', httpStatus: 409 })
    expect(sql.mock.calls.some((call) => String(call[0]?.join?.('') ?? '').includes('UPDATE "Experience"'))).toBe(false)
  })

  it('atomically limits concurrent direct-Neon Launch publishes to one ACTIVE Campaign', async () => {
    const merchant = { id: 'merchant-a', slug: 'merchant-a', referenceData: false, planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE', entitlementEffectiveFrom: activeLaunchPeriodStart, billingPeriodEnd: activeLaunchPeriodEnd, createdAt: activeLaunchPeriodStart }
    const campaign = {
      id: 'campaign-a', merchantId: 'merchant-a', slug: 'campaign-a', name: 'Campaign A', status: 'DRAFT',
      headline: 'Try it', description: null, primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
      secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null, startAt: null, endAt: null,
      campaignObjective: 'INTENT', campaignGate: 'NONE', presentationMode: 'EDITORIAL_FIRST', referenceData: false,
      merchantFrameId: 'frame-a', frameId: 'frame-a', sku: null, frameExternalId: 'shopify:product-1', frameProductUrl: 'https://shop.example.test/products/frame-a', frameName: 'Frame A', frameImageUrl: 'https://example.test/frame-a.png', frameShape: 'oval', frameWidthClass: null, frameSource: 'EXTERNAL', frameEnrichmentStatus: 'APPROVED', frameStatus: 'ACTIVE',
    }
    let active = 0
    let lockTail = Promise.resolve()
    const sql = jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.join('')
      if (query.includes('SELECT "id", "slug", "referenceData"')) return Promise.resolve([merchant])
      if (query.includes('FROM "Experience" e JOIN "Merchant" m')) {
        const experienceId = String(values[0])
        return Promise.resolve([{ id: experienceId, slug: experienceId, type: 'CAMPAIGN', merchantSlug: merchant.slug }])
      }
      if (query.includes('SELECT e."id"')) return Promise.resolve([{ ...campaign, status: active > 0 ? 'ACTIVE' : 'DRAFT' }])
      if (query.includes('SELECT count(*)::int')) return Promise.resolve([{ count: active }])
      return Promise.resolve([])
    }) as SqlMock
    sql.unsafe = jest.fn((value: string) => value)
    sql.transaction = jest.fn(async () => {
      const previous = lockTail
      let release!: () => void
      lockTail = new Promise<void>((resolve) => { release = resolve })
      await previous
      try {
        if (active === 0) {
          active = 1
          return [[{ currentStatus: 'DRAFT', activeCount: 0, campaignLimit: 1, activatedId: 'campaign-a' }]]
        }
        return [[{ currentStatus: 'DRAFT', activeCount: 1, campaignLimit: 1, activatedId: null }]]
      } finally { release() }
    })
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const results = await Promise.allSettled([
      publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-a', approved: true }),
      publishCampaign({ merchantId: 'merchant-a', campaignId: 'campaign-b', approved: true }),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    const rejection = results.find((result) => result.status === 'rejected')
    expect(rejection).toMatchObject({ status: 'rejected', reason: expect.objectContaining({ code: 'CAMPAIGN_LIMIT_REACHED' }) })
    expect(active).toBe(1)
    expect(sql.transaction).toHaveBeenCalledTimes(2)
  })

  it('requires approval and publishes a ready Store through the direct-Neon boundary', async () => {
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'DRAFT' }],
      [{ merchantFrameId: 'frame-a', sortOrder: 0, id: 'frame-a', sku: 'sku-a', name: 'Frame A', imageUrl: 'https://example.test/frame-a.png', shape: 'oval', widthClass: null, status: 'ACTIVE' }],
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
      [activeFrame],
      [{ id: 'store-a', status: 'ACTIVE' }],
    ], [[[{ id: 'store-a', status: 'ACTIVE' }], [{ id: 'activation-a' }]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(publishMerchantStore({ actor, storeId: 'store-a', approved: false })).rejects.toMatchObject({ code: 'PUBLISH_APPROVAL_REQUIRED' })
    const result = await publishMerchantStore({ actor, storeId: 'store-a', approved: true })
    expect(result).toEqual({ id: 'store-a', status: 'ACTIVE', publicPath: '/en/store/merchant-a', approvalRecorded: true })
    expect(sql.mock.calls.some((call) => call[0].join('').includes('UPDATE "Experience"'))).toBe(true)
  })

  it('does not expose a published Store when the atomic milestone insert fails', async () => {
    const sql = sqlMock([
      [{ id: 'store-a', merchantId: 'merchant-a', slug: 'store', name: 'Store A', status: 'DRAFT' }],
      [{ merchantFrameId: 'frame-a', sortOrder: 0, id: 'frame-a', sku: 'sku-a', name: 'Frame A', imageUrl: 'https://example.test/frame-a.png', shape: 'oval', widthClass: null, status: 'ACTIVE' }],
      [{ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE', websiteUrl: null, contactEmail: null }],
      [activeFrame],
    ])
    sql.transaction = jest.fn().mockRejectedValue(new Error('activation insert failed'))
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(publishMerchantStore({ actor, storeId: 'store-a', approved: true })).rejects.toThrow('activation insert failed')
    expect(sql.transaction).toHaveBeenCalledTimes(1)
    expect(sql.transaction.mock.calls[0][0]).toHaveLength(2)
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

  it('does not report a catalog mutation when the atomic milestone transaction fails', async () => {
    const sql = sqlMock([
      [{ planCode: null, commercialStatus: null }],
      [{ count: 0 }],
      [],
    ])
    sql.transaction = jest.fn().mockRejectedValue(new Error('activation insert failed'))
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(importMerchantFrames({
      actor: { ...actor, scopes: ['catalog:write'] },
      frames: [{
        sku: null,
        name: 'Atomic Frame',
        imageUrl: 'https://cdn.example.test/atomic.jpg',
        productUrl: 'https://catalog.example.test/products/atomic',
        source: 'EXTERNAL',
        shape: 'round',
      }],
    })).rejects.toThrow('activation insert failed')
    expect(sql.transaction).toHaveBeenCalledTimes(1)
  })
})
