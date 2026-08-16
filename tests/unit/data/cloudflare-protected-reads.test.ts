jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { createCloudflareAuthAdapter, getCloudflareAuthUser } from '@/data/auth-cloudflare'
import { getConsumerTryOnHistory, getPaymentHistory } from '@/data/protected-reads-cloudflare'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'

type SqlMock = jest.Mock & { unsafe: jest.Mock }

function sqlMock(results: unknown[][]): SqlMock {
  const sql = jest.fn((_strings: TemplateStringsArray, ..._values: unknown[]) => Promise.resolve(results.shift() ?? [])) as SqlMock
  sql.unsafe = jest.fn((value: string) => value)
  return sql
}

describe('Cloudflare direct-Neon protected reads', () => {
  afterEach(() => jest.clearAllMocks())

  it('keeps consumer try-on history scoped to the authenticated user', async () => {
    const sql = sqlMock([
      [{ id: 'task-a', type: 'GLASSES', status: 'COMPLETED', userImageUrl: 'user-a', itemImageUrl: 'frame-a', glassesImageUrl: null, resultImageUrl: 'result-a', errorMessage: null, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'), metadata: { owner: 'a' } }],
      [{ count: 1 }],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await getConsumerTryOnHistory({ userId: 'user-a', page: 1, limit: 10, status: 'COMPLETED' })

    expect(result.total).toBe(1)
    expect(result.tasks[0]?.id).toBe('task-a')
    expect(sql.mock.calls[0][1]).toBe('user-a')
    expect(sql.mock.calls[0][2]).toBe('COMPLETED')
  })

  it('preserves payment history visibility filters and ownership', async () => {
    const sql = sqlMock([[{ id: 'payment-a', productType: 'CREDITS_PACK', description: null, createdAt: new Date(), stripePaymentId: 'pi_a', amount: 299, currency: 'usd', status: 'COMPLETED' }], [{ count: 1 }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await getPaymentHistory({ userId: 'user-a', page: 1, limit: 10 })

    expect(result.total).toBe(1)
    expect(result.payments[0]?.stripePaymentId).toBe('pi_a')
    expect(sql.mock.calls[0][1]).toBe('user-a')
  })

  it('resolves an existing Auth0 account and supports the first-login write boundary', async () => {
    const sql = sqlMock([[{ id: 'user-a', name: 'User A', email: 'a@example.com', emailVerified: null, image: null }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    const adapter = createCloudflareAuthAdapter()

    const user = await adapter.getUserByAccount?.({ provider: 'auth0', providerAccountId: 'auth0|a' })

    expect(user?.id).toBe('user-a')
    expect(adapter.createUser).toBeDefined()
  })

  it('creates an Auth0 user with database defaults and returns the adapter shape', async () => {
    const sql = sqlMock([[{ id: 'user-new', name: 'Cloudflare B1 Test User A', email: 'sun+cloudflare-b1-a@visutry.com', emailVerified: null, image: null }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    const adapter = createCloudflareAuthAdapter()

    const user = await adapter.createUser?.({ name: 'Cloudflare B1 Test User A', email: 'sun+cloudflare-b1-a@visutry.com', emailVerified: null, image: null })

    expect(user).toMatchObject({ id: 'user-new', name: 'Cloudflare B1 Test User A', email: 'sun+cloudflare-b1-a@visutry.com' })
    expect(sql.mock.calls[0].slice(1)).toContain('sun+cloudflare-b1-a@visutry.com')
  })

  it('retries the same Auth0 signup idempotently without exposing role or quota fields', async () => {
    const sql = sqlMock([
      [{ id: 'user-new', name: 'First name', email: 'retry@example.com', emailVerified: null, image: null }],
      [{ id: 'user-new', name: 'First name', email: 'retry@example.com', emailVerified: null, image: null }],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    const adapter = createCloudflareAuthAdapter()

    const first = await adapter.createUser?.({ name: 'First name', email: 'retry@example.com', emailVerified: null, image: null })
    const second = await adapter.createUser?.({ name: 'Escalation attempt', email: 'retry@example.com', emailVerified: null, image: null })

    expect(first?.id).toBe('user-new')
    expect(second?.id).toBe('user-new')
    expect(sql.mock.calls[1].slice(1)).not.toContain('ADMIN')
    expect(sql.mock.calls[1].slice(1)).not.toContain('creditsPurchased')
  })

  it('updates only adapter-owned fields and returns the existing user', async () => {
    const sql = sqlMock([[{ id: 'user-a', name: 'Updated', email: 'a@example.com', emailVerified: null, image: 'https://example.test/avatar.png' }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    const adapter = createCloudflareAuthAdapter()

    const user = await adapter.updateUser?.({ id: 'user-a', name: 'Updated', image: 'https://example.test/avatar.png' })

    expect(user).toMatchObject({ id: 'user-a', name: 'Updated', image: 'https://example.test/avatar.png' })
    expect(sql.mock.calls[0].slice(1)).not.toContain('role')
    expect(sql.mock.calls[0].slice(1)).not.toContain('isPremium')
  })

  it('links an Auth0 account idempotently without stealing another user identity', async () => {
    const sql = sqlMock([[], [{ id: 'account-a', userId: 'user-a', type: 'oauth', provider: 'auth0', providerAccountId: 'auth0|a' }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
    const adapter = createCloudflareAuthAdapter()

    const account = await adapter.linkAccount?.({
      id: 'ignored-by-adapter',
      userId: 'user-a',
      type: 'oauth',
      provider: 'auth0',
      providerAccountId: 'auth0|a',
    })

    expect(account).toMatchObject({ id: 'account-a', userId: 'user-a', provider: 'auth0' })
    expect(sql).toHaveBeenCalledTimes(2)

    const conflictSql = sqlMock([[], [{ id: 'account-a', userId: 'user-other', type: 'oauth', provider: 'auth0', providerAccountId: 'auth0|a' }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(conflictSql)
    await expect(adapter.linkAccount?.({
      id: 'ignored-by-adapter',
      userId: 'user-a',
      type: 'oauth',
      provider: 'auth0',
      providerAccountId: 'auth0|a',
    })).rejects.toThrow('already linked to another User')
  })

  it('uses both user and merchant ids for membership authorization', async () => {
    const sql = sqlMock([[{ id: 'membership-a', userId: 'user-a', merchantId: 'merchant-a', role: 'OWNER', createdAt: new Date(), updatedAt: new Date() }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const authorization = await requireMerchantMembership({ userId: 'user-a', merchantId: 'merchant-a' })

    expect(authorization.role).toBe('OWNER')
    expect(sql.mock.calls[0][1]).toBe('user-a')
    expect(sql.mock.calls[0][2]).toBe('merchant-a')
  })

  it('maps the complete user record for protected quota reads', async () => {
    const sql = sqlMock([[{
      id: 'user-a', name: 'User A', email: 'a@example.com', emailVerified: null, image: null, username: 'a',
      freeTrialsUsed: 1, premiumUsageCount: 2, creditsPurchased: 3, creditsUsed: 1, isPremium: true,
      premiumExpiresAt: null, currentSubscriptionType: 'PREMIUM_MONTHLY', role: 'USER',
      lastRetention3DayEmailSent: null, lastRetention24HEmailSent: null, lastRetentionDeletedEmailSent: null,
      createdAt: new Date(), updatedAt: new Date(),
    }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const user = await getCloudflareAuthUser('user-a')

    expect(user).toMatchObject({ id: 'user-a', creditsPurchased: 3, creditsUsed: 1, role: 'USER' })
  })
})
