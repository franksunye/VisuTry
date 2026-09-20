jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { createMerchantWithOwner } from '@/modules/merchant/application/merchant-provisioning-cloudflare'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'

type SqlMock = jest.Mock & { transaction: jest.Mock }

function sqlMock(transactions: unknown[][][]): SqlMock {
  const sql = jest.fn() as SqlMock
  sql.transaction = jest.fn(() => Promise.resolve(transactions.shift() ?? []))
  return sql
}

function selectedMerchant(merchantId: string, slug: string, role: 'OWNER' | 'ADMIN' = 'OWNER', name = 'Test Merchant') {
  return { membershipId: `membership-${merchantId}`, userId: 'user-a', merchantId, role, membershipCreatedAt: new Date(), membershipUpdatedAt: new Date(), slug, name }
}

function insertedMerchant(merchantId: string, slug: string, name = 'Test Merchant') {
  return { id: merchantId, slug, name }
}

describe('Cloudflare direct-Neon merchant provisioning', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns the existing owner membership idempotently and uses Serializable transactions', async () => {
    const sql = sqlMock([[
      [{ id: 'membership-a', userId: 'user-a', merchantId: 'merchant-a', role: 'OWNER' }],
      [], [], [], [], [selectedMerchant('merchant-a', 'existing-merchant')],
    ]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantWithOwner({ userId: 'user-a', name: 'Ignored Retry Name' })

    expect(result.merchant).toEqual({ id: 'merchant-a', slug: 'existing-merchant', name: 'Test Merchant' })
    expect(result.created).toBe(false)
    expect(sql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
  })

  it('preserves the persisted ADMIN role for an existing membership', async () => {
    const sql = sqlMock([[
      [{ id: 'membership-a', userId: 'user-a', merchantId: 'merchant-a', role: 'ADMIN' }],
      [], [], [], [], [selectedMerchant('merchant-a', 'existing-merchant', 'ADMIN')],
    ]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantWithOwner({ userId: 'user-a', name: 'Ignored Retry Name' })

    expect(result.membership.role).toBe('ADMIN')
  })

  it('returns an existing workspace even when an old retry omits the name', async () => {
    const sql = sqlMock([])
    sql.mockResolvedValue([selectedMerchant('merchant-a', 'existing-merchant')])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantWithOwner({ userId: 'user-a', name: '   ' })

    expect(result).toMatchObject({
      merchant: { id: 'merchant-a', slug: 'existing-merchant', name: 'Test Merchant' },
      created: false,
    })
    expect(sql.transaction).not.toHaveBeenCalled()
  })

  it('returns the actual persisted role at the Cloudflare authorization boundary', async () => {
    const sql = jest.fn(() => Promise.resolve([{ id: 'membership-a', userId: 'user-a', merchantId: 'merchant-a', role: 'ADMIN', createdAt: new Date(), updatedAt: new Date() }])) as SqlMock
    sql.transaction = jest.fn()
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(requireMerchantMembership({ userId: 'user-a', merchantId: 'merchant-a', roles: ['ADMIN'] })).resolves.toMatchObject({ role: 'ADMIN' })
  })

  it('retries a slug collision with a deterministic suffix', async () => {
    const sql = sqlMock([
      [[], [], [], [], [], []],
      [[], [], [insertedMerchant('merchant-new', 'brand-name-2')], [], [], [selectedMerchant('merchant-new', 'brand-name-2')]],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantWithOwner({ userId: 'user-a', name: 'Brand Name' })

    expect(result.merchant.slug).toBe('brand-name-2')
    expect(result.created).toBe(true)
    expect(sql.transaction).toHaveBeenCalledTimes(2)
  })

  it('uses a random suffix after readable default slugs collide', async () => {
    const transactions = Array.from({ length: 5 }, () => [[], [], [], [], [], []] as unknown[][])
    transactions.push([[], [], [insertedMerchant('merchant-new', 'brand-name-abc123def456')], [], [], [selectedMerchant('merchant-new', 'brand-name-abc123def456')]])
    const sql = sqlMock(transactions)
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantWithOwner({ userId: 'user-a', name: 'Brand Name' })

    expect(result.merchant.slug).toMatch(/^brand-name-[a-z0-9]{12}$/u)
    expect(result.created).toBe(true)
    expect(sql.transaction).toHaveBeenCalledTimes(6)
  })

  it.each([
    ['missing', undefined],
    ['blank', '   '],
    ['one character', 'A'],
    ['too long', 'A'.repeat(121)],
    ['slugless', '!!!'],
  ])('rejects a new workspace name that is %s before a transaction can write', async (_label, name) => {
    const sql = sqlMock([])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(createMerchantWithOwner({ userId: 'user-a', name })).rejects.toMatchObject({ code: 'INVALID_MERCHANT_NAME' })

    expect(sql.transaction).not.toHaveBeenCalled()
  })

  it('keeps user and merchant identifiers parameterized in every provisioning attempt', async () => {
    const sql = sqlMock([[[], [], [insertedMerchant('merchant-a', 'brand-name')], [], [], [selectedMerchant('merchant-a', 'brand-name')]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await createMerchantWithOwner({ userId: 'user-a', name: 'Brand Name' })

    const calls = sql.transaction.mock.calls[0][0]
    expect(calls).toHaveLength(6)
    expect(sql.transaction.mock.calls[0][1]).toEqual({ isolationLevel: 'Serializable' })
  })
})
