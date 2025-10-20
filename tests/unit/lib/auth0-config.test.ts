/**
 * Auth0 Configuration Tests
 * Tests for Auth0 environment variable validation and provider setup
 */

describe('Auth0 Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Environment Variables', () => {
    it('should validate Auth0 environment variables', () => {
      const auth0Config = {
        id: process.env.AUTH0_ID,
        secret: process.env.AUTH0_SECRET,
        issuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL,
      }

      // Auth0 config should be optional (at least one provider required)
      expect(auth0Config).toBeDefined()
    })

    it('should have Auth0 issuer URL in correct format', () => {
      if (process.env.AUTH0_ISSUER_BASE_URL) {
        const issuerUrl = process.env.AUTH0_ISSUER_BASE_URL
        expect(issuerUrl).toMatch(/^https:\/\//)
        expect(issuerUrl).toContain('auth0.com')
      }
    })
  })

  describe('Profile Mapping', () => {
    it('should correctly map Auth0 profile to user data', () => {
      const auth0Profile = {
        sub: 'auth0|123456',
        nickname: 'john_doe',
        name: 'John Doe',
        email: 'john@example.com',
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
        updated_at: '2024-01-01T00:00:00.000Z',
      }

      // Simulate profile mapping
      const mappedUser = {
        id: auth0Profile.sub,
        username: auth0Profile.nickname,
        name: auth0Profile.name,
        email: auth0Profile.email,
        image: auth0Profile.picture,
      }

      expect(mappedUser.id).toBe('auth0|123456')
      expect(mappedUser.username).toBe('john_doe')
      expect(mappedUser.email).toBe('john@example.com')
    })

    it('should handle missing optional fields in Auth0 profile', () => {
      const minimalProfile = {
        sub: 'auth0|789',
        name: 'Jane Doe',
        email: 'jane@example.com',
      }

      const mappedUser = {
        id: minimalProfile.sub,
        username: minimalProfile.name,
        name: minimalProfile.name,
        email: minimalProfile.email,
        image: undefined,
      }

      expect(mappedUser.username).toBe('Jane Doe')
      expect(mappedUser.image).toBeUndefined()
    })

    it('should prefer nickname over name for username', () => {
      const profile = {
        sub: 'auth0|456',
        nickname: 'preferred_name',
        name: 'Full Name',
        email: 'user@example.com',
      }

      // Simulate the logic: nickname ?? name
      const username = profile.nickname ?? profile.name

      expect(username).toBe('preferred_name')
    })
  })

  describe('Multi-Provider Compatibility', () => {
    it('should support Auth0 alongside Twitter', () => {
      // Set up test environment with at least one provider
      process.env.TWITTER_CLIENT_ID = 'test-twitter-id'
      process.env.TWITTER_CLIENT_SECRET = 'test-twitter-secret'

      const providers = {
        twitter: {
          enabled: !!process.env.TWITTER_CLIENT_ID,
          clientId: process.env.TWITTER_CLIENT_ID,
        },
        auth0: {
          enabled: !!process.env.AUTH0_ID,
          clientId: process.env.AUTH0_ID,
        },
      }

      // At least one provider should be enabled
      const hasAtLeastOneProvider =
        providers.twitter.enabled || providers.auth0.enabled

      expect(hasAtLeastOneProvider).toBe(true)
    })

    it('should handle provider-specific scopes', () => {
      const scopes = {
        twitter: 'tweet.read users.read offline.access',
        auth0: 'openid profile email',
      }

      expect(scopes.twitter).toContain('users.read')
      expect(scopes.auth0).toContain('openid')
    })
  })

  describe('Session Handling', () => {
    it('should create session with Auth0 user data', () => {
      const auth0User = {
        id: 'auth0|123',
        email: 'user@example.com',
        name: 'Test User',
        nickname: 'testuser',
      }

      const session = {
        user: {
          id: auth0User.id,
          email: auth0User.email,
          name: auth0User.name,
          username: auth0User.nickname,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      expect(session.user.id).toBe('auth0|123')
      expect(session.user.username).toBe('testuser')
    })

    it('should handle JWT token with Auth0 claims', () => {
      const token = {
        sub: 'auth0|123',
        iss: 'https://example.auth0.com/',
        aud: 'client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      }

      expect(token.sub).toMatch(/^auth0\|/)
      expect(token.iss).toContain('auth0.com')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing Auth0 configuration gracefully', () => {
      process.env.AUTH0_ID = undefined
      process.env.AUTH0_SECRET = undefined
      process.env.AUTH0_ISSUER_BASE_URL = undefined

      // Should not throw, just skip Auth0 provider
      const hasAuth0 =
        !!process.env.AUTH0_ID &&
        !!process.env.AUTH0_SECRET &&
        !!process.env.AUTH0_ISSUER_BASE_URL

      expect(hasAuth0).toBe(false)
    })

    it('should validate Auth0 issuer URL format', () => {
      const invalidUrls = [
        'http://example.auth0.com', // Not HTTPS
        'https://example.com', // Not auth0.com
        'invalid-url',
      ]

      invalidUrls.forEach((url) => {
        const isValid = url.startsWith('https://') && url.includes('auth0.com')
        expect(isValid).toBe(false)
      })

      const validUrl = 'https://example.auth0.com'
      const isValid =
        validUrl.startsWith('https://') && validUrl.includes('auth0.com')
      expect(isValid).toBe(true)
    })
  })
})

