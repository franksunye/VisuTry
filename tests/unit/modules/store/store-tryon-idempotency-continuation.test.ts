import { buildStoreGenerationIdempotencyKey } from '@/modules/store/domain'
import {
  createMerchantContinuation,
  merchantRuntimeContinuationStorageKey,
} from '@/lib/commerce-handoff/merchant-continuation'

describe('Store try-on idempotency and continuation state', () => {
  it('keeps duplicate submits on the same batch+frame idempotent', () => {
    const first = buildStoreGenerationIdempotencyKey({
      merchantSessionId: 'session-1',
      merchantFrameId: 'frame-1',
      clientSubmissionId: 'batch-1:frame-1',
    })
    const duplicate = buildStoreGenerationIdempotencyKey({
      merchantSessionId: 'session-1',
      merchantFrameId: 'frame-1',
      clientSubmissionId: 'batch-1:frame-1',
    })
    expect(first).toBe(duplicate)
    expect(first).toBe('store:session-1:frame-1:batch-1:frame-1')
  })

  it('preserves merchant, experience, and runtime continuation keys across auth', () => {
    const context = createMerchantContinuation({
      locale: 'en',
      merchantSlug: 'ello-sunglasses',
      experienceType: 'CAMPAIGN',
      experienceSlug: 'petite-fit',
    })
    expect(context).toMatchObject({
      merchantSlug: 'ello-sunglasses',
      experienceType: 'CAMPAIGN',
      experienceSlug: 'petite-fit',
      canonicalReturnPath: '/en/c/ello-sunglasses/petite-fit',
    })
    expect(merchantRuntimeContinuationStorageKey(context!)).toContain('ello-sunglasses')
    expect(merchantRuntimeContinuationStorageKey(context!)).toContain('petite-fit')
  })
})
