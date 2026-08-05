/**
 * Batch-delete expired StoreAsset rows. Blob must be gone (or never existed)
 * before deletedAt is written — see AssetStore.delete.
 */

import type { AssetStore } from './ports/asset-store'

export type CleanupExpiredStoreAssetsResult = {
  scanned: number
  deleted: number
  failed: number
  failures: Array<{ assetId: string; merchantId: string; error?: string }>
}

export async function cleanupExpiredStoreAssets(input: {
  assets: AssetStore
  now?: Date
  limit?: number
  maxFailCount?: number
  backoffMs?: number
}): Promise<CleanupExpiredStoreAssetsResult> {
  const now = input.now ?? new Date()
  const expired = await input.assets.listExpired(now, input.limit ?? 100, {
    maxFailCount: input.maxFailCount,
    backoffMs: input.backoffMs,
  })

  const result: CleanupExpiredStoreAssetsResult = {
    scanned: expired.length,
    deleted: 0,
    failed: 0,
    failures: [],
  }

  for (const asset of expired) {
    const outcome = await input.assets.delete(asset.id, asset.merchantId)
    if (outcome.deleted) {
      result.deleted += 1
    } else if (outcome.retryable) {
      result.failed += 1
      result.failures.push({
        assetId: asset.id,
        merchantId: asset.merchantId,
        error: outcome.error,
      })
    }
  }

  return result
}
