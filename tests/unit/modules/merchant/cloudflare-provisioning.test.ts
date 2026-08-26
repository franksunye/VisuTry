jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { createMerchantWithOwner } from '@/modules/merchant/application/merchant-provisioning-cloudflare'

type SqlMock = jest.Mock & { transaction: jest.Mock }

function sqlMock(transactions: unknown[][][]): SqlMock {
  const sql = jest.fn() as SqlMock
  sql.transaction = jest.fn(() => Promise.resolve(transactions.shift() ?? []))
  return sql
}

function selectedMerchant(merchantId: string, slug: string) {
  return { membershipId: `membership-${merchantId}`, userId: 'user-a', merchantId, role: 'OWNER', membershipCreatedAt: new Date(), membershipUpdatedAt: new Date(), slug, name: 'Test Merchant' }
}

describe('Cloudflare direct-Neon merchant provisioning', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns the existing owner membership idempotently and uses Serializable transactions', async () => {
    const sql = sqlMock([[
      [{ id: 'membership-a', userId: 'user-a', merchantId: 'merchant-a', role: 'OWNER' }],
      [], [], [], [selectedMerchant('merchant-a', 'existing-merchant')],
    ]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantWithOwner({ userId: 'user-a', name: 'Ignored Retry Name' })

    expect(result.merchant).toEqual({ id: 'merchant-a', slug: 'existing-merchant', name: 'Test Merchant' })
    expect(result.created).toBe(false)
    expect(sql.transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'Serializable' })
  })

  it('retries a slug collision with a deterministic suffix', async () => {
    const sql = sqlMock([
      [[], [], [], [], []],
      [[], [], [], [], [selectedMerchant('merchant-new', 'brand-name-2')]],
    ])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    const result = await createMerchantWithOwner({ userId: 'user-a', name: 'Brand Name' })

    expect(result.merchant.slug).toBe('brand-name-2')
    expect(result.created).toBe(true)
    expect(sql.transaction).toHaveBeenCalledTimes(2)
  })

  it('keeps user and merchant identifiers parameterized in every provisioning attempt', async () => {
    const sql = sqlMock([[[], [], [], [], [selectedMerchant('merchant-a', 'brand-name')]]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await createMerchantWithOwner({ userId: 'user-a', name: 'Brand Name' })

    const calls = sql.transaction.mock.calls[0][0]
    expect(calls).toHaveLength(5)
    expect(sql.transaction.mock.calls[0][1]).toEqual({ isolationLevel: 'Serializable' })
  })
})
