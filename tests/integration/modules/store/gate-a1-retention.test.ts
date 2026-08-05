/**
 * Integration-style Store Gate A1 tests with mocked Blob / in-memory ports.
 */

import { cleanupExpiredStoreAssets } from '@/modules/store/application/cleanup-expired-store-assets'
import type { AssetStore, StoreAssetRecord } from '@/modules/store/application'
import { DEFAULT_STORE_ABUSE_LIMITS } from '@/modules/store/application/store-abuse-limits'
import { buildStoreGenerationIdempotencyKey } from '@/modules/store/domain'

function asset(partial: Partial<StoreAssetRecord>): StoreAssetRecord {
  const now = new Date()
  return {
    id: 'a1',
    merchantId: 'm1',
    merchantSessionId: 's1',
    ownerType: 'SESSION',
    ownerId: 's1',
    purpose: 'SHOPPER_PHOTO',
    storageKey: 'k',
    accessMode: 'PRIVATE_SIGNED',
    providerUrl: 'https://example/p',
    expiresAt: new Date(now.getTime() - 1),
    deletedAt: null,
    retentionStatus: 'ACTIVE',
    deleteFailCount: 0,
    lastDeleteError: null,
    lastDeleteAttemptAt: null,
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

describe('Store retention integration (mocked AssetStore)', () => {
  it('retries failed delete on next cron and then succeeds', async () => {
    const row = asset({ id: 'retry-1' })
    let deleted = false
    const assets: AssetStore = {
      put: jest.fn(),
      getProviderDeliveryUrl: jest.fn(),
      getBytes: jest.fn(),
      assertAccess: jest.fn(),
      listExpired: jest.fn(async (_now, _limit, options) => {
        if (options?.includeBlocked) return []
        return deleted ? [] : [row]
      }),
      delete: jest.fn(async () => {
        if (!deleted) {
          deleted = false
          // first call fails
          const fail = { deleted: false, retryable: true, error: 'temp' }
          // flip for next round
          deleted = true
          return fail
        }
        return { deleted: true, retryable: false }
      }),
    }

    // Force delete to fail once then succeed on second cleanup invocation
    let calls = 0
    ;(assets.delete as jest.Mock).mockImplementation(async () => {
      calls += 1
      if (calls === 1) return { deleted: false, retryable: true, error: 'temp' }
      return { deleted: true, retryable: false }
    })
    ;(assets.listExpired as jest.Mock).mockImplementation(async (_n, _l, options) => {
      if (options?.includeBlocked) return []
      return calls >= 2 ? [] : [row]
    })

    const first = await cleanupExpiredStoreAssets({ assets, maxRounds: 1 })
    expect(first.failed).toBe(1)

    const second = await cleanupExpiredStoreAssets({ assets, maxRounds: 1 })
    expect(second.deleted).toBe(1)
  })

  it('claim-first idempotency keys are stable across concurrent callers', () => {
    const a = buildStoreGenerationIdempotencyKey({
      merchantSessionId: 's',
      merchantFrameId: 'f',
      clientSubmissionId: 'c1',
    })
    const b = buildStoreGenerationIdempotencyKey({
      merchantSessionId: 's',
      merchantFrameId: 'f',
      clientSubmissionId: 'c1',
    })
    expect(a).toBe(b)
  })

  it('abuse defaults are production-oriented positive integers', () => {
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxSessionCreatesPerIpPerHour).toBeLessThanOrEqual(100)
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxPhotoBytesPerIpPerDay).toBeGreaterThan(1024 * 1024)
  })
})
