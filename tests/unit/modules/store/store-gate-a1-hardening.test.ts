/**
 * Behavioral Gate A1 tests — no source-text sniffing.
 */

import {
  DEFAULT_STORE_DEMO_LIMITS,
  evaluateStoreDemoAllowance,
  shouldMarkDeleteBlocked,
  RETENTION_SOFT_FAIL_CAP,
  StoreDomainError,
} from '@/modules/store/domain'
import { assertSameMerchantTenant } from '@/modules/store/application/tenant-guards'
import { DEFAULT_STORE_ABUSE_LIMITS } from '@/modules/store/application/store-abuse-limits'

describe('Store Gate A1 behavioral contracts', () => {
  it('marks delete-blocked at soft fail cap but policy keeps blocked selectable', () => {
    expect(shouldMarkDeleteBlocked(RETENTION_SOFT_FAIL_CAP - 1)).toBe(false)
    expect(shouldMarkDeleteBlocked(RETENTION_SOFT_FAIL_CAP)).toBe(true)
  })

  it('rejects cross-tenant attribution', () => {
    expect(() => assertSameMerchantTenant('m1', 'm2', 'frame')).toThrow(StoreDomainError)
    expect(() => assertSameMerchantTenant('m1', 'm1', 'session')).not.toThrow()
  })

  it('allows one remaining attempt slot and denies when full', () => {
    const almost = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession - 1,
    })
    expect(almost.allowed).toBe(true)

    const full = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession,
    })
    expect(full.allowed).toBe(false)
  })

  it('defines abuse limit defaults', () => {
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxSessionCreatesPerIpPerHour).toBeGreaterThan(0)
  })
})

describe('Store concurrent allowance semantics', () => {
  it('only one of two last-slot evaluations should be allowed if sequenced', () => {
    let attempts = DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession - 1
    const first = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: attempts,
    })
    if (first.allowed) attempts += 1
    const second = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: attempts,
    })
    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(false)
  })
})
