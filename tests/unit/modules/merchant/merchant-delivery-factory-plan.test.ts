jest.mock('@/lib/prisma', () => ({
  prisma: { merchant: { findUnique: jest.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { getMerchantFactoryDryRun } from '@/modules/merchant/application/merchant-delivery-factory-plan'

const actor = { actorType: 'HUMAN' as const, actorId: 'user-a', merchantId: 'tenant-a', membershipId: 'membership-a' }
const manifest = {
  version: 1, merchantSlug: 'store-a', classification: 'TEST',
  catalog: { sourceMethod: 'MANUAL', expectedFrameIds: ['frame-owned-a'] },
  brand: { displayName: 'Store A', logoAssetUrl: null },
  store: { name: 'Store A', headline: 'Edit', selectedFrameIds: ['frame-owned-a'] },
  campaigns: [],
}
const store = {
  id: 'store-a-id', type: 'STORE', slug: 'default', status: 'DRAFT', name: 'Store A',
  headline: 'Old', description: null, presentationMode: null, journeyPolicy: null,
  deliveryPolicy: null, updatedAt: new Date('2026-09-01T00:00:00Z'),
  frames: [{ merchantFrameId: 'frame-owned-a' }],
}
const merchant = {
  id: 'tenant-a', slug: 'store-a', classification: 'TEST', name: 'Store A', logoUrl: null, accentColor: '#1F4B5A',
  frames: [{
    id: 'frame-owned-a', sku: 'FRAME-001', externalId: null,
    name: 'Frame A', imageUrl: '/assets/glasses-presets/aviator-classic.jpg',
    productUrl: null, source: 'MANUAL', status: 'ACTIVE',
  }],
  experiences: [store],
}

describe('authenticated local Factory snapshot / canonical dry-run adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(merchant)
  })

  it('reads only the authenticated tenant and produces a real snapshot-derived, non-mutating diff', async () => {
    const plan = await getMerchantFactoryDryRun({ actor, proposal: manifest })
    expect(prisma.merchant.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'tenant-a' } }))
    expect(plan).toMatchObject({
      merchantId: 'tenant-a', merchantSlug: 'store-a', classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
      canApply: false, releaseReady: false, blockers: [],
    })
    expect(plan.steps[1]).toMatchObject({ resource: 'STORE', target: 'default', action: 'UPDATE_DRAFT', changedFields: ['headline'] })
  })

  it('reads the actual Brand accent and plans a human-only correction without mutating it', async () => {
    const plan = await getMerchantFactoryDryRun({
      actor, proposal: { ...manifest, brand: { ...manifest.brand, accentColor: '#1D4ED8' } },
    })
    expect(plan.steps[0]).toMatchObject({
      resource: 'BRAND', action: 'HUMAN_REVIEW_REQUIRED', changedFields: ['accentColor'],
    })
    expect(plan.canApply).toBe(false)
    expect(prisma.merchant.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ accentColor: true }),
    }))
  })

  it('reuses canonical Store display readiness to block an ACTIVE but unrenderable product', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValueOnce({
      ...merchant,
      frames: [{ ...merchant.frames[0], imageUrl: null }],
    })
    const plan = await getMerchantFactoryDryRun({ actor, proposal: manifest })
    expect(plan.blockers).toContain('Store selected frame is not display-ready: frame-owned-a')
    expect(plan.canApply).toBe(false)
    expect(prisma.merchant.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        frames: expect.objectContaining({
          select: expect.objectContaining({ sku: true, name: true, imageUrl: true, source: true }),
        }),
      }),
    }))
  })

  it('does not accept identity from the manifest in place of membership tenant', async () => {
    await expect(getMerchantFactoryDryRun({
      actor, proposal: { ...manifest, merchantSlug: 'tenant-b' },
    })).rejects.toThrow('FACTORY_TENANT_MISMATCH')
    expect(prisma.merchant.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'tenant-a' } }))
  })

  it('fails closed for a missing or unverified human membership', async () => {
    await expect(getMerchantFactoryDryRun({ actor: { ...actor, membershipId: undefined }, proposal: manifest }))
      .rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
    expect(prisma.merchant.findUnique).not.toHaveBeenCalled()
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValueOnce(null)
    await expect(getMerchantFactoryDryRun({ actor, proposal: manifest }))
      .rejects.toMatchObject({ code: 'MERCHANT_ACCESS_NOT_FOUND' })
  })

  it('prioritizes the same ACTIVE Store as public discovery and warns on duplicate ACTIVE Stores', async () => {
    const cloned = { ...store, id: 'live-a', slug: 'a', status: 'ACTIVE', headline: 'Live', updatedAt: new Date('2026-09-10T00:00:00Z') }
    const second = { ...cloned, id: 'live-z', slug: 'z' }
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValueOnce({
      ...merchant, experiences: [store, second, cloned],
    })
    const plan = await getMerchantFactoryDryRun({ actor, proposal: manifest })
    expect(plan.steps[1]).toMatchObject({ action: 'HUMAN_REVIEW_REQUIRED', changedFields: ['headline'] })
    expect(plan.blockers).toContain('Multiple ACTIVE Stores exist; resolve the live Store identity in the human workspace first')
  })

  it('blocks inactive Catalog identities without showing another tenant resources', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValueOnce({
      ...merchant, frames: [],
    })
    const plan = await getMerchantFactoryDryRun({ actor, proposal: manifest })
    expect(plan.blockers).toEqual(expect.arrayContaining([
      'Catalog resource is missing, inactive, or not tenant-owned: frame-owned-a',
    ]))
  })
})
