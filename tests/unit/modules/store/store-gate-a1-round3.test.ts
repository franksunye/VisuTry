/**
 * Round-3 Gate A1 behavioral tests for private result delivery and atomic claim semantics.
 */

import { buildStoreTryOnResultDeliveryUrl } from '@/modules/store/application/store-result-delivery'
import {
  DEFAULT_STORE_DEMO_LIMITS,
  evaluateStoreDemoAllowance,
  buildStoreGenerationIdempotencyKey,
} from '@/modules/store/domain'

describe('Store private result delivery', () => {
  it('builds capability-bound result URLs instead of raw blob URLs', () => {
    const url = buildStoreTryOnResultDeliveryUrl({
      taskId: 'task_1',
      merchantSlug: 'luna-optical',
      merchantSessionId: 'sess_1',
    })
    expect(url).toContain('/api/store/sessions/try-on/task_1/result')
    expect(url).toContain('merchantSlug=luna-optical')
    expect(url).toContain('merchantSessionId=sess_1')
    expect(url).not.toContain('blob.vercel-storage.com')
  })
})

describe('Store atomic claim semantics', () => {
  it('uses stable idempotency keys for single attempt reservation', () => {
    const key = buildStoreGenerationIdempotencyKey({
      merchantSessionId: 's1',
      merchantFrameId: 'f1',
      clientSubmissionId: 'batch:f1',
    })
    expect(key).toBe('store:s1:f1:batch:f1')
  })

  it('denies additional attempts after session ceiling', () => {
    const decision = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession,
    })
    expect(decision.allowed).toBe(false)
  })
})
