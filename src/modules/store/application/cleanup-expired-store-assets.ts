/**
 * Batch-delete expired StoreAsset rows. Blob must be gone (or never existed)
 * before deletedAt / DELETED status is written.
 * Runs active/pending batches then blocked slow-retry batches for catch-up.
 */

import type { AssetStore } from './ports/asset-store'

export type CleanupExpiredStoreAssetsResult = {
  scanned: number
  deleted: number
  failed: number
  blockedScanned: number
  failures: Array<{ assetId: string; merchantId: string; error?: string }>
}

export async function cleanupExpiredStoreAssets(input: {
  assets: AssetStore
  now?: Date
  limit?: number
  maxRounds?: number
}): Promise<CleanupExpiredStoreAssetsResult> {
  const now = input.now ?? new Date()
  const limit = input.limit ?? 100
  const maxRounds = input.maxRounds ?? 5

  const result: CleanupExpiredStoreAssetsResult = {
    scanned: 0,
    deleted: 0,
    failed: 0,
    blockedScanned: 0,
    failures: [],
  }

  for (let round = 0; round < maxRounds; round++) {
    const expired = await input.assets.listExpired(now, limit, { includeBlocked: false })
    if (expired.length === 0) break
    result.scanned += expired.length
    for (const asset of expired) {
      const outcome = await input.assets.delete(asset.id, asset.merchantId)
      if (outcome.deleted) result.deleted += 1
      else if (outcome.retryable) {
        result.failed += 1
        result.failures.push({
          assetId: asset.id,
          merchantId: asset.merchantId,
          error: outcome.error,
        })
      }
    }
  }

  const blocked = await input.assets.listExpired(now, limit, { includeBlocked: true })
  result.blockedScanned = blocked.length
  for (const asset of blocked) {
    const outcome = await input.assets.delete(asset.id, asset.merchantId)
    if (outcome.deleted) result.deleted += 1
    else if (outcome.retryable) {
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
