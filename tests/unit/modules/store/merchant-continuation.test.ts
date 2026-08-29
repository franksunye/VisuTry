import {
  appendMerchantContinuation,
  createMerchantContinuation,
  getMerchantContinuationFromUrl,
  getSafeShopperAuthCallbackUrl,
  getSafeMerchantAuthCallbackUrl,
  isSafeMerchantCheckoutReturnUrl,
  merchantPricingPath,
  merchantRuntimeContinuationStorageKey,
  parseMerchantContinuation,
} from '@/lib/commerce-handoff/merchant-continuation'

describe('Merchant continuation contract', () => {
  const store = createMerchantContinuation({
    locale: 'en',
    merchantSlug: 'ello-sunglasses',
    experienceType: 'STORE',
  })!
  const campaign = createMerchantContinuation({
    locale: 'en',
    merchantSlug: 'ello-sunglasses',
    experienceType: 'CAMPAIGN',
    experienceSlug: 'petite-fit',
  })!

  it('round-trips bounded Store and Campaign contexts', () => {
    expect(getMerchantContinuationFromUrl(appendMerchantContinuation(store.canonicalReturnPath, store))).toEqual(store)
    expect(getMerchantContinuationFromUrl(appendMerchantContinuation(campaign.canonicalReturnPath, campaign))).toEqual(campaign)
    expect(getMerchantContinuationFromUrl(merchantPricingPath(campaign))).toEqual(campaign)
  })

  it('scopes runtime resume state by merchant experience', () => {
    expect(merchantRuntimeContinuationStorageKey(store)).toBe(
      'vt_store_continuation:en:STORE:ello-sunglasses:store',
    )
    expect(merchantRuntimeContinuationStorageKey(campaign)).toBe(
      'vt_store_continuation:en:CAMPAIGN:ello-sunglasses:petite-fit',
    )
    expect(merchantRuntimeContinuationStorageKey(store)).not.toBe(
      merchantRuntimeContinuationStorageKey(campaign),
    )
  })

  it('rejects malformed, overlong, and inconsistent contexts', () => {
    expect(parseMerchantContinuation('%7B%22locale%22%3A%22xx%22%7D')).toBeNull()
    expect(parseMerchantContinuation('%7B%22locale%22%3A%22en%22')).toBeNull()
    expect(parseMerchantContinuation('x'.repeat(1201))).toBeNull()
    expect(getMerchantContinuationFromUrl('/en/store/ello-sunglasses/extra')).toBeNull()
    expect(getMerchantContinuationFromUrl('/en/store/ello-sunglasses?merchantContinuation=not-json')).toBeNull()
    expect(createMerchantContinuation({
      locale: 'en',
      merchantSlug: 'ello-sunglasses',
      experienceType: 'STORE',
      experienceSlug: 'petite-fit',
    })).toBeNull()
  })

  it('preserves a valid shopper Store callback and canonicalizes it to the Store route', () => {
    const callback = getSafeShopperAuthCallbackUrl('/en/store/ello-sunglasses', 'en')
    expect(callback).not.toBeNull()
    expect(getMerchantContinuationFromUrl(callback)).toEqual(store)
  })

  it('preserves a valid Campaign callback through Pricing', () => {
    const callback = getSafeShopperAuthCallbackUrl(merchantPricingPath(campaign), 'en')
    expect(callback).toBe(merchantPricingPath(campaign))
  })

  it('keeps ordinary Consumer callbacks while rejecting external/admin/private destinations', () => {
    expect(getSafeShopperAuthCallbackUrl('/en/pricing?source=face-analysis-unlock&taskId=task-1', 'en'))
      .toBe('/en/pricing?source=face-analysis-unlock&taskId=task-1')
    expect(getSafeShopperAuthCallbackUrl('https://attacker.example/en/store/ello-sunglasses', 'en')).toBeNull()
    expect(getSafeShopperAuthCallbackUrl('/en/merchant', 'en')).toBeNull()
    expect(getSafeShopperAuthCallbackUrl('/admin/users', 'en')).toBeNull()
    expect(getSafeShopperAuthCallbackUrl('/api/auth/session', 'en')).toBeNull()
    expect(getSafeShopperAuthCallbackUrl('//attacker.example/en/store/ello-sunglasses', 'en')).toBeNull()
  })

  it('preserves a canonical Merchant purchase intent through Auth0 while rejecting unsafe variants', () => {
    expect(getSafeMerchantAuthCallbackUrl('/en/merchant?commercialIntent=GROWTH', 'en'))
      .toBe('/en/merchant?commercialIntent=GROWTH')
    expect(getSafeMerchantAuthCallbackUrl('/en/merchant?commercialIntent=price_live_123', 'en')).toBeNull()
    expect(getSafeMerchantAuthCallbackUrl('/en/merchant?commercialIntent=GROWTH&returnUrl=https://evil.example', 'en')).toBeNull()
    expect(getSafeMerchantAuthCallbackUrl('https://evil.example/steal', 'en')).toBeNull()
    expect(getSafeMerchantAuthCallbackUrl('/en/business/checkout?commercialIntent=GROWTH', 'en')).toBeNull()
  })

  it('accepts only paired same-origin Merchant Checkout return URLs', () => {
    const success = `https://www.visutry.com${appendMerchantContinuation(store.canonicalReturnPath, store)}`
    const cancel = `https://www.visutry.com${merchantPricingPath(store)}`
    expect(isSafeMerchantCheckoutReturnUrl(success, 'https://www.visutry.com')).toBe(true)
    expect(isSafeMerchantCheckoutReturnUrl(cancel, 'https://www.visutry.com')).toBe(true)
    expect(isSafeMerchantCheckoutReturnUrl('https://www.visutry.com/en/admin', 'https://www.visutry.com')).toBe(false)
    expect(isSafeMerchantCheckoutReturnUrl('https://attacker.example/en/store/ello-sunglasses', 'https://www.visutry.com')).toBe(false)
  })
})
