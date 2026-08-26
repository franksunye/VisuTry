import { prisma } from '@/lib/prisma'
import { createMerchantSessionCapability } from '@/modules/store/domain'
import { submitStoreFrameTryOn } from '@/modules/store/application/submit-store-tryon'
import { RETENTION_CONFIG } from '@/config/retention'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
} from '@/modules/store/application'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    tryOnTask: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}))

jest.mock('@/modules/store/application/fetch-image-file', () => ({
  fetchImageAsFile: jest.fn().mockResolvedValue(
    new File([new Uint8Array([1, 2, 3])], 'frame.jpg', { type: 'image/jpeg' }),
  ),
}))

const mockedPrisma = prisma as unknown as {
  $transaction: jest.Mock
  tryOnTask: { findMany: jest.Mock; findUnique: jest.Mock }
  user: { findUnique: jest.Mock }
}

function createInput(overrides: {
  userId?: string | null
  sponsoredUsagePolicyKey?: string | null
  merchantSessionId?: string
  clientSubmissionId?: string
} = {}) {
  const capability = createMerchantSessionCapability()
  const merchant: MerchantRepository = {
    findBySlug: jest.fn().mockResolvedValue({
      id: 'merchant-1',
      slug: 'visutry-demo',
      name: 'VisuTry Demo',
      status: 'ACTIVE',
      sponsoredUsagePolicyKey: overrides.sponsoredUsagePolicyKey ?? 'VISUTRY_OWNED',
      tryOnEnabled: true,
      compareEnabled: true,
      maxCompareFrames: 2,
      inquiryEnabled: false,
    }),
    findById: jest.fn(),
    listAllAdmin: jest.fn(),
  }
  const sessions: MerchantSessionRepository = {
    create: jest.fn(),
    findByMerchantAndId: jest.fn().mockResolvedValue({
      id: 'session-1',
      merchantId: 'merchant-1',
      experienceId: 'experience-1',
      anonymousVisitorId: 'visitor-1',
      photoAssetId: 'photo-1',
      capabilityTokenHash: capability.tokenHash,
      locale: 'en',
      status: 'ACTIVE',
      source: 'visutry',
      medium: null,
      campaign: 'visutry-demo-store',
      referrer: null,
      landingUrl: null,
      aiAgentSource: null,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    }),
    touch: jest.fn(),
    markExpired: jest.fn(),
    attachPhotoAsset: jest.fn(),
  }
  const frames: MerchantFrameRepository = {
    findActiveByMerchant: jest.fn(),
    findByMerchantAndId: jest.fn(),
    findActiveByMerchantAndId: jest.fn().mockResolvedValue({
      id: 'frame-1',
      merchantId: 'merchant-1',
      name: 'Internal Browline',
      imageUrl: '/assets/glasses-presets/browline-classic.jpg',
      imageAssetId: null,
      productUrl: null,
      price: null,
      currency: null,
      shape: 'browline',
      color: 'black-gold',
    }),
  }
  const events: MerchantEventRepository = {
    appendIdempotent: jest.fn().mockResolvedValue({ created: true }),
    listByMerchant: jest.fn(),
  }
  const sponsoredUsage = {
    reserve: jest.fn().mockResolvedValue(null),
    consume: jest.fn(),
    release: jest.fn(),
  }
  const generation = {
    findExistingByIdempotencyKey: jest.fn(),
    getStatus: jest.fn(),
    submit: jest.fn().mockResolvedValue({
      taskId: 'task-1',
      status: 'submitted',
      reusedExisting: false,
    }),
  }

  return {
    input: {
      merchants: merchant,
      frames,
      sessions,
      events,
      usage: {
        record: jest.fn(),
        count: jest.fn(),
        countCommerceSessions: jest.fn(),
        countSuccessfulRenders: jest.fn(),
        countSessionSuccessfulRenders: jest.fn(),
        countSessionAttempts: jest.fn(),
      },
      assets: {
        put: jest.fn(),
        getBytes: jest.fn().mockResolvedValue({
          body: new Uint8Array([1, 2, 3]),
          contentType: 'image/jpeg',
        }),
        getProviderDeliveryUrl: jest.fn(),
        delete: jest.fn(),
        assertAccess: jest.fn(),
        listExpired: jest.fn(),
      },
      generation,
      slug: 'visutry-demo',
      merchantSessionId: overrides.merchantSessionId ?? 'session-1',
      capabilityToken: capability.token,
      merchantFrameId: 'frame-1',
      batchId: 'batch-1',
      clientSubmissionId: overrides.clientSubmissionId ?? 'submission-1',
      userId: overrides.userId ?? null,
      sponsoredUsage,
    },
    generation,
    sponsoredUsage,
  }
}

describe('merchant-sponsored signed-in fallback', () => {
  const previousFlag = process.env.MERCHANT_SPONSORED_USAGE_ENABLED
  let createdTaskInput: Record<string, any> | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    createdTaskInput = null
    process.env.MERCHANT_SPONSORED_USAGE_ENABLED = 'true'
    mockedPrisma.tryOnTask.findMany.mockResolvedValue([])
    mockedPrisma.tryOnTask.findUnique.mockResolvedValue(null)
    mockedPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        tryOnTask: {
          findUnique: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, any> }) => {
            createdTaskInput = data
            return { id: 'task-1' }
          }),
        },
        merchantUsageLedger: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        storeAbuseCounter: {
          upsert: jest.fn().mockResolvedValue({ count: 1 }),
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }
      return callback(tx)
    })
  })

  afterAll(() => {
    if (previousFlag === undefined) delete process.env.MERCHANT_SPONSORED_USAGE_ENABLED
    else process.env.MERCHANT_SPONSORED_USAGE_ENABLED = previousFlag
  })

  it('uses the existing consumer quota after sponsored usage is exhausted', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      creditsPurchased: 1,
      creditsUsed: 0,
      freeTrialsUsed: 3,
      premiumUsageCount: 0,
      isPremium: false,
      premiumExpiresAt: null,
      currentSubscriptionType: null,
    })
    const { input, generation, sponsoredUsage } = createInput({ userId: 'user-1' })

    await expect(submitStoreFrameTryOn(input)).resolves.toMatchObject({
      taskId: 'task-1',
      entitlementSource: 'CONSUMER_ENTITLEMENT',
    })

    expect(sponsoredUsage.reserve).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'merchant-1',
      userId: 'user-1',
      usageType: 'SPONSORED_GENERATION',
    }))
    expect(sponsoredUsage.consume).not.toHaveBeenCalled()
    expect(sponsoredUsage.release).not.toHaveBeenCalled()
    expect(generation.submit).toHaveBeenCalledWith(expect.objectContaining({
      usagePolicy: { kind: 'consumer_quota' },
      userId: 'user-1',
      expiresAt: expect.any(Date),
      onProviderAccepted: undefined,
    }))
    expect(createdTaskInput).toEqual(expect.objectContaining({
      userId: 'user-1',
      expiresAt: expect.any(Date),
      metadata: expect.objectContaining({ usagePolicyKind: 'consumer_quota' }),
    }))
    expect(createdTaskInput?.expiresAt?.getTime()).toBeGreaterThan(
      Date.now() + (RETENTION_CONFIG.CREDITS_USER - 10) * 24 * 60 * 60 * 1000,
    )
  })

  it('authorizes the first eligible Try-On as merchant-sponsored and consumes its reservation after provider acceptance', async () => {
    const { input, generation, sponsoredUsage } = createInput()
    sponsoredUsage.reserve.mockResolvedValue({ id: 'reservation-1', status: 'RESERVED' })
    generation.submit.mockImplementation(async ({ onProviderAccepted }: { onProviderAccepted?: () => Promise<void> }) => {
      await onProviderAccepted?.()
      return { taskId: 'task-1', status: 'submitted', reusedExisting: false }
    })

    await expect(submitStoreFrameTryOn(input)).resolves.toMatchObject({
      taskId: 'task-1',
      entitlementSource: 'MERCHANT_SPONSORED',
    })

    expect(generation.submit).toHaveBeenCalledWith(expect.objectContaining({
      usagePolicy: { kind: 'merchant_sponsored', merchantId: 'merchant-1' },
      userId: null,
    }))
    expect(sponsoredUsage.consume).toHaveBeenCalledWith('reservation-1')
  })

  it('returns anonymous continuation state after the sponsored allowance is exhausted, regardless of a new task key', async () => {
    const { input, generation, sponsoredUsage } = createInput({
      clientSubmissionId: 'submission-2',
    })
    sponsoredUsage.reserve.mockResolvedValue(null)

    await expect(submitStoreFrameTryOn(input)).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
      httpStatus: 401,
    })
    expect(generation.submit).not.toHaveBeenCalled()
  })

  it('does not dispatch when the signed-in user has no consumer entitlement', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      creditsPurchased: 0,
      creditsUsed: 0,
      freeTrialsUsed: 3,
      premiumUsageCount: 0,
      isPremium: false,
      premiumExpiresAt: null,
      currentSubscriptionType: null,
    })
    const { input, generation, sponsoredUsage } = createInput({ userId: 'user-1' })

    await expect(submitStoreFrameTryOn(input)).rejects.toMatchObject({
      code: 'CONSUMER_CREDITS_REQUIRED',
      httpStatus: 402,
    })

    expect(sponsoredUsage.reserve).toHaveBeenCalledTimes(1)
    expect(generation.submit).not.toHaveBeenCalled()
  })
})
