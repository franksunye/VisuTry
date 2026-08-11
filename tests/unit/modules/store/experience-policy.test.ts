import { prisma } from '@/lib/prisma'
import { recordCompareStarted } from '@/modules/store/application/record-compare-started'
import { recordFrameSelections } from '@/modules/store/application/record-frame-selections'
import { recordStoreIntent } from '@/modules/store/application/record-store-intent'
import { submitStoreFrameTryOn } from '@/modules/store/application/submit-store-tryon'
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
    tryOnTask: { count: jest.fn() },
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

function sessionRepository(capabilityTokenHash: string): MerchantSessionRepository {
  const session: MerchantSessionRecord = {
    id: 'session-1',
    merchantId: 'merchant-1',
    anonymousVisitorId: null,
    photoAssetId: null,
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

function frames(): MerchantFrameRepository {
  return {
    findActiveByMerchant: jest.fn(),
    findByMerchantAndId: jest.fn(),
    findActiveByMerchantAndId: jest.fn().mockResolvedValue({ id: 'frame-1', merchantId: 'merchant-1' }),
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
