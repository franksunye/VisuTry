import { checkUserQuota, getNextQuotaSource } from '@/lib/quota'

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    image: null,
    emailVerified: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPremium: false,
    premiumExpiresAt: null,
    currentSubscriptionType: null,
    premiumUsageCount: 0,
    creditsPurchased: 0,
    creditsUsed: 0,
    freeTrialsUsed: 0,
    ...overrides,
  } as any
}

describe('Face Analysis quota invariants', () => {
  it('uses purchased credits before the included free analysis credit', () => {
    const user = makeUser({ creditsPurchased: 3, creditsUsed: 1, freeTrialsUsed: 0 })

    expect(checkUserQuota(user).allowed).toBe(true)
    expect(getNextQuotaSource(user)).toBe('credit')
  })

  it('uses the included free analysis credit when no purchased credits remain', () => {
    const user = makeUser({ creditsPurchased: 2, creditsUsed: 2, freeTrialsUsed: 0 })

    expect(checkUserQuota(user).allowed).toBe(true)
    expect(getNextQuotaSource(user)).toBe('free_trial')
  })

  it('uses active subscription quota before purchased credits', () => {
    const user = makeUser({
      isPremium: true,
      premiumExpiresAt: new Date(Date.now() + 86400000),
      currentSubscriptionType: 'PREMIUM_MONTHLY',
      premiumUsageCount: 0,
      creditsPurchased: 5,
      creditsUsed: 0,
    })

    expect(checkUserQuota(user).allowed).toBe(true)
    expect(getNextQuotaSource(user)).toBe('subscription')
  })

  it('falls back to purchased credits after subscription quota is exhausted', () => {
    const user = makeUser({
      isPremium: true,
      premiumExpiresAt: new Date(Date.now() + 86400000),
      currentSubscriptionType: 'PREMIUM_MONTHLY',
      premiumUsageCount: 60,
      creditsPurchased: 2,
      creditsUsed: 1,
    })

    expect(checkUserQuota(user).allowed).toBe(true)
    expect(getNextQuotaSource(user)).toBe('credit')
  })

  it('denies analysis when every quota bucket is exhausted', () => {
    const user = makeUser({ creditsPurchased: 1, creditsUsed: 1, freeTrialsUsed: 1 })

    expect(checkUserQuota(user).allowed).toBe(false)
    expect(getNextQuotaSource(user)).toBeNull()
  })
})
