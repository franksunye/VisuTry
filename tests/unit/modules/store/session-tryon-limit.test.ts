import { DEFAULT_SESSION_TRYON_LIMIT, isSessionTryOnLimit, resolveSessionTryOnLimit } from '@/modules/store/domain/session-tryon-limit'

describe('Merchant v2 Experience session Try-On policy', () => {
  it('defaults a historical nullable Experience to two generations', () => {
    expect(DEFAULT_SESSION_TRYON_LIMIT).toBe(2)
    expect(resolveSessionTryOnLimit(null)).toBe(2)
    expect(resolveSessionTryOnLimit(undefined)).toBe(2)
  })
  it.each([1, 2, 4] as const)('accepts exactly %i Try-On images', (n) => {
    expect(isSessionTryOnLimit(n)).toBe(true)
    expect(resolveSessionTryOnLimit(n)).toBe(n)
  })
  it.each([0, 3, 5, -1, '4', null, Infinity])('rejects unsupported selection %s', (input) => {
    expect(isSessionTryOnLimit(input)).toBe(false)
  })
  it('rejects invalid persisted values rather than silently enabling unlimited', () => {
    expect(() => resolveSessionTryOnLimit(8)).toThrow('Invalid persisted session Try-On limit')
  })
})
