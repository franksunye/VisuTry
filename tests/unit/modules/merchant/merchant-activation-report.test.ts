import { prisma } from '@/lib/prisma'
import { getMerchantActivationReport } from '@/modules/merchant/application/merchant-activation-report'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantActivationEvent: { findMany: jest.fn() },
  },
}))

describe('Merchant activation report cohort boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.merchantActivationEvent.findMany).mockResolvedValue([])
  })

  it('admits only trusted self-service, non-reference classifications', async () => {
    await getMerchantActivationReport()

    expect(prisma.merchantActivationEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        merchant: {
          classificationSource: 'SELF_SERVICE_SIGNUP',
          classification: { in: ['REAL', 'POSSIBLE_EXTERNAL'] },
          referenceData: false,
        },
      }),
    }))
  })

  it('returns a zero cohort without issuing a second broad event query', async () => {
    const report = await getMerchantActivationReport({ from: new Date('2026-10-01T00:00:00.000Z') })

    expect(report.cohort.workspacesCreated).toBe(0)
    expect(prisma.merchantActivationEvent.findMany).toHaveBeenCalledTimes(1)
  })
})
