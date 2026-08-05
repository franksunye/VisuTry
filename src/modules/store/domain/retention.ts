/**
 * Shared retention selection rules for StoreAsset and TryOnTask blobs.
 * Soft fail cap moves rows to DELETE_BLOCKED, but blocked rows remain
 * selectable on a slow forever-retry schedule.
 */

export const RETENTION_SOFT_FAIL_CAP = 10
export const RETENTION_ACTIVE_BACKOFF_MS = 15 * 60 * 1000
export const RETENTION_BLOCKED_BACKOFF_MS = 24 * 60 * 60 * 1000

export type RetentionSelectMode = 'active_or_pending' | 'blocked_slow'

export function retentionBackoffMs(mode: RetentionSelectMode): number {
  return mode === 'blocked_slow' ? RETENTION_BLOCKED_BACKOFF_MS : RETENTION_ACTIVE_BACKOFF_MS
}

export function shouldMarkDeleteBlocked(failCountAfterIncrement: number): boolean {
  return failCountAfterIncrement >= RETENTION_SOFT_FAIL_CAP
}
