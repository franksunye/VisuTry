/** Isolated regression simulation: no Auth0, Stripe, or database connection. */
const mockFindUnique = jest.fn()

jest.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mockFindUnique } } }))
jest.mock('@next-auth/prisma-adapter', () => ({ PrismaAdapter: () => ({}) }))
jest.mock('@/lib/mocks/auth', () => ({ isMockMode: false, MockCredentialsProvider: null }))
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))
jest.mock('@/lib/performance-logger', () => ({
  perfLogger: { start: jest.fn(), end: jest.fn() },
}))
jest.mock('@/lib/cache', () => ({ clearUserCache: jest.fn() }))

const userId = 'simulated-user-after-upgrade'
const loginIdentity = { id: userId, name: 'Simulated User', email: 'simulated@example.invalid', role: 'USER' }

function freeUser() {
  return {
    ...loginIdentity, image: null, username: 'simulated',
    freeTrialsUsed: 3, premiumUsageCount: 0, creditsPurchased: 0, creditsUsed: 0,
    isPremium: false, premiumExpiresAt: null, currentSubscriptionType: null,
  }
}

describe('Premium upgrade → login simulation (real NextAuth callbacks, mocked database)', () => {
  let authOptions: any
  let dbUser: ReturnType<typeof freeUser>

  beforeAll(() => {
    process.env.SKIP_ENV_VALIDATION = 'true'
    process.env.AUTH0_ID = 'synthetic-id'
    process.env.AUTH0_SECRET = 'synthetic-secret'
    process.env.AUTH0_ISSUER_BASE_URL = 'https://example.auth0.invalid/'
    authOptions = require('@/lib/auth').authOptions
  })

  beforeEach(() => {
    dbUser = freeUser()
    mockFindUnique.mockReset().mockImplementation(async () => ({ ...dbUser }))
  })

  async function jwt(token: any, user?: any, trigger?: string) {
    return authOptions.callbacks.jwt({
      token, user, trigger,
      account: user ? { provider: 'auth0' } : null,
      profile: user ? { nickname: 'simulated' } : undefined,
    })
  }

  async function session(token: any) {
    return authOptions.callbacks.session({
      session: { user: { name: 'Simulated User', email: loginIdentity.email } },
      token,
    })
  }

  it.each([
    ['PREMIUM_MONTHLY', 90],
    ['PREMIUM_YEARLY', 1260],
  ])('permits fresh Auth0 sign-in after %s upgrade and exposes active benefits', async (plan, expectedQuota) => {
    const firstToken = await jwt({ sub: userId }, loginIdentity)
    expect(firstToken.isPremiumActive).toBe(false)

    // Synthetic Stripe webhook persisted an upgrade on the SAME internal User ID.
    dbUser = { ...dbUser, isPremium: true,
      currentSubscriptionType: plan,
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
    } as any

    const afterReLogin = await jwt({ sub: userId }, loginIdentity)
    const paidSession = await session(afterReLogin)

    expect(mockFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: userId } }))
    expect(afterReLogin.isPremiumActive).toBe(true)
    expect(paidSession.user.isPremium).toBe(true)
    expect(paidSession.user.isPremiumActive).toBe(true)
    expect(paidSession.user.subscriptionType).toBe(plan)
    expect(paidSession.user.remainingTrials).toBe(expectedQuota)
  })

  it('may show stale Free entitlement immediately after upgrade until a forced or periodic JWT refresh', async () => {
    const beforeUpgrade = await jwt({ sub: userId }, loginIdentity)
    dbUser = { ...dbUser, isPremium: true,
      currentSubscriptionType: 'PREMIUM_MONTHLY',
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
    } as any
    mockFindUnique.mockClear()

    const immediateSessionToken = await jwt(beforeUpgrade)
    expect(mockFindUnique).not.toHaveBeenCalled()
    expect((await session(immediateSessionToken)).user.isPremium).toBe(false)

    // A new OAuth login synchronizes the upgraded database record immediately.
    const afterReLogin = await jwt(immediateSessionToken, loginIdentity)
    expect((await session(afterReLogin)).user.isPremiumActive).toBe(true)
  })

  it('does not reject sign-in if the entitlement database read times out', async () => {
    mockFindUnique.mockRejectedValueOnce(new Error('synthetic database timeout'))
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const token = await jwt({ sub: userId }, loginIdentity)
      expect(token.sub).toBe(userId)
      expect(token.email).toBe(loginIdentity.email)
      expect((await session(token)).user.id).toBe(userId)
    } finally {
      consoleError.mockRestore()
    }
  })
})
