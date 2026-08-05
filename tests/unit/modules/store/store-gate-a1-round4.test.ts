/**
 * Round-4 Gate A1 tests: stale claim takeover, result CAS helpers, retention targets.
 */

import {
  buildDispatchLeaseFields,
  isBlobConflictError,
  isDispatchLeaseExpired,
  isResultPersistLeaseActive,
  resolvePlaceholderReuseAction,
  STORE_DISPATCH_LEASE_MS,
} from '@/modules/store/application/store-dispatch-lease'
import { collectTryOnRetentionDeleteTargets } from '@/modules/store/application/store-retention-targets'

describe('Store dispatch lease / placeholder reuse', () => {
  it('marks lease expired after lease window', () => {
    const claimedAt = new Date('2026-08-05T08:00:00.000Z')
    const lease = buildDispatchLeaseFields(claimedAt)
    expect(isDispatchLeaseExpired(lease, claimedAt)).toBe(false)
    expect(
      isDispatchLeaseExpired(
        lease,
        new Date(claimedAt.getTime() + STORE_DISPATCH_LEASE_MS + 1),
      ),
    ).toBe(true)
  })

  it('waits while lease is active on pending placeholder', () => {
    const now = new Date('2026-08-05T08:00:00.000Z')
    const lease = buildDispatchLeaseFields(now)
    expect(
      resolvePlaceholderReuseAction({
        status: 'PENDING',
        userImageUrl: 'pending://user',
        metadata: lease,
        now,
      }),
    ).toBe('wait_inflight')
  })

  it('takes over expired pending placeholder', () => {
    const claimedAt = new Date('2026-08-05T08:00:00.000Z')
    const lease = buildDispatchLeaseFields(claimedAt)
    expect(
      resolvePlaceholderReuseAction({
        status: 'PENDING',
        userImageUrl: 'pending://user',
        metadata: lease,
        now: new Date(claimedAt.getTime() + STORE_DISPATCH_LEASE_MS + 5_000),
      }),
    ).toBe('takeover')
  })

  it('returns existing when already dispatched or failed', () => {
    expect(
      resolvePlaceholderReuseAction({
        status: 'PROCESSING',
        userImageUrl: 'https://blob.example/user.png',
        metadata: { externalTaskId: 'ext_1' },
      }),
    ).toBe('return_existing')

    expect(
      resolvePlaceholderReuseAction({
        status: 'FAILED',
        userImageUrl: 'pending://user',
        metadata: { claimFailureReason: 'boom' },
      }),
    ).toBe('return_existing')
  })
})

describe('Store result persist conflict helpers', () => {
  it('detects blob already-exists conflicts', () => {
    expect(isBlobConflictError(new Error('Blob already exists at pathname'))).toBe(true)
    expect(
      isBlobConflictError(
        Object.assign(new Error('precondition failed'), {
          name: 'BlobPreconditionFailedError',
        }),
      ),
    ).toBe(true)
    expect(isBlobConflictError(new Error('network timeout'))).toBe(false)
  })

  it('treats result persist lease as active inside window', () => {
    const now = new Date('2026-08-05T08:00:00.000Z')
    expect(
      isResultPersistLeaseActive(
        {
          resultPersistLeaseUntil: new Date(now.getTime() + 30_000).toISOString(),
        },
        now,
      ),
    ).toBe(true)
    expect(
      isResultPersistLeaseActive(
        {
          resultPersistLeaseUntil: new Date(now.getTime() - 1).toISOString(),
        },
        now,
      ),
    ).toBe(false)
  })
})

describe('TryOn retention per-field delete targets', () => {
  it('keeps URL fallbacks when only some pathnames exist', () => {
    const targets = collectTryOnRetentionDeleteTargets({
      userImageUrl: 'https://blob.vercel-storage.com/user-old.png',
      itemImageUrl: 'https://blob.vercel-storage.com/item-old.png',
      glassesImageUrl: 'https://blob.vercel-storage.com/glasses.png',
      resultImageUrl: 'https://blob.vercel-storage.com/result.png',
      metadata: {
        userPathname: 'tryon/user/a.png',
        itemPathname: 'tryon/item/b.png',
        // result/glasses intentionally missing pathnames
      },
    })

    expect(targets).toEqual([
      'tryon/user/a.png',
      'tryon/item/b.png',
      'https://blob.vercel-storage.com/glasses.png',
      'https://blob.vercel-storage.com/result.png',
    ])
  })

  it('skips pending placeholders and dedupes', () => {
    const targets = collectTryOnRetentionDeleteTargets({
      userImageUrl: 'pending://user',
      itemImageUrl: 'https://blob.vercel-storage.com/item.png',
      resultImageUrl: 'https://blob.vercel-storage.com/item.png',
      metadata: {},
    })
    expect(targets).toEqual(['https://blob.vercel-storage.com/item.png'])
  })
})
