import { getMerchantAttributionBreakdown } from '@/modules/store/application/get-merchant-attribution'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantSession: { groupBy: jest.fn() },
  },
}))

const db = prisma as unknown as { merchantSession: { groupBy: jest.Mock } }

describe('MerchantSession attribution reporting contract', () => {
  it('groups sessions by acquisition and authoritative Experience dimensions', async () => {
    db.merchantSession.groupBy.mockResolvedValue([
      {
        source: 'visutry',
        medium: 'internal',
        acquisitionSurface: 'discover',
        experienceId: 'experience-akila',
        aiAgentSource: null,
        _count: { _all: 2 },
      },
    ])

    await expect(getMerchantAttributionBreakdown({ merchantId: 'merchant-akila' })).resolves.toEqual([
      {
        source: 'visutry',
        medium: 'internal',
        acquisitionSurface: 'discover',
        experienceId: 'experience-akila',
        aiAgentSource: null,
        sessions: 2,
      },
    ])
    expect(db.merchantSession.groupBy).toHaveBeenCalledWith({
      by: ['source', 'medium', 'acquisitionSurface', 'experienceId', 'aiAgentSource'],
      where: { merchantId: 'merchant-akila' },
      _count: { _all: true },
    })
  })
})
