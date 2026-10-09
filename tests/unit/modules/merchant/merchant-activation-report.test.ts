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
      select: expect.objectContaining({ merchant: { select: { classification: true } } }),
    }))
  })

  it('returns a zero cohort without issuing a second broad event query', async () => {
    const report = await getMerchantActivationReport({ from: new Date('2026-10-01T00:00:00.000Z') })

    expect(report.cohort).toMatchObject({
      candidateWorkspacesCreated: 0,
      confirmedRealWorkspacesCreated: 0,
      possibleExternalCandidates: 0,
    })
    expect(prisma.merchantActivationEvent.findMany).toHaveBeenCalledTimes(1)
  })

  it('reports confirmed REAL and unverified POSSIBLE_EXTERNAL candidates separately', async () => {
    jest.mocked(prisma.merchantActivationEvent.findMany)
      .mockResolvedValueOnce([
        { merchantId: 'real-1', occurredAt: new Date('2026-10-01T00:00:00.000Z'), merchant: { classification: 'REAL' } },
        { merchantId: 'possible-1', occurredAt: new Date('2026-10-02T00:00:00.000Z'), merchant: { classification: 'POSSIBLE_EXTERNAL' } },
        { merchantId: 'possible-1', occurredAt: new Date('2026-10-02T00:01:00.000Z'), merchant: { classification: 'POSSIBLE_EXTERNAL' } },
      ] as never)
      .mockResolvedValueOnce([])

    const report = await getMerchantActivationReport()

    expect(report.cohort).toMatchObject({
      candidateWorkspacesCreated: 2,
      confirmedRealWorkspacesCreated: 1,
      possibleExternalCandidates: 1,
    })
    expect(report.rates.firstItemActivationRate).toBe(0)
    expect(prisma.merchantActivationEvent.findMany).toHaveBeenCalledTimes(2)
  })
})
