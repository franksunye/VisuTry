import { User } from '@prisma/client'
import { getNextQuotaSource, getRemainingQuotaCount } from '@/lib/quota'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    freeTrialsUsed: 0,
    creditsPurchased: 0,
    creditsUsed: 0,
    isPremium: false,
    premiumExpiresAt: null,
    currentSubscriptionType: null,
    premiumUsageCount: 0,
    username: null,
    role: 'USER',
    lastRetention3DayEmailSent: null,
    lastRetention24HEmailSent: null,
    lastRetentionDeletedEmailSent: null,
    ...overrides,
  }
}

describe('getNextQuotaSource', () => {
  it('uses credits before free trial for non-premium users', () => {
    const user = makeUser({
      creditsPurchased: 10,
      creditsUsed: 3,
      freeTrialsUsed: 0,
    })

    expect(getNextQuotaSource(user)).toBe('credit')
  })

  it('uses free trial when no credits remain', () => {
    const user = makeUser({
      creditsPurchased: 0,
      creditsUsed: 0,
      freeTrialsUsed: 0,
    })

    expect(getNextQuotaSource(user)).toBe('free_trial')
  })

  it('uses subscription quota before credits for premium users', () => {
    const user = makeUser({
      isPremium: true,
      premiumExpiresAt: new Date(Date.now() + 86400000),
      currentSubscriptionType: 'PREMIUM_MONTHLY',
      premiumUsageCount: 0,
      creditsPurchased: 10,
      creditsUsed: 0,
    })

    expect(getNextQuotaSource(user)).toBe('subscription')
  })

  it('returns null when all quota is exhausted', () => {
    const user = makeUser({
      creditsPurchased: 5,
      creditsUsed: 5,
      freeTrialsUsed: 999,
    })

    expect(getNextQuotaSource(user)).toBeNull()
  })
})

describe('getRemainingQuotaCount', () => {
  it('adds credits and free trials for non-premium users', () => {
    const user = makeUser({
      creditsPurchased: 10,
      creditsUsed: 4,
      freeTrialsUsed: 1,
    })

    expect(getRemainingQuotaCount(user)).toBe(8)
  })

  it('adds subscription quota and credits for premium users', () => {
    const user = makeUser({
      isPremium: true,
      premiumExpiresAt: new Date(Date.now() + 86400000),
      currentSubscriptionType: 'PREMIUM_MONTHLY',
      premiumUsageCount: 8,
      creditsPurchased: 5,
      creditsUsed: 2,
    })

    expect(getRemainingQuotaCount(user)).toBeGreaterThan(3)
  })
})
