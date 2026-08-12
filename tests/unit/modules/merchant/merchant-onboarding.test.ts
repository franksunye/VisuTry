jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantFrame: { findMany: jest.fn() },
    experience: { findFirst: jest.fn() },
    experienceFrame: { deleteMany: jest.fn(), createMany: jest.fn() },
    merchantOperationAudit: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { merchantOnboarding, validateCatalogFrame } from '@/modules/merchant/application/merchant-onboarding'

describe('merchant onboarding catalog validation', () => {
  it('accepts a complete active frame', () => {
    expect(validateCatalogFrame({
      id: 'frame-a', sku: 'SKU-A', name: 'A', imageUrl: 'https://cdn.example/a.jpg', shape: 'round', widthClass: 'M', status: 'ACTIVE',
    })).toEqual({ valid: true, issues: [], warnings: [] })
  })

  it('returns deterministic blockers without inventing data', () => {
    expect(validateCatalogFrame({
      id: 'frame-a', sku: null, name: 'A', imageUrl: null, shape: '', widthClass: null, status: 'DRAFT',
    })).toEqual({ valid: false, issues: ['MISSING_SKU', 'MISSING_IMAGE_URL', 'MISSING_SHAPE'], warnings: ['FRAME_NOT_ACTIVE'] })
  })

  it('rejects a Store belonging to another tenant before touching frames', async () => {
    ;(prisma.experience.findFirst as jest.Mock).mockResolvedValue(null)
    const actor: AgentMerchantActor = { actorType: 'AGENT_CREDENTIAL', actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['experience:write'] }

    await expect(merchantOnboarding.setMerchantStoreFrames({ actor, storeId: 'store-b', frameIds: ['frame-b'] })).rejects.toBeInstanceOf(MerchantAccessError)
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.experience.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ merchantId: 'merchant-a', id: 'store-b' }) }))
  })
})
