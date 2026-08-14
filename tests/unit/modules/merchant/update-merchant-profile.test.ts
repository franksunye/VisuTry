jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn(), update: jest.fn() },
    merchantMembership: { findUnique: jest.fn() },
  },
}))

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

import { prisma } from '@/lib/prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { updateMerchantProfile } from '@/modules/merchant/application/update-merchant-profile'

describe('merchant profile public discovery boundary', () => {
  beforeEach(() => jest.clearAllMocks())

  it('invalidates after public merchant fields are updated', async () => {
    ;(prisma.merchantMembership.findUnique as jest.Mock).mockResolvedValue({ id: 'membership-a', userId: 'user-a', merchantId: 'merchant-a', role: 'OWNER' })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', websiteUrl: null })
    ;(prisma.merchant.update as jest.Mock).mockResolvedValue({ id: 'merchant-a', slug: 'merchant-a', name: 'New Name', websiteUrl: null })

    await updateMerchantProfile({ userId: 'user-a', merchantId: 'merchant-a', name: 'New Name' })
    expect(withPublicDiscoveryInvalidation).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'merchant', merchantSlug: 'merchant-a' } }))
  })

  it('does not invalidate when validation rejects before the mutation', async () => {
    ;(prisma.merchantMembership.findUnique as jest.Mock).mockResolvedValue({ id: 'membership-a', userId: 'user-a', merchantId: 'merchant-a', role: 'OWNER' })
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', websiteUrl: null })

    await expect(updateMerchantProfile({ userId: 'user-a', merchantId: 'merchant-a', websiteUrl: 'javascript:bad' })).rejects.toMatchObject({ code: 'INVALID_WEBSITE_URL' })
    expect(prisma.merchant.update).not.toHaveBeenCalled()
    expect(withPublicDiscoveryInvalidation).not.toHaveBeenCalled()
  })
})
