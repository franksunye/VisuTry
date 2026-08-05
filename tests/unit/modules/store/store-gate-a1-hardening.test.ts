import { buildIntentIdempotencyKey, StoreDomainError } from '@/modules/store/domain'
import { assertSameMerchantTenant } from '@/modules/store/application/tenant-guards'
import { evaluateStoreDemoAllowance, DEFAULT_STORE_DEMO_LIMITS } from '@/modules/store/domain'

describe('Store Gate A1 usage and tenant guards', () => {
  it('counts one attempt per RENDER_ATTEMPT for allowance math', () => {
    // Session with 3 attempts should block when maxAttemptsPerSession is 3
    // regardless of success/failure result rows.
    const denied = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession,
    })
    expect(denied.allowed).toBe(false)

    const allowed = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession - 1,
    })
    expect(allowed.allowed).toBe(true)
  })

  it('rejects cross-tenant frame/session attribution', () => {
    expect(() => assertSameMerchantTenant('m1', 'm2', 'frame')).toThrow(StoreDomainError)
    expect(() => assertSameMerchantTenant('m1', 'm1', 'session')).not.toThrow()
  })

  it('keeps intent idempotency keys stable for duplicate client actions', () => {
    const a = buildIntentIdempotencyKey({
      type: 'PRODUCT_CLICK',
      merchantId: 'm1',
      merchantSessionId: 's1',
      merchantFrameId: 'f1',
      clientActionId: 'click-1',
    })
    const b = buildIntentIdempotencyKey({
      type: 'PRODUCT_CLICK',
      merchantId: 'm1',
      merchantSessionId: 's1',
      merchantFrameId: 'f1',
      clientActionId: 'click-1',
    })
    expect(a).toBe(b)
  })
})

describe('Store settle transaction contract', () => {
  it('documents claim+ledger must share one transaction', async () => {
    // Source contract: settleStoreTryOnUsage wraps updateMany + ledger.create
    // in prisma.$transaction with Serializable isolation.
    const source = await import('@/modules/store/application/settle-store-usage')
    expect(typeof source.settleStoreTryOnUsage).toBe('function')
    const fs = await import('fs')
    const path = await import('path')
    const file = fs.readFileSync(
      path.join(process.cwd(), 'src/modules/store/application/settle-store-usage.ts'),
      'utf8',
    )
    expect(file).toContain('$transaction')
    expect(file).toContain('merchantUsageLedger.create')
    expect(file).toContain('Serializable')
  })
})
