import {
  buildMerchantCatalogCapacityGuardQuery,
  isMerchantCatalogTransactionConflict,
  merchantCatalogCapacityErrorCode,
  resolveMerchantCatalogCapacity,
} from '@/modules/merchant/domain/merchant-catalog-capacity'

describe('resolveMerchantCatalogCapacity', () => {
  it('allows an exactly-full proposed import when remaining slots match new rows', () => {
    expect(resolveMerchantCatalogCapacity({ current: 2, limit: 50, proposedNew: 48 })).toEqual({
      current: 2,
      limit: 50,
      remaining: 48,
      proposedNew: 48,
      overLimit: 0,
    })
  })

  it('blocks the complete proposal and reports exact overage before approval', () => {
    expect(resolveMerchantCatalogCapacity({ current: 2, limit: 50, proposedNew: 49 })).toEqual({
      current: 2,
      limit: 50,
      remaining: 48,
      proposedNew: 49,
      overLimit: 1,
    })
  })

  it('does not consume capacity for existing-identity updates', () => {
    expect(resolveMerchantCatalogCapacity({ current: 50, limit: 50, proposedNew: 0 })).toEqual({
      current: 50,
      limit: 50,
      remaining: 0,
      proposedNew: 0,
      overLimit: 0,
    })
  })

  it('counts only new rows in a mixed update-and-create proposal', () => {
    expect(resolveMerchantCatalogCapacity({ current: 99, limit: 100, proposedNew: 1 })).toMatchObject({
      remaining: 1,
      proposedNew: 1,
      overLimit: 0,
    })
  })

  it('supports unlimited and legacy catalog plans', () => {
    expect(resolveMerchantCatalogCapacity({ current: 50, limit: null, proposedNew: 1000 })).toEqual({
      current: 50,
      limit: null,
      remaining: null,
      proposedNew: 1000,
      overLimit: 0,
    })
  })

  it('treats an already-over-limit catalog as having no remaining capacity', () => {
    expect(resolveMerchantCatalogCapacity({ current: 52, limit: 50, proposedNew: 1 })).toMatchObject({
      remaining: 0,
      overLimit: 1,
    })
  })
})

describe('merchant Catalog PostgreSQL capacity guard', () => {
  it('builds a tenant-scoped transactional assertion for all proposed identities', () => {
    const query = buildMerchantCatalogCapacityGuardQuery({
      merchantId: 'merchant-a',
      expectedPlanCode: 'FREE',
      expectedCommercialStatus: 'ACTIVE',
      limit: 50,
      frames: [
        { sku: 'SKU-A', source: 'CSV', externalId: null, productUrl: 'https://catalog.test/a' },
        { sku: null, source: 'EXTERNAL', externalId: 'external-b', productUrl: 'https://catalog.test/b' },
      ],
    })

    expect(query.text).toContain('frame."merchantId" = merchant."id"')
    expect(query.text).toContain('WHERE "id" = $1') // every capacity read is rooted in the selected tenant.
    expect(query.text).toContain('1 / CASE WHEN') // rejection aborts the enclosing transaction before any DML.
    expect(query.params).toEqual([
      'merchant-a', 'FREE', 'ACTIVE', 50,
      'SKU-A', 'CSV', null, 'https://catalog.test/a',
      null, 'EXTERNAL', 'external-b', 'https://catalog.test/b',
    ])
  })

  it('classifies only database serialization conflicts for bounded retry', () => {
    expect(isMerchantCatalogTransactionConflict({ cause: { code: '40001' } })).toBe(true)
    expect(isMerchantCatalogTransactionConflict({ code: 'P2034' })).toBe(true)
    expect(isMerchantCatalogTransactionConflict({ code: '23505' })).toBe(false)
    expect(merchantCatalogCapacityErrorCode({ cause: { code: '22012' } })).toBe('22012')
  })
})
