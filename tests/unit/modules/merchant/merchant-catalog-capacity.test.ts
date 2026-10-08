import { resolveMerchantCatalogCapacity } from '@/modules/merchant/domain/merchant-catalog-capacity'

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
