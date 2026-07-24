export type JwtSyncReason = 'first-login' | 'missing-data' | 'manual-update' | 'periodic'

interface JwtSyncDecisionInput {
  hasUser: boolean
  trigger?: string
  hasRequiredUserData: boolean
  lastSyncTime?: number
  lastSyncAttemptTime?: number
  now?: number
  updateIntervalMs?: number
  periodicIntervalMs?: number
  failureCooldownMs?: number
}
export interface JwtSyncDecision {
  shouldSync: boolean
  reason?: JwtSyncReason
}

const DEFAULT_UPDATE_INTERVAL_MS = 30_000
const DEFAULT_PERIODIC_INTERVAL_MS = 15 * 60_000
const DEFAULT_FAILURE_COOLDOWN_MS = 60_000

/**
 * Decide whether JWT user fields should be refreshed from the database.
 * `lastSyncTime` is the last successful DB refresh; JWT `iat` is deliberately
 * excluded because NextAuth rewrites it whenever it reissues the session JWT.
 */
export function getJwtSyncDecision({
  hasUser,
  trigger,
  hasRequiredUserData,
  lastSyncTime = 0,
  lastSyncAttemptTime = 0,
  now = Date.now(),
  updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS,
  periodicIntervalMs = DEFAULT_PERIODIC_INTERVAL_MS,
  failureCooldownMs = DEFAULT_FAILURE_COOLDOWN_MS,
}: JwtSyncDecisionInput): JwtSyncDecision {
  if (hasUser) {
    return { shouldSync: true, reason: 'first-login' }
  }

  const lastAttemptFailed = lastSyncAttemptTime > lastSyncTime
  if (lastAttemptFailed && now - lastSyncAttemptTime < failureCooldownMs) {
    return { shouldSync: false }
  }

  if (!hasRequiredUserData) {
    return { shouldSync: true, reason: 'missing-data' }
  }

  if (trigger === 'update' && now - lastSyncTime > updateIntervalMs) {
    return { shouldSync: true, reason: 'manual-update' }
  }

  if (now - lastSyncTime > periodicIntervalMs) {
    return { shouldSync: true, reason: 'periodic' }
  }

  return { shouldSync: false }
}
