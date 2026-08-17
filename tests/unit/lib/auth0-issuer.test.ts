import { normalizeAuth0Issuer } from '@/lib/auth0-issuer'

describe('normalizeAuth0Issuer', () => {
  it('removes trailing slashes before NextAuth builds discovery URLs', () => {
    expect(normalizeAuth0Issuer('https://auth.example.com/')).toBe('https://auth.example.com')
    expect(normalizeAuth0Issuer('https://auth.example.com///')).toBe('https://auth.example.com')
  })

  it('preserves a clean issuer and missing configuration', () => {
    expect(normalizeAuth0Issuer('https://auth.example.com')).toBe('https://auth.example.com')
    expect(normalizeAuth0Issuer(undefined)).toBeUndefined()
  })
})
