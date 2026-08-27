jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    merchantFrame: { count: jest.fn(), findMany: jest.fn() },
    experience: { findFirst: jest.fn(), update: jest.fn() },
    experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
    merchantOperationAudit: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

jest.mock('@/modules/merchant/application/get-merchant-profile', () => ({
  getMerchantProfile: jest.fn().mockResolvedValue({ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE' }),
}))

import { prisma } from '@/lib/prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { merchantOnboarding, validateCatalogFrame } from '@/modules/merchant/application/merchant-onboarding'

const actor: AgentMerchantActor = { actorType: 'AGENT_CREDENTIAL', actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read'] }

function frame(id: string, overrides: Partial<{ sku: string | null; name: string; imageUrl: string | null; shape: string; widthClass: string | null; status: 'ACTIVE' | 'DRAFT' }> = {}) {
  return { id, sku: `SKU-${id}`, name: `Frame ${id}`, imageUrl: 'https://cdn.example/frame.jpg', shape: 'round', widthClass: 'M', status: 'ACTIVE' as const, ...overrides }
}

describe('merchant onboarding catalog validation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts a complete active frame', () => {
    expect(validateCatalogFrame({
      id: 'frame-a', sku: 'SKU-A', name: 'A', imageUrl: 'https://cdn.example/a.jpg', shape: 'round', widthClass: 'M', status: 'ACTIVE',
    })).toEqual({ valid: true, importReady: true, recommendationReady: true, issues: [], importIssues: [], recommendationIssues: [], warnings: [] })
  })

  it('returns deterministic blockers without inventing data', () => {
    expect(validateCatalogFrame({
      id: 'frame-a', sku: null, name: 'A', imageUrl: null, shape: '', widthClass: null, status: 'DRAFT',
    })).toEqual({ valid: false, importReady: false, recommendationReady: false, issues: ['MISSING_STABLE_IDENTITY', 'MISSING_IMAGE_URL', 'MISSING_SHAPE'], importIssues: ['MISSING_STABLE_IDENTITY', 'MISSING_IMAGE_URL'], recommendationIssues: ['MISSING_SHAPE'], warnings: ['FRAME_NOT_ACTIVE'] })
  })

  it('rejects a Store belonging to another tenant before touching frames', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
    const writeActor: AgentMerchantActor = { ...actor, scopes: ['experience:write'] }

    await expect(merchantOnboarding.setMerchantStoreFrames({ actor: writeActor, storeId: 'store-b', frameIds: ['frame-b'] })).rejects.toBeInstanceOf(MerchantAccessError)
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.experience.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ merchantId: 'merchant-a', id: 'store-b' }) }))
  })

  it('separates catalog readiness from Store selection readiness', async () => {
    const catalog = Array.from({ length: 20 }, (_, index) => frame(`frame-${index + 1}`, index >= 15 ? { imageUrl: null } : {}))
    ;(prisma.merchantFrame.count as jest.Mock).mockResolvedValue(20)
    ;(prisma.merchantFrame.findMany as jest.Mock).mockImplementation(({ where }: { where: { id?: { in: string[] } } }) => {
      if (where.id?.in) return Promise.resolve(catalog.filter((item) => where.id?.in.includes(item.id) && item.status === 'ACTIVE'))
      return Promise.resolve(catalog.filter((item) => item.status === 'ACTIVE'))
    })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: 'store-a', slug: 'store', status: 'DRAFT', name: 'Store', frames: catalog.slice(0, 8).map((item) => ({ merchantFrameId: item.id })) })

    const status = await merchantOnboarding.getOnboardingStatus({ actor })

    expect(status.catalog).toEqual({ totalFrames: 20, activeFrames: 20, readyFrames: 15 })
    expect(status.store).toEqual(expect.objectContaining({ frameCount: 8, readyFrameCount: 8 }))
    expect(status.blockers).not.toContain('NO_VALID_FRAMES')
  })

  it('reports invalid catalog frames and does not claim readiness without a Store', async () => {
    const catalog = [frame('valid'), frame('invalid', { imageUrl: null })]
    ;(prisma.merchantFrame.count as jest.Mock).mockResolvedValue(2)
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue(catalog)
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)

    const status = await merchantOnboarding.getOnboardingStatus({ actor })

    expect(status.catalog.readyFrames).toBe(1)
    expect(status.store).toBeNull()
    expect(status.blockers).toEqual(expect.arrayContaining(['STORE_NOT_CREATED']))
    expect(status.blockers).not.toContain('NO_VALID_FRAMES')
  })

  it('reports NO_VALID_FRAMES when active catalog frames fail validation', async () => {
    ;(prisma.merchantFrame.count as jest.Mock).mockResolvedValue(2)
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([frame('invalid-a', { imageUrl: null }), frame('invalid-b', { shape: '' })])
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)

    const status = await merchantOnboarding.getOnboardingStatus({ actor })

    expect(status.catalog.readyFrames).toBe(0)
    expect(status.blockers).toEqual(expect.arrayContaining(['NO_VALID_FRAMES']))
  })

  it('reports invalid, inactive, or missing Store selections', async () => {
    const selected = [frame('valid'), frame('invalid', { imageUrl: null }), frame('inactive', { status: 'DRAFT' })]
    ;(prisma.merchantFrame.count as jest.Mock).mockResolvedValue(3)
    ;(prisma.merchantFrame.findMany as jest.Mock).mockImplementation(({ where }: { where: { id?: { in: string[] } } }) => {
      if (where.id?.in) return Promise.resolve(selected.filter((item) => where.id?.in.includes(item.id) && item.status === 'ACTIVE'))
      return Promise.resolve(selected.filter((item) => item.status === 'ACTIVE'))
    })
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: 'store-a', slug: 'store', status: 'DRAFT', name: 'Store', frames: ['valid', 'invalid', 'inactive', 'missing'].map((merchantFrameId) => ({ merchantFrameId })) })

    const status = await merchantOnboarding.getOnboardingStatus({ actor })

    expect(status.store).toEqual(expect.objectContaining({ frameCount: 4, readyFrameCount: 1 }))
    expect(status.blockers).toContain('STORE_HAS_INVALID_FRAMES')
  })

  it('invalidates catalog discovery only after a successful import transaction', async () => {
    const writeActor: AgentMerchantActor = { ...actor, scopes: ['catalog:write'] }
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      merchantFrame: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'frame-a' }),
      },
    }))

    await merchantOnboarding.importMerchantFrames({ actor: writeActor, frames: [{ sku: 'SKU-A', name: 'Frame A', shape: 'round', imageUrl: 'https://cdn.example.test/frame-a.jpg' }] })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'catalog', merchantSlug: 'merchant-a' } }))

    jest.clearAllMocks()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error('write failed'))
    await expect(merchantOnboarding.importMerchantFrames({ actor: writeActor, frames: [{ sku: 'SKU-A', name: 'Frame A', shape: 'round', imageUrl: 'https://cdn.example.test/frame-a.jpg' }] })).rejects.toThrow('write failed')
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalled()
  })

  it('preserves reviewed source provenance when approved candidates are imported', async () => {
    const writeActor: AgentMerchantActor = { ...actor, scopes: ['catalog:write'] }
    const create = jest.fn().mockResolvedValue({ id: 'frame-external' })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      merchantFrame: { findFirst: jest.fn().mockResolvedValue(null), create },
    }))

    await merchantOnboarding.importMerchantFrames({
      actor: writeActor,
      frames: [{
        sku: 'EXTERNAL-01',
        name: 'Reviewed external frame',
        shape: 'round',
        imageUrl: 'https://cdn.example.test/frame.jpg',
        productUrl: 'https://catalog.example.test/products/external-01',
        source: 'EXTERNAL',
        externalId: 'https://catalog.example.test/products/external-01',
        sourceNotes: 'Reviewed public catalog source: catalog.example.test',
      }],
    })

    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({
      source: 'EXTERNAL',
      externalId: 'https://catalog.example.test/products/external-01',
      sourceNotes: 'Reviewed public catalog source: catalog.example.test',
    }) })
  })

  it('imports a URL-identified frame without a merchant SKU or shape', async () => {
    const writeActor: AgentMerchantActor = { ...actor, scopes: ['catalog:write'] }
    const create = jest.fn().mockResolvedValue({ id: 'frame-url-only' })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      merchantFrame: { findFirst: jest.fn().mockResolvedValue(null), create },
    }))

    await merchantOnboarding.importMerchantFrames({
      actor: writeActor,
      frames: [{
        sku: null,
        name: 'URL Identified Frame',
        shape: null,
        imageUrl: 'https://cdn.example.test/url-only.jpg',
        productUrl: 'https://catalog.example.test/products/url-only',
        source: 'EXTERNAL',
      }],
    })

    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ sku: null, shape: '', externalId: 'https://catalog.example.test/products/url-only' }) })
  })

  it('invalidates Store discovery after frame replacement succeeds', async () => {
    const writeActor: AgentMerchantActor = { ...actor, scopes: ['experience:write'] }
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: 'store-a', slug: 'store', status: 'DRAFT', frames: [] })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([frame('frame-a')])
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback({
      experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
    }))

    await merchantOnboarding.setMerchantStoreFrames({ actor: writeActor, storeId: 'store-a', frameIds: ['frame-a'] })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: null } }))
  })

  it('invalidates Store discovery after Store creation and publication writes', async () => {
    const writeActor: AgentMerchantActor = { ...actor, scopes: ['experience:write'] }
    ;(prisma.merchantFrame.findMany as jest.Mock).mockResolvedValue([frame('frame-a')])
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue({
      id: 'store-a', slug: 'store', status: 'DRAFT', name: 'Store', frames: [{ merchantFrameId: 'frame-a' }],
    })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ slug: 'merchant-a' })
    ;(prisma.$transaction as jest.Mock)
      .mockImplementationOnce(async (callback) => callback({ experience: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'store-a', slug: 'store', status: 'DRAFT', name: 'Store', frames: [] }),
      } }))
      .mockResolvedValue(undefined)
    ;(prisma.experience.update as jest.Mock).mockResolvedValue({ id: 'store-a', status: 'ACTIVE', frames: [] })

    await merchantOnboarding.createMerchantStore({ actor: writeActor })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: null } }))

    await merchantOnboarding.publishMerchantStore({ actor: writeActor, storeId: 'store-a', approved: true })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: null } }))
  })
})
