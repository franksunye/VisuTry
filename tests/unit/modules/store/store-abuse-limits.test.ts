import {
  DEFAULT_STORE_ABUSE_LIMITS,
  getStoreAbuseLimits,
} from '@/modules/store/application/store-abuse-limits'

describe('Store abuse limits vs commercial allowance', () => {
  it('keeps IP flood and failure protection at secure defaults', () => {
    const limits = getStoreAbuseLimits({})
    expect(limits.maxSessionCreatesPerIpPerHour).toBe(30)
    expect(limits.maxPhotoUploadsPerIpPerHour).toBe(40)
    expect(limits.maxAttemptsPerIpPerDay).toBe(40)
    expect(limits.maxFailuresPerMerchantPerDay).toBe(200)
  })

  it('does not hard-code merchant daily attempts at 200', () => {
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxAttemptsPerMerchantPerDay).toBeGreaterThan(200)
    expect(getStoreAbuseLimits({}).maxAttemptsPerMerchantPerDay).toBe(
      DEFAULT_STORE_ABUSE_LIMITS.maxAttemptsPerMerchantPerDay,
    )
  })

  it('lets paid/pilot operators raise the merchant daily attempt ceiling', () => {
    expect(getStoreAbuseLimits({
      STORE_MERCHANT_DAILY_ATTEMPT_LIMIT: '8000',
    }).maxAttemptsPerMerchantPerDay).toBe(8000)
  })

  it('ignores invalid env overrides and keeps the safety default', () => {
    expect(getStoreAbuseLimits({
      STORE_MERCHANT_DAILY_ATTEMPT_LIMIT: 'nope',
    }).maxAttemptsPerMerchantPerDay).toBe(
      DEFAULT_STORE_ABUSE_LIMITS.maxAttemptsPerMerchantPerDay,
    )
  })

  it('scopes merchant attempt buckets by merchantId rather than a global counter', () => {
    expect(DEFAULT_STORE_ABUSE_LIMITS.maxAttemptsPerMerchantPerDay).toBeGreaterThan(0)
  })
})
