import {
  assertNoShopperImageInInsightPayload,
  buildIntentIdempotencyKey,
  createMerchantSessionCapability,
  sanitizeEventMetadata,
  StoreDomainError,
} from '@/modules/store/domain'
import { recordStoreIntent } from '@/modules/store/application/record-store-intent'
import { calculateTrendDelta } from '@/modules/store/application/get-merchant-insights'
import { parseRecordIntentRequest } from '@/modules/store/contracts'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantIntentRepository,
  MerchantRepository,
  MerchantSessionRecord,
  MerchantSessionRepository,
} from '@/modules/store/application'

function makeSession(capabilityTokenHash: string): MerchantSessionRecord {
  return {
    id: 'session-1',
    merchantId: 'merchant-1',
    anonymousVisitorId: null,
    photoAssetId: null,
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
    capabilityTokenHash,
  }
}

describe('Store intent idempotency and insight privacy', () => {
  it('builds stable intent idempotency keys', () => {
    expect(
      buildIntentIdempotencyKey({
        type: 'FAVORITE',
        merchantId: 'm1',
        merchantSessionId: 's1',
        merchantFrameId: 'f1',
        clientActionId: 'act-1',
      }),
    ).toBe('intent:FAVORITE:m1:s1:f1:act-1')
  })

  it('calculates finite period deltas and treats a zero baseline as new activity', () => {
    expect(calculateTrendDelta(12, 10)).toBe(20)
    expect(calculateTrendDelta(8, 10)).toBe(-20)
    expect(calculateTrendDelta(10, 10)).toBe(0)
    expect(calculateTrendDelta(3, 0)).toBeNull()
    expect(calculateTrendDelta(0, 0)).toBe(0)
  })

  it('parses intent contracts including productUrl', () => {
    const parsed = parseRecordIntentRequest({
      merchantSlug: 'luna-optical',
      merchantSessionId: 's1',
      type: 'PRODUCT_CLICK',
      merchantFrameId: 'f1',
      clientActionId: 'click-1',
      productUrl: 'https://example.com/frames/1',
      locale: 'en',
    })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.data.productUrl).toBe('https://example.com/frames/1')
    }
  })

  it('records favorite once for the same clientActionId', async () => {
    const capability = createMerchantSessionCapability()
    const session = makeSession(capability.tokenHash)
    const createIdempotent = jest
      .fn()
      .mockResolvedValueOnce({
        record: {
          id: 'intent-1',
          type: 'FAVORITE',
          merchantId: 'merchant-1',
          merchantSessionId: 'session-1',
          merchantFrameId: 'frame-1',
          idempotencyKey: 'intent:FAVORITE:merchant-1:session-1:frame-1:fav-1',
          email: null,
          name: null,
          note: null,
          createdAt: new Date(),
        },
        created: true,
      })
      .mockResolvedValueOnce({
        record: {
          id: 'intent-1',
          type: 'FAVORITE',
          merchantId: 'merchant-1',
          merchantSessionId: 'session-1',
          merchantFrameId: 'frame-1',
          idempotencyKey: 'intent:FAVORITE:merchant-1:session-1:frame-1:fav-1',
          email: null,
          name: null,
          note: null,
          createdAt: new Date(),
        },
        created: false,
      })

    const merchants: MerchantRepository = {
      findBySlug: jest.fn().mockResolvedValue({
        id: 'merchant-1',
        slug: 'luna-optical',
        name: 'Luna Optical',
        status: 'ACTIVE',
        inquiryEnabled: true,
      }),
      findById: jest.fn(),
      listAllAdmin: jest.fn(),
    }
    const frames: MerchantFrameRepository = {
      findByMerchantAndId: jest.fn().mockResolvedValue({ id: 'frame-1', merchantId: 'merchant-1' }),
      findActiveByMerchant: jest.fn(),
      findActiveByMerchantAndId: jest.fn(),
    }
    const sessions: MerchantSessionRepository = {
      create: jest.fn(),
      findByMerchantAndId: jest.fn().mockResolvedValue(session),
      touch: jest.fn(),
      markExpired: jest.fn(),
      attachPhotoAsset: jest.fn(),
    }
    const intents: MerchantIntentRepository = {
      createIdempotent,
      listByMerchant: jest.fn(),
    }
    const events: MerchantEventRepository = {
      appendIdempotent: jest.fn().mockResolvedValue({ created: true }),
      listByMerchant: jest.fn(),
    }

    const first = await recordStoreIntent({
      merchants,
      frames,
      sessions,
      intents,
      events,
      slug: 'luna-optical',
      merchantSessionId: 'session-1',
      capabilityToken: capability.token,
      type: 'FAVORITE',
      merchantFrameId: 'frame-1',
      clientActionId: 'fav-1',
    })
    const second = await recordStoreIntent({
      merchants,
      frames,
      sessions,
      intents,
      events,
      slug: 'luna-optical',
      merchantSessionId: 'session-1',
      capabilityToken: capability.token,
      type: 'FAVORITE',
      merchantFrameId: 'frame-1',
      clientActionId: 'fav-1',
    })

    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(first.intentId).toBe(second.intentId)
    expect(createIdempotent).toHaveBeenCalledTimes(2)
    expect(createIdempotent.mock.calls[0][0].idempotencyKey).toBe(
      createIdempotent.mock.calls[1][0].idempotencyKey,
    )
  })

  it('requires a valid email for inquiries', async () => {
    const capability = createMerchantSessionCapability()
    const session = makeSession(capability.tokenHash)
    const merchants: MerchantRepository = {
      findBySlug: jest.fn().mockResolvedValue({
        id: 'merchant-1',
        slug: 'luna-optical',
        name: 'Luna Optical',
        status: 'ACTIVE',
        inquiryEnabled: true,
      }),
      findById: jest.fn(),
      listAllAdmin: jest.fn(),
    }
    const frames: MerchantFrameRepository = {
      findByMerchantAndId: jest.fn().mockResolvedValue({ id: 'frame-1', merchantId: 'merchant-1' }),
      findActiveByMerchant: jest.fn(),
      findActiveByMerchantAndId: jest.fn(),
    }
    const sessions: MerchantSessionRepository = {
      create: jest.fn(),
      findByMerchantAndId: jest.fn().mockResolvedValue(session),
      touch: jest.fn(),
      markExpired: jest.fn(),
      attachPhotoAsset: jest.fn(),
    }

    await expect(
      recordStoreIntent({
        merchants,
        frames,
        sessions,
        intents: { createIdempotent: jest.fn(), listByMerchant: jest.fn() },
        events: { appendIdempotent: jest.fn(), listByMerchant: jest.fn() },
        slug: 'luna-optical',
        merchantSessionId: 'session-1',
        capabilityToken: capability.token,
        type: 'INQUIRY',
        merchantFrameId: 'frame-1',
        clientActionId: 'inq-1',
        email: 'not-an-email',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('strips sensitive keys from event metadata', () => {
    const sanitized = sanitizeEventMetadata({
      intentId: 'i1',
      email: 'shopper@example.com',
      photoUrl: 'https://blob.example/shopper.jpg',
      faceLandmarks: { x: 1 },
    })
    expect(sanitized).toEqual({ intentId: 'i1' })
  })

  it('rejects insight payloads that embed shopper image markers', () => {
    expect(() =>
      assertNoShopperImageInInsightPayload({
        metrics: { sessions: 1 },
        leak: { shopperPhoto: 'https://blob.example/x.jpg' },
      }),
    ).toThrow(/shopper images/i)

    expect(() =>
      assertNoShopperImageInInsightPayload({
        metrics: {
          sessions: 3,
          photosUploaded: 2,
          favorites: 1,
        },
        topFrames: [{ name: 'Frame A', imageUrl: 'https://cdn.example/catalog.jpg' }],
        recentSessions: [{ shortLabel: 'Session abc123', favorited: true, fitScore: 92 }],
        recentInquiries: [{ name: 'Sarah J.', initials: 'SJ', email: 'sarah@example.com' }],
      }),
    ).not.toThrow()
  })

  it('maps domain validation failures to StoreDomainError', () => {
    const err = new StoreDomainError('VALIDATION_ERROR', 'bad', 400)
    expect(err.httpStatus).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
  })
})
