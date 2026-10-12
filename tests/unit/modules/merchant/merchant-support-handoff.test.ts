jest.mock('@/lib/prisma', () => ({
  prisma: { merchant: { findUnique: jest.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { getMerchantSupportHandoff } from '@/modules/merchant/application/merchant-support-handoff'
import {
  buildMerchantSupportHandoffV1,
  type MerchantSupportHandoffSnapshot,
} from '@/modules/merchant/domain/merchant-support-handoff-v1'

const readyFrame = {
  id: 'frame-a', sku: 'FRAME-001', externalId: null, name: 'Aviator',
  imageUrl: '/assets/glasses-presets/aviator-classic.jpg',
  productUrl: null, source: 'MANUAL', status: 'ACTIVE',
}
const fixture = (): MerchantSupportHandoffSnapshot => ({
  slug: 'demo-shop', name: 'Demo Shop', classification: 'TEST',
  logoUrl: null, accentColor: null,
  frames: [readyFrame],
  experiences: [{
    type: 'STORE', slug: 'store', status: 'ACTIVE',
    heroAssetUrl: null, updatedAt: new Date('2026-10-12T04:00:00Z'),
    frames: [{ merchantFrame: readyFrame }],
  }, {
    type: 'CAMPAIGN', slug: 'fall-edit', status: 'DRAFT',
    heroAssetUrl: null, updatedAt: new Date('2026-10-12T05:00:00Z'),
    frames: [],
  }],
})

describe('Merchant sanitized support handoff v1', () => {
  beforeEach(() => jest.clearAllMocks())

  it('emits real DB readiness but never misrepresents public image, payments or G4 as verified', () => {
    const receipt = buildMerchantSupportHandoffV1(fixture())
    expect(receipt).toMatchObject({
      version: 1, scope: 'AUTHENTICATED_MERCHANT_DB_SNAPSHOT_ONLY',
      merchant: { slug: 'demo-shop', classification: 'TEST' },
      catalog: { total: 1, active: 1, storeEligible: 1 },
      store: {
        status: 'ACTIVE', selectedProductCount: 1, displayEligibleProductCount: 1,
        publicPath: '/en/store/demo-shop', publicRender: 'NOT_VERIFIED',
      },
      campaigns: [{ slug: 'fall-edit', status: 'DRAFT', publicPath: null }],
      blockers: [],
      verification: { publicStoreImageDecode: 'NOT_EXECUTED', billingLive: 'NOT_EXECUTED' },
      releaseReady: false,
    })
    expect(JSON.stringify(receipt)).not.toMatch(/email|phone|sessionId|credentialId|buyer/i)
  })

  it('blocks a published Store whose selected product is ACTIVE but cannot display its image', () => {
    const snapshot = fixture()
    snapshot.experiences[0].frames[0].merchantFrame = { ...readyFrame, imageUrl: null }
    const receipt = buildMerchantSupportHandoffV1(snapshot)
    expect(receipt.blockers).toContain('STORE_HAS_INELIGIBLE_PRODUCTS')
    expect(receipt.store).toMatchObject({ selectedProductCount: 1, displayEligibleProductCount: 0 })
    expect(receipt.releaseReady).toBe(false)
  })

  it('treats Draft as unpublished and never claims a public route', () => {
    const snapshot = fixture()
    snapshot.experiences[0].status = 'DRAFT'
    const receipt = buildMerchantSupportHandoffV1(snapshot)
    expect(receipt.blockers).toContain('STORE_NOT_PUBLISHED')
    expect(receipt.store.publicPath).toBeNull()
  })

  it('blocks multiple ACTIVE Stores instead of silently certifying one', () => {
    const snapshot = fixture()
    snapshot.experiences.push({
      ...snapshot.experiences[0], slug: 'store-2', updatedAt: new Date('2026-10-12T08:00:00Z'),
    })
    const receipt = buildMerchantSupportHandoffV1(snapshot)
    expect(receipt.blockers).toContain('MULTIPLE_ACTIVE_STORES')
    expect(receipt.releaseReady).toBe(false)
  })

  it('uses one tightly selected tenant-owned Prisma read, no write or shopper records', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(fixture())
    const receipt = await getMerchantSupportHandoff({ merchantId: 'merchant-a' })
    expect(receipt.store.publicPath).toBe('/en/store/demo-shop')
    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
      where: { id: 'merchant-a' },
      select: expect.objectContaining({
        slug: true, name: true, classification: true,
        frames: expect.objectContaining({
          select: expect.objectContaining({ sku: true, imageUrl: true, status: true }),
        }),
        experiences: expect.objectContaining({
          where: { type: { in: ['STORE', 'CAMPAIGN'] } },
          select: expect.objectContaining({ heroAssetUrl: true, updatedAt: true }),
        }),
      }),
    })
  })

  it('returns tenant-masked not found when the Merchant row does not exist', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(getMerchantSupportHandoff({ merchantId: 'foreign' }))
      .rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND', httpStatus: 404 })
  })
})
