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

  it('separates actual inspection attempts and outcomes, counting distinct workspaces', async () => {
    const occurredAt = new Date('2026-10-10T00:00:00.000Z')
    const event = (merchantId: string, eventType: string, id: string) => ({
      id, merchantId, eventType, occurredAt, source: 'CLIENT',
      correlationId: null, sessionId: 'session-12345678', dedupeKey: id, metadata: null,
    })
    jest.mocked(prisma.merchantActivationEvent.findMany)
      .mockResolvedValueOnce([
        { merchantId: 'merchant-a', occurredAt, merchant: { classification: 'POSSIBLE_EXTERNAL' } },
        { merchantId: 'merchant-b', occurredAt, merchant: { classification: 'POSSIBLE_EXTERNAL' } },
      ] as never)
      .mockResolvedValueOnce([
        event('merchant-a', 'merchant_catalog_started', 'page-view'),
        event('merchant-a', 'merchant_catalog_inspection_attempted', 'attempt-1'),
        event('merchant-a', 'merchant_catalog_inspection_attempted', 'attempt-2'),
        event('merchant-a', 'merchant_catalog_inspection_empty', 'empty'),
        event('merchant-b', 'merchant_catalog_inspection_attempted', 'attempt-3'),
        event('merchant-b', 'merchant_catalog_inspection_failed', 'failed'),
        event('merchant-b', 'merchant_catalog_inspection_ready', 'ready'),
      ] as never)

    const report = await getMerchantActivationReport()

    expect(report.counts).toMatchObject({
      catalogInspectionAttempted: 2,
      catalogInspectionReady: 1,
      catalogInspectionEmpty: 1,
      catalogInspectionFailed: 1,
      firstItem: 0,
    })
  })

  it('computes the 7-day A0→A6 rate only for fully observed, classified cohorts', async () => {
    const day = 24 * 60 * 60 * 1000
    const now = Date.now()
    const at = (dayOffset: number) => new Date(now + dayOffset * day)
    const candidates = [
      { merchantId: 'real-early', offset: -20, classification: 'REAL' },
      { merchantId: 'real-second', offset: -17, classification: 'REAL' },
      { merchantId: 'possible-on-edge', offset: -15, classification: 'POSSIBLE_EXTERNAL' },
      { merchantId: 'possible-too-late', offset: -12, classification: 'POSSIBLE_EXTERNAL' },
      { merchantId: 'possible-pending', offset: -2, classification: 'POSSIBLE_EXTERNAL' },
    ] as const
    const preview = (merchantId: string, offset: number, id: string) => ({
      id, merchantId, eventType: 'merchant_store_previewed', occurredAt: at(offset),
      source: 'CLIENT', correlationId: null, sessionId: 'session-12345678', dedupeKey: id, metadata: null,
    })
    jest.mocked(prisma.merchantActivationEvent.findMany)
      .mockResolvedValueOnce(candidates.map((candidate) => ({
        merchantId: candidate.merchantId, occurredAt: at(candidate.offset),
        merchant: { classification: candidate.classification },
      })) as never)
      .mockResolvedValueOnce([
        preview('real-early', -19, 'preview-1d'),
        preview('real-second', -14, 'preview-3d'),
        preview('possible-on-edge', -8, 'preview-7d-inclusive'),
        preview('possible-too-late', -13, 'preview-before-a0-invalid'),
        preview('possible-too-late', -4, 'preview-8d-too-late'),
        preview('possible-pending', -1, 'preview-before-window-matures'),
      ] as never)

    const report = await getMerchantActivationReport()

    expect(report.firstValue7Day).toMatchObject({
      windowDays: 7,
      maturedWorkspaces: 4,
      pendingWorkspaces: 1,
      achievedWithin7Days: 3,
      rate: 75,
      medianTimeToPreviewMs: 3 * day,
      p90TimeToPreviewMs: 7 * day,
      confirmedReal: { maturedWorkspaces: 2, achievedWithin7Days: 2, rate: 100 },
      possibleExternal: { maturedWorkspaces: 2, achievedWithin7Days: 1, rate: 50 },
    })
    expect(report.counts.storePreviewed).toBe(5) // Existing all-time count remains unchanged.
  })

  it('reports N/A, rather than a false 0% failure, for an immature cohort', async () => {
    const now = new Date()
    jest.mocked(prisma.merchantActivationEvent.findMany)
      .mockResolvedValueOnce([
        { merchantId: 'new-merchant', occurredAt: now, merchant: { classification: 'REAL' } },
      ] as never)
      .mockResolvedValueOnce([])

    const report = await getMerchantActivationReport()

    expect(report.firstValue7Day).toMatchObject({
      maturedWorkspaces: 0,
      pendingWorkspaces: 1,
      achievedWithin7Days: 0,
      rate: null,
      medianTimeToPreviewMs: null,
      p90TimeToPreviewMs: null,
      confirmedReal: { maturedWorkspaces: 0, achievedWithin7Days: 0, rate: null },
    })
  })

})
