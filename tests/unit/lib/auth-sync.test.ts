import { getJwtSyncDecision } from '@/lib/auth-sync'

const NOW = 10_000_000

describe('getJwtSyncDecision', () => {
  it('syncs on first login', () => {
    expect(getJwtSyncDecision({
      hasUser: true,
      hasRequiredUserData: false,
      now: NOW,
    })).toEqual({ shouldSync: true, reason: 'first-login' })
  })

  it('syncs a legacy token with missing user data', () => {
    expect(getJwtSyncDecision({
      hasUser: false,
      hasRequiredUserData: false,
      lastSyncTime: NOW - 1_000,
      now: NOW,
    })).toEqual({ shouldSync: true, reason: 'missing-data' })
  })

  it('rate-limits explicit updates from the last successful sync', () => {
    expect(getJwtSyncDecision({
      hasUser: false,
      trigger: 'update',
      hasRequiredUserData: true,
      lastSyncTime: NOW - 30_000,
      now: NOW,
    })).toEqual({ shouldSync: false })

    expect(getJwtSyncDecision({
      hasUser: false,
      trigger: 'update',
      hasRequiredUserData: true,
      lastSyncTime: NOW - 30_001,
      now: NOW,
    })).toEqual({ shouldSync: true, reason: 'manual-update' })
  })

  it('bases periodic sync on the last successful DB sync', () => {
    expect(getJwtSyncDecision({
      hasUser: false,
      hasRequiredUserData: true,
      lastSyncTime: NOW - 15 * 60_000,
      now: NOW,
    })).toEqual({ shouldSync: false })

    expect(getJwtSyncDecision({
      hasUser: false,
      hasRequiredUserData: true,
      lastSyncTime: NOW - 15 * 60_000 - 1,
      now: NOW,
    })).toEqual({ shouldSync: true, reason: 'periodic' })
  })

  it('cools down retries after a failed DB sync while retaining token data', () => {
    expect(getJwtSyncDecision({
      hasUser: false,
      hasRequiredUserData: true,
      lastSyncTime: NOW - 20 * 60_000,
      lastSyncAttemptTime: NOW - 10_000,
      now: NOW,
    })).toEqual({ shouldSync: false })

    expect(getJwtSyncDecision({
      hasUser: false,
      hasRequiredUserData: true,
      lastSyncTime: NOW - 20 * 60_000,
      lastSyncAttemptTime: NOW - 60_000,
      now: NOW,
    })).toEqual({ shouldSync: true, reason: 'periodic' })
  })
})
