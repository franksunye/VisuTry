import { prisma } from '@/lib/prisma'
import { recordCompareStarted } from '@/modules/store/application/record-compare-started'
import { recordFrameSelections } from '@/modules/store/application/record-frame-selections'
import { recordStoreIntent } from '@/modules/store/application/record-store-intent'
import {
  reserveStoreBatchFrame,
  submitStoreFrameTryOn,
} from '@/modules/store/application/submit-store-tryon'
import {
  maxSelectableStoreFrames,
  resolveStoreExperiencePolicy,
} from '@/modules/store/domain/experience-policy'
import { createMerchantSessionCapability } from '@/modules/store/domain'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantIntentRepository,
  MerchantRepository,
  MerchantSessionRecord,
  MerchantSessionRepository,
} from '@/modules/store/application'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: { count: jest.fn(), findMany: jest.fn() },
  },
}))

function merchant(overrides: Record<string, unknown> = {}): MerchantRepository {
  return {
    findBySlug: jest.fn().mockResolvedValue({
      id: 'merchant-1',
      slug: 'ello-sunglasses',
      name: 'ello sunglasses',
      status: 'ACTIVE',
      ...overrides,
    }),
    findById: jest.fn(),
    listAllAdmin: jest.fn(),
  }
}

function sessionRepository(
  capabilityTokenHash: string,
  photoAssetId: string | null = null,
): MerchantSessionRepository {
  const session: MerchantSessionRecord = {
    id: 'session-1',
    merchantId: 'merchant-1',
    anonymousVisitorId: null,
    photoAssetId,
    capabilityTokenHash,
    locale: 'en',
    status: 'ACTIVE',
    source: null,
    medium: null,
    campaign: null,
    referrer: null,
    landingUrl: null,
    aiAgentSource: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
  }
  return {
    create: jest.fn(),
    findByMerchantAndId: jest.fn().mockResolvedValue(session),
    touch: jest.fn(),
    markExpired: jest.fn(),
    attachPhotoAsset: jest.fn(),
  }
}

function frames(frameId = 'frame-1'): MerchantFrameRepository {
  const frame = {
    id: frameId,
    merchantId: 'merchant-1',
    name: 'Frame',
    imageUrl: 'https://example.com/frame.jpg',
    imageAssetId: null,
    productUrl: null,
    price: null,
    currency: null,
    shape: 'round',
  }
  return {
    findActiveByMerchant: jest.fn(),
    findByMerchantAndId: jest.fn().mockResolvedValue(frame),
    findActiveByMerchantAndId: jest.fn().mockResolvedValue(frame),
  }
}

function events(): MerchantEventRepository {
  return {
    appendIdempotent: jest.fn().mockResolvedValue({ created: true }),
    listByMerchant: jest.fn(),
  }
}

describe('Campaign Experience Policy v1', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses system defaults and limits disabled-compare selection to one frame', () => {
    const policy = resolveStoreExperiencePolicy({})
    expect(policy).toEqual({
      tryOnEnabled: true,
      compareEnabled: true,
      maxCompareFrames: 2,
      inquiryEnabled: false,
    })
    expect(maxSelectableStoreFrames({ ...policy, compareEnabled: false })).toBe(1)
  })

  it('rejects Store Try-On before photo or generation work when disabled', async () => {
    const merchants = merchant({ tryOnEnabled: false })
    await expect(
      submitStoreFrameTryOn({
        merchants,
        frames: frames(),
        sessions: sessionRepository('unused'),
        events: events(),
        usage: {} as never,
        assets: {} as never,
        generation: {} as never,
        slug: 'ello-sunglasses',
        merchantSessionId: 'session-1',
        capabilityToken: null,
        merchantFrameId: 'frame-1',
        batchId: 'batch-1',
        clientSubmissionId: 'submit-1',
      }),
    ).rejects.toMatchObject({ code: 'CAPABILITY_DISABLED', httpStatus: 403 })
  })

  it('keeps Favorite available when Inquiry is disabled', async () => {
    const capability = createMerchantSessionCapability()
    const intents = {
      createIdempotent: jest.fn().mockResolvedValue({
        record: {
          id: 'intent-1',
          merchantId: 'merchant-1',
          merchantSessionId: 'session-1',
          merchantFrameId: 'frame-1',
          type: 'FAVORITE',
          idempotencyKey: 'favorite-1',
          email: null,
          name: null,
          note: null,
          createdAt: new Date(),
        },
        created: true,
      }),
      listByMerchant: jest.fn(),
    } as MerchantIntentRepository

    const result = await recordStoreIntent({
      merchants: merchant({ inquiryEnabled: false }),
      frames: frames(),
      sessions: sessionRepository(capability.tokenHash),
      intents,
      events: events(),
      slug: 'ello-sunglasses',
      merchantSessionId: 'session-1',
      capabilityToken: capability.token,
      type: 'FAVORITE',
      merchantFrameId: 'frame-1',
      clientActionId: 'favorite-1',
    })

    expect(result).toMatchObject({ type: 'FAVORITE', created: true })
    expect(intents.createIdempotent).toHaveBeenCalled()
  })

  it('rejects a third distinct batch frame before calling generation', async () => {
    const capability = createMerchantSessionCapability()
    ;(prisma.tryOnTask.findMany as jest.Mock).mockResolvedValue([
      { merchantFrameId: 'frame-1', batchId: 'batch-1' },
      { merchantFrameId: 'frame-2', batchId: 'batch-1' },
    ])
    const generation = {
      submit: jest.fn(),
      findExistingByIdempotencyKey: jest.fn(),
    } as never

    await expect(
      submitStoreFrameTryOn({
        merchants: merchant({ maxCompareFrames: 2 }),
        frames: frames('frame-3'),
        sessions: sessionRepository(capability.tokenHash, 'photo-1'),
        events: events(),
        usage: {} as never,
        assets: {} as never,
        generation,
        slug: 'ello-sunglasses',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        merchantFrameId: 'frame-3',
        batchId: 'batch-1',
        clientSubmissionId: 'submit-3',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', httpStatus: 400 })

    expect((generation as { submit: jest.Mock }).submit).not.toHaveBeenCalled()
  })

  it('serializes concurrent batch reservations so only two tasks dispatch', async () => {
    const committedTasks: Array<{ merchantFrameId: string; batchId: string }> = []
    let transactionQueue = Promise.resolve()
    let taskSequence = 0
    const runTransaction = async (
      callback: (tx: unknown) => Promise<unknown>,
    ) => {
      const previous = transactionQueue
      let release!: () => void
      transactionQueue = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous

      const pendingTasks: Array<{ merchantFrameId: string; batchId: string }> = []
      const tx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        tryOnTask: {
          findMany: jest.fn().mockResolvedValue([...committedTasks]),
          create: jest.fn().mockImplementation(async ({ data }: { data: { merchantFrameId: string; batchId: string } }) => {
            pendingTasks.push({ merchantFrameId: data.merchantFrameId, batchId: data.batchId })
            taskSequence += 1
            return { id: `task-${taskSequence}` }
          }),
        },
      }

      try {
        const result = await callback(tx)
        committedTasks.push(...pendingTasks)
        return result
      } finally {
        release()
      }
    }

    const dispatched: string[] = []
    const submit = async (merchantFrameId: string) => {
      try {
        await runTransaction(async (tx) => {
          await reserveStoreBatchFrame(tx as never, {
            merchantId: 'merchant-1',
            merchantSessionId: 'session-1',
            merchantFrameId,
            batchId: 'batch-1',
            maxCompareFrames: 2,
          })
          await (tx as { tryOnTask: { create: (input: unknown) => Promise<unknown> } }).tryOnTask.create({
            data: { merchantFrameId, batchId: 'batch-1' },
          })
        })
        dispatched.push(merchantFrameId)
      } catch (error) {
        expect(error).toMatchObject({ code: 'VALIDATION_ERROR', httpStatus: 400 })
      }
    }

    await Promise.all(['frame-1', 'frame-2', 'frame-3'].map(submit))

    expect(committedTasks).toHaveLength(2)
    expect(dispatched).toHaveLength(2)
    expect(new Set(dispatched)).toEqual(new Set(['frame-1', 'frame-2']))
  })

  it('rejects compare when disabled and rejects three frames for a two-frame policy', async () => {
    const capability = createMerchantSessionCapability()
    const disabled = merchant({ compareEnabled: false })
    await expect(
      recordCompareStarted({
        merchants: disabled,
        sessions: sessionRepository(capability.tokenHash),
        events: events(),
        slug: 'ello-sunglasses',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        clientActionId: 'compare-1',
      }),
    ).rejects.toMatchObject({ code: 'CAPABILITY_DISABLED', httpStatus: 403 })

    ;(prisma.tryOnTask.count as jest.Mock).mockResolvedValueOnce(3)
    await expect(
      recordCompareStarted({
        merchants: merchant({ maxCompareFrames: 2 }),
        sessions: sessionRepository(capability.tokenHash),
        events: events(),
        slug: 'ello-sunglasses',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        clientActionId: 'compare-2',
        frameIds: ['frame-1', 'frame-2', 'frame-3'],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', httpStatus: 400 })

    ;(prisma.tryOnTask.count as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
    const allowed = await recordCompareStarted({
      merchants: merchant({ maxCompareFrames: 2 }),
      sessions: sessionRepository(capability.tokenHash),
      events: events(),
      slug: 'ello-sunglasses',
      merchantSessionId: 'session-1',
      capabilityToken: capability.token,
      clientActionId: 'compare-3',
      frameIds: ['frame-1', 'frame-2'],
    })
    expect(allowed.recorded).toBe(true)
  })

  it('rejects more selected frames than the shared Store policy', async () => {
    const capability = createMerchantSessionCapability()
    await expect(
      recordFrameSelections({
        merchants: merchant({ maxCompareFrames: 2 }),
        frames: frames(),
        sessions: sessionRepository(capability.tokenHash),
        events: events(),
        slug: 'ello-sunglasses',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        frameIds: ['frame-1', 'frame-2', 'frame-3'],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', httpStatus: 400 })
  })

  it('rejects Inquiry server-side when disabled', async () => {
    const capability = createMerchantSessionCapability()
    await expect(
      recordStoreIntent({
        merchants: merchant({ inquiryEnabled: false }),
        frames: frames(),
        sessions: sessionRepository(capability.tokenHash),
        intents: {} as MerchantIntentRepository,
        events: events(),
        slug: 'ello-sunglasses',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        type: 'INQUIRY',
        merchantFrameId: 'frame-1',
        clientActionId: 'inquiry-1',
        email: 'shopper@example.com',
      }),
    ).rejects.toMatchObject({ code: 'CAPABILITY_DISABLED', httpStatus: 403 })
  })
})
