/**
 * Store Demo allowance configuration.
 * Adjust limits here without changing shopper UI code.
 */

import {
  DEFAULT_STORE_DEMO_LIMITS,
  type StoreDemoLimits,
} from '../../domain/usage-policy'

export function getStoreDemoLimits(
  overrides?: Partial<StoreDemoLimits>,
): StoreDemoLimits {
  return {
    ...DEFAULT_STORE_DEMO_LIMITS,
    ...overrides,
  }
}

/** Shopper asset retention for Store Demo (days). */
export const STORE_DEMO_ASSET_RETENTION_DAYS = 7

export function computeStoreAssetExpiresAt(
  from: Date = new Date(),
  retentionDays: number = STORE_DEMO_ASSET_RETENTION_DAYS,
): Date {
  const expiresAt = new Date(from)
  expiresAt.setDate(expiresAt.getDate() + retentionDays)
  return expiresAt
}
