import { formatPublicStorePrice } from '@/modules/store/domain/format-public-store-price'

describe('formatPublicStorePrice', () => {
  it('omits price presentation when the Store product has no price', () => {
    expect(formatPublicStorePrice(null, null)).toBeNull()
  })

  it('formats a real price from minor currency units', () => {
    expect(formatPublicStorePrice(12999, 'usd')).toBe('$129.99')
  })

  it('falls back to a truthful amount and currency for an unsupported code', () => {
    expect(formatPublicStorePrice(12999, 'invalid')).toBe('129.99 INVALID')
  })
})
