import {
  assertNoShopperImageInInsightPayload,
  sanitizeEventMetadata,
  sessionIdAloneIsNotAuthorization,
  createMerchantSessionCapability,
  verifySessionCapability,
  usagePolicyTouchesConsumerCredits,
  selectUsagePolicy,
  buildStoreGenerationIdempotencyKey,
  shouldMarkDeleteBlocked,
  RETENTION_SOFT_FAIL_CAP,
  evaluateStoreDemoAllowance,
  DEFAULT_STORE_DEMO_LIMITS,
} from '@/modules/store/domain'
import { cleanupExpiredStoreAssets } from '@/modules/store/application/cleanup-expired-store-assets'
import { DEFAULT_STORE_ABUSE_LIMITS } from '@/modules/store/application/store-abuse-limits'
import type { AssetStore, DeleteStoreAssetResult, StoreAssetRecord } from '@/modules/store/application'

function makeAsset(overrides: Partial<StoreAssetRecord> = {}): StoreAssetRecord {
  const now = new Date()
  return {
    id: 'asset-1',
    merchantId: 'm1',
    merchantSessionId: 's1',
    ownerType: 'SESSION',
    ownerId: 's1',
    purpose: 'SHOPPER_PHOTO',
    storageKey: 'store/m1/sessions/s1/photo.jpg',
    accessMode: 'PRIVATE_SIGNED',
    providerUrl: 'https://blob.example/photo.jpg',
    expiresAt: new Date(now.getTime() - 1000),
    deletedAt: null,
    retentionStatus: 'ACTIVE',
    deleteFailCount: 0,
    lastDeleteError: null,
    lastDeleteAttemptAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('Store tenant isolation contracts', () => {
  it('rejects treating raw session id as authorization', () => {
    expect(sessionIdAloneIsNotAuthorization()).toBe(true)
    const { token, tokenHash } = createMerchantSessionCapability()
    expect(verifySessionCapability('', tokenHash)).toBe(false)
    expect(verifySessionCapability(token, tokenHash)).toBe(true)
  })

  it('keeps Store Demo usage off consumer credit counters', () => {
    const policy = selectUsagePolicy({
      kind: 'store',
      merchantId: 'm1',
      merchantSessionId: 's1',
      merchantFrameId: 'f1',
    })
    expect(usagePolicyTouchesConsumerCredits(policy)).toBe(false)
  })
})

describe('Store privacy and retention contracts', () => {
  it('rejects sensitive fields in event metadata sanitization', () => {
    const sanitized = sanitizeEventMetadata({
      userImageUrl: 'https://blob/photo.png',
      faceLandmarks: [1, 2, 3],
      rankingVersion: 'store-rank-v1',
    })
    expect(sanitized).toEqual({ rankingVersion: 'store-rank-v1' })
  })

  it('fails closed when insight payload includes shopper image markers', () => {
    expect(() =>
      assertNoShopperImageInInsightPayload({
        sessions: [{ shopperPhoto: 'https://x' }],
      }),
    ).toThrow(/shopper images/i)
  })

  it('does not mark deleted when Blob delete fails (retryable)', async () => {
    const asset = makeAsset()
    const assets: AssetStore = {
      put: jest.fn(),
      getProviderDeliveryUrl: jest.fn(),
      getBytes: jest.fn(),
      assertAccess: jest.fn(),
      listExpired: jest.fn(async (_now, _limit, options) =>
        options?.includeBlocked ? [] : [asset],
      ),
      delete: jest.fn(async (): Promise<DeleteStoreAssetResult> => {
        return { deleted: false, retryable: true, error: 'blob_timeout' }
      }),
    }

    const result = await cleanupExpiredStoreAssets({ assets, now: new Date(), limit: 10, maxRounds: 1 })
    expect(result.scanned).toBe(1)
    expect(result.deleted).toBe(0)
    expect(result.failed).toBe(1)
    expect(assets.delete).toHaveBeenCalledWith('asset-1', 'm1')
  })

  it('still selects blocked assets on slow forever-retry path', async () => {
    const blocked = makeAsset({ id: 'blocked-1', retentionStatus: 'DELETE_BLOCKED', deleteFailCount: 12 })
    const assets: AssetStore = {
      put: jest.fn(),
      getProviderDeliveryUrl: jest.fn(),
      getBytes: jest.fn(),
      assertAccess: jest.fn(),
      listExpired: jest
        .fn()
        .mockImplementation(async (_now, _limit, options) =>
          options?.includeBlocked ? [blocked] : [],
        ),
      delete: jest.fn().mockResolvedValue({ deleted: true, retryable: false }),
    }

    const result = await cleanupExpiredStoreAssets({ assets, maxRounds: 1 })
    expect(result.blockedScanned).toBe(1)
    expect(result.deleted).toBe(1)
    expect(shouldMarkDeleteBlocked(RETENTION_SOFT_FAIL_CAP)).toBe(true)
  })

  it('counts successful Blob deletes and leaves failures retryable', async () => {
    let activeCalls = 0
    const assets: AssetStore = {
      put: jest.fn(),
      getProviderDeliveryUrl: jest.fn(),
      getBytes: jest.fn(),
      assertAccess: jest.fn(),
      listExpired: jest.fn(async (_now, _limit, options) => {
        if (options?.includeBlocked) return []
        activeCalls += 1
        return activeCalls === 1
          ? [makeAsset({ id: 'a1' }), makeAsset({ id: 'a2', merchantId: 'm2' })]
          : []
      }),
      delete: jest
        .fn()
        .mockResolvedValueOnce({ deleted: true, retryable: false })
        .mockResolvedValueOnce({ deleted: false, retryable: true, error: 'network' }),
    }

    const result = await cleanupExpiredStoreAssets({ assets, maxRounds: 1 })
    expect(result.scanned).toBe(2)
    expect(result.deleted).toBe(1)
    expect(result.failed).toBe(1)
  })
})

describe('Store generation idempotency and allowance', () => {
  it('builds stable store generation keys for early reuse checks', () => {
    expect(
      buildStoreGenerationIdempotencyKey({
        merchantSessionId: 's1',
        merchantFrameId: 'f1',
        clientSubmissionId: 'batch:f1',
      }),
    ).toBe('store:s1:f1:batch:f1')
  })

  it('blocks when session attempt ceiling is reached', () => {
    const denied = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession,
    })
    expect(denied.allowed).toBe(false)
  })

  it('defines durable abuse limit defaults for Gate A1', () => {
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxSessionCreatesPerIpPerHour).toBeGreaterThan(0)
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxPhotoUploadsPerIpPerHour).toBeGreaterThan(0)
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxAttemptsPerMerchantPerDay).toBeGreaterThan(0)
  })
})
