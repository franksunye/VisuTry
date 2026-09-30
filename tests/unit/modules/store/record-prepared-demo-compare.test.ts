import { prisma } from '@/lib/prisma'
import { recordCompareStarted } from '@/modules/store/application/record-compare-started'
import { createMerchantSessionCapability } from '@/modules/store/domain/session'
import { preparedDemoReferenceForAsset, PREPARED_DEMO_RESULT_MANIFEST } from '@/modules/store/infrastructure/prepared-demo/prepared-result-manifest'

jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn() } }))
jest.mock('@/lib/prisma', () => ({ prisma: { tryOnTask: { count: jest.fn(), findMany: jest.fn() } } }))

const capability = createMerchantSessionCapability()
const merchantFields = {
  id: 'demo-merchant',
  slug: 'visutry-demo-optical',
  name: 'VisuTry Demo Optical',
  status: 'ACTIVE',
  classification: 'TEST',
  pilotType: 'DEMO',
  commercialExceptionCode: 'VISUTRY_DEMO',
  planCode: null,
  commercialStatus: null,
  tryOnEnabled: true,
  compareEnabled: true,
}

function input(overrides: {
  merchant?: Record<string, unknown>
  resultItems?: unknown[]
  frameOwner?: string
  frameSkus?: string[]
} = {}) {
  const events = { appendIdempotent: jest.fn().mockResolvedValue({ created: true }) }
  const frames = {
    findActiveByMerchantAndId: jest.fn(async (merchantId: string, frameId: string) => {
      const index = frameId === 'rowan-frame' ? 0 : 1
      return {
        id: frameId,
        merchantId: overrides.frameOwner ?? merchantId,
        sku: overrides.frameSkus?.[index] ?? (index === 0 ? 'VT-DEMO-001' : 'VT-DEMO-002'),
      }
    }),
  }
  return {
    value: {
      merchants: { findBySlug: jest.fn().mockResolvedValue({ ...merchantFields, ...overrides.merchant }) },
      sessions: {
        findByMerchantAndId: jest.fn().mockResolvedValue({
          id: 'demo-session',
          merchantId: overrides.merchant?.id ?? 'demo-merchant',
          experienceId: null,
          capabilityTokenHash: capability.tokenHash,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 60_000),
        }),
      },
      events,
      frames,
      decisionResults: {
        getSessionResultItems: jest.fn().mockResolvedValue(overrides.resultItems ?? [
          preparedDemoReferenceForAsset(PREPARED_DEMO_RESULT_MANIFEST[0], 'rowan-frame', new Date().toISOString()),
          preparedDemoReferenceForAsset(PREPARED_DEMO_RESULT_MANIFEST[1], 'lane-frame', new Date().toISOString()),
        ]),
        updateSessionSnapshot: jest.fn(),
      },
      slug: 'visutry-demo-optical',
      merchantSessionId: 'demo-session',
      capabilityToken: capability.token,
      clientActionId: 'compare-action-1',
      frameIds: ['rowan-frame', 'lane-frame'],
    },
    events,
    frames,
  }
}

describe('prepared results in the canonical Compare operation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.tryOnTask.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue([])
  })

  it('accepts two tenant-scoped manifest results without counting them as Provider Try-Ons', async () => {
    const fixture = input()
    const result = await recordCompareStarted(fixture.value as never)
    expect(result.recorded).toBe(true)
    expect(fixture.value.decisionResults.getSessionResultItems).toHaveBeenCalledWith({
      merchantId: 'demo-merchant', merchantSessionId: 'demo-session',
    })
    expect(fixture.frames.findActiveByMerchantAndId).toHaveBeenCalledTimes(2)
    expect(fixture.events.appendIdempotent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'merchant_compare_started',
      metadata: expect.objectContaining({ completedTryOns: 0, preparedDemoResults: 2, selectedFrameCount: 2 }),
    }))
    expect(prisma.tryOnTask.count).toHaveBeenCalledTimes(1)
  })

  it('rejects prepared references for any non-canonical Merchant', async () => {
    const fixture = input({ merchant: { commercialExceptionCode: null } })
    await expect(recordCompareStarted(fixture.value as never)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(fixture.frames.findActiveByMerchantAndId).not.toHaveBeenCalled()
    expect(fixture.events.appendIdempotent).not.toHaveBeenCalled()
  })

  it('rejects cross-tenant frames even when the source reference is otherwise valid', async () => {
    const fixture = input({ frameOwner: 'other-merchant' })
    await expect(recordCompareStarted(fixture.value as never)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(fixture.events.appendIdempotent).not.toHaveBeenCalled()
  })

  it('rejects a prepared reference whose manifest provenance or frame SKU was altered', async () => {
    const altered = preparedDemoReferenceForAsset(PREPARED_DEMO_RESULT_MANIFEST[0], 'rowan-frame', new Date().toISOString())
    const fixture = input({
      resultItems: [{ ...altered, sourceRef: { ...altered.sourceRef, provenanceId: 'forged' } }],
    })
    await expect(recordCompareStarted(fixture.value as never)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(fixture.events.appendIdempotent).not.toHaveBeenCalled()

    const skuMismatch = input({ frameSkus: ['WRONG-SKU', 'VT-DEMO-002'] })
    await expect(recordCompareStarted(skuMismatch.value as never)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})
