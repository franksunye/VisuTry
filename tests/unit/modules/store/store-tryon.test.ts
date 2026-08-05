import {
  buildStoreGenerationIdempotencyKey,
  evaluateStoreDemoAllowance,
  DEFAULT_STORE_DEMO_LIMITS,
  selectUsagePolicy,
  usagePolicyTouchesConsumerCredits,
} from '@/modules/store/domain'
import { parseStoreTryOnSubmitRequest, parseStoreTryOnPollRequest } from '@/modules/store/contracts'

describe('Store try-on attribution and usage isolation', () => {
  it('builds store generation idempotency keys', () => {
    expect(
      buildStoreGenerationIdempotencyKey({
        merchantSessionId: 's1',
        merchantFrameId: 'f1',
        clientSubmissionId: 'batch:f1',
      }),
    ).toBe('store:s1:f1:batch:f1')
  })

  it('keeps Store Demo usage off consumer credits', () => {
    const policy = selectUsagePolicy({
      kind: 'store',
      merchantId: 'm1',
      merchantSessionId: 's1',
      merchantFrameId: 'f1',
    })
    expect(policy.kind).toBe('store_demo_allowance')
    expect(usagePolicyTouchesConsumerCredits(policy)).toBe(false)
  })

  it('enforces session attempt limits before generation', () => {
    const denied = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 0,
      sessionSuccessfulRenders: 0,
      sessionAttempts: DEFAULT_STORE_DEMO_LIMITS.maxAttemptsPerSession,
    })
    expect(denied.allowed).toBe(false)
  })

  it('parses try-on submit and poll contracts', () => {
    const submit = parseStoreTryOnSubmitRequest({
      merchantSlug: 'luna-optical',
      merchantSessionId: 's1',
      merchantFrameId: 'f1',
      batchId: 'b1',
      clientSubmissionId: 'b1:f1',
    })
    expect(submit.ok).toBe(true)

    const poll = parseStoreTryOnPollRequest({
      merchantSlug: 'luna-optical',
      merchantSessionId: 's1',
      taskId: 't1',
    })
    expect(poll.ok).toBe(true)

    expect(parseStoreTryOnSubmitRequest({ merchantSlug: 'luna' }).ok).toBe(false)
  })
})
