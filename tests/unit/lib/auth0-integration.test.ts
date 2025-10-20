/**
 * Auth0 Integration Tests
 * Tests for Auth0 provider configuration and profile mapping
 */

// Polyfill for TextDecoder in Jest environment
if (typeof global.TextDecoder === 'undefined') {
  const { TextDecoder } = require('util')
  global.TextDecoder = TextDecoder
}

describe('Auth0 Integration', () => {
  describe('Provider Configuration', () => {
    it('should have Auth0 provider configured when env vars are set', () => {
      const originalEnv = process.env
      process.env = {
        ...originalEnv,
        AUTH0_ID: 'test-id',
        AUTH0_SECRET: 'test-secret',
        AUTH0_ISSUER_BASE_URL: 'https://test.auth0.com',
        NEXTAUTH_SECRET: 'test-secret',
      }

      // Import after setting env vars
      delete require.cache[require.resolve('@/lib/auth')]
      const { authOptions } = require('@/lib/auth')

      const auth0Provider = authOptions.providers.find(
        (p: any) => p.id === 'auth0'
      )

      expect(auth0Provider).toBeDefined()
      expect(auth0Provider?.options?.clientId).toBe('test-id')
      expect(auth0Provider?.options?.clientSecret).toBe('test-secret')
      expect(auth0Provider?.options?.issuer).toBe('https://test.auth0.com')

      process.env = originalEnv
    })

    it('should not include Auth0 provider when env vars are missing', () => {
      const originalEnv = process.env
      process.env = {
        ...originalEnv,
        AUTH0_ID: undefined,
        AUTH0_SECRET: undefined,
        AUTH0_ISSUER_BASE_URL: undefined,
        NEXTAUTH_SECRET: 'test-secret',
        TWITTER_CLIENT_ID: 'test-id',
        TWITTER_CLIENT_SECRET: 'test-secret',
      }

      delete require.cache[require.resolve('@/lib/auth')]
      const { authOptions } = require('@/lib/auth')

      const auth0Provider = authOptions.providers.find(
        (p: any) => p.id === 'auth0'
      )

      expect(auth0Provider).toBeUndefined()

      process.env = originalEnv
    })
  })

  describe('Profile Mapping', () => {
    it('should extract Auth0 profile data correctly', () => {
      const auth0Profile = {
        sub: 'auth0|123456',
        nickname: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
      }

      // Simulate JWT callback with Auth0 profile
      const token: any = {}
      const account = { provider: 'auth0' }
      const profile = auth0Profile

      // Expected behavior from jwt callback
      token.username = profile.nickname ?? profile.name ?? token.username
      token.email = profile.email ?? token.email

      expect(token.username).toBe('testuser')
      expect(token.email).toBe('test@example.com')
    })

    it('should fallback to name when nickname is not available', () => {
      const auth0Profile = {
        sub: 'auth0|123456',
        name: 'Test User',
        email: 'test@example.com',
      }

      const token: any = {}
      token.username = auth0Profile.nickname ?? auth0Profile.name ?? token.username

      expect(token.username).toBe('Test User')
    })

    it('should handle missing email gracefully', () => {
      const auth0Profile = {
        sub: 'auth0|123456',
        nickname: 'testuser',
        name: 'Test User',
      }

      const token: any = { email: 'existing@example.com' }
      if (!token.email) token.email = auth0Profile.email ?? token.email

      expect(token.email).toBe('existing@example.com')
    })
  })

  describe('Multi-Provider Support', () => {
    it('should support both Twitter and Auth0 providers', () => {
      const originalEnv = process.env
      process.env = {
        ...originalEnv,
        TWITTER_CLIENT_ID: 'twitter-id',
        TWITTER_CLIENT_SECRET: 'twitter-secret',
        AUTH0_ID: 'auth0-id',
        AUTH0_SECRET: 'auth0-secret',
        AUTH0_ISSUER_BASE_URL: 'https://test.auth0.com',
        NEXTAUTH_SECRET: 'test-secret',
      }

      delete require.cache[require.resolve('@/lib/auth')]
      const { authOptions } = require('@/lib/auth')

      const twitterProvider = authOptions.providers.find(
        (p: any) => p.id === 'twitter'
      )
      const auth0Provider = authOptions.providers.find(
        (p: any) => p.id === 'auth0'
      )

      expect(twitterProvider).toBeDefined()
      expect(auth0Provider).toBeDefined()

      process.env = originalEnv
    })

    it('should require at least one provider to be configured', () => {
      const originalEnv = process.env
      process.env = {
        ...originalEnv,
        TWITTER_CLIENT_ID: undefined,
        TWITTER_CLIENT_SECRET: undefined,
        AUTH0_ID: undefined,
        AUTH0_SECRET: undefined,
        AUTH0_ISSUER_BASE_URL: undefined,
        NEXTAUTH_SECRET: 'test-secret',
      }

      expect(() => {
        delete require.cache[require.resolve('@/lib/auth')]
        require('@/lib/auth')
      }).toThrow()

      process.env = originalEnv
    })
  })
})

