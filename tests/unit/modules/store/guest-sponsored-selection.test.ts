import { maxSelectableStoreFrames } from '@/modules/store/domain/experience-policy'
import { resolveGuestSponsoredTryOnLimit } from '@/modules/store/domain/merchant-sponsored-usage'

const comparePolicy = {
  tryOnEnabled: true,
  compareEnabled: true,
  maxCompareFrames: 2 as const,
  inquiryEnabled: false,
}

describe('Sponsored guest 1-frame selection', () => {
  const originalEnabled = process.env.MERCHANT_SPONSORED_USAGE_ENABLED

  afterEach(() => {
    if (originalEnabled === undefined) delete process.env.MERCHANT_SPONSORED_USAGE_ENABLED
    else process.env.MERCHANT_SPONSORED_USAGE_ENABLED = originalEnabled
  })

  it('caps an anonymous VISUTRY_OWNED guest at one frame before submit', () => {
    process.env.MERCHANT_SPONSORED_USAGE_ENABLED = 'true'
    const guestLimit = resolveGuestSponsoredTryOnLimit({
      sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
    })
    expect(guestLimit).toBe(1)
    expect(maxSelectableStoreFrames(comparePolicy, {
      guestSponsoredTryOnLimit: guestLimit,
    })).toBe(1)
  })

  it('keeps compare selection after sign-in continuation unlocks the shortlist', () => {
    expect(maxSelectableStoreFrames(comparePolicy, {
      guestSponsoredTryOnLimit: 1,
      guestCompareUnlocked: true,
    })).toBe(2)
  })

  it('does not invent a 2-frame guest batch when sponsored allowance is 1', () => {
    const selected: string[] = []
    const max = maxSelectableStoreFrames(comparePolicy, { guestSponsoredTryOnLimit: 1 })
    for (const id of ['frame-1', 'frame-2']) {
      if (selected.length >= max) break
      selected.push(id)
    }
    expect(selected).toEqual(['frame-1'])
  })
})
