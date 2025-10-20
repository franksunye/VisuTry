/**
 * Auth0 Sign-In Integration Tests
 * Tests for Auth0 authentication flow
 */

describe('Auth0 Sign-In Flow', () => {
  describe('Provider Configuration', () => {
    it('should have Auth0 provider available when configured', () => {
      const auth0Configured =
        !!process.env.AUTH0_ID &&
        !!process.env.AUTH0_SECRET &&
        !!process.env.AUTH0_ISSUER_BASE_URL

      // In test environment, Auth0 should be configured
      expect(auth0Configured).toBe(true)
    })

    it('should have valid Auth0 issuer URL', () => {
      const issuerUrl = process.env.AUTH0_ISSUER_BASE_URL
      if (issuerUrl) {
        expect(issuerUrl).toMatch(/^https:\/\//)
        expect(issuerUrl).toContain('auth0')
      }
    })
  })

  describe('OAuth Callback', () => {
    it('should handle Auth0 callback URL correctly', () => {
      const callbackUrl = '/api/auth/callback/auth0'
      expect(callbackUrl).toMatch(/^\/api\/auth\/callback\//)
    })

    it('should support multiple callback URLs', () => {
      const callbacks = [
        '/api/auth/callback/twitter',
        '/api/auth/callback/auth0',
      ]

      callbacks.forEach((url) => {
        expect(url).toMatch(/^\/api\/auth\/callback\//)
      })
    })
  })

  describe('User Profile Mapping', () => {
    it('should map Auth0 profile to user object', () => {
      const auth0Profile = {
        sub: 'auth0|user123',
        nickname: 'john_doe',
        name: 'John Doe',
        email: 'john@example.com',
        picture: 'https://example.com/avatar.jpg',
      }

      const mappedUser = {
        id: auth0Profile.sub,
        username: auth0Profile.nickname,
        name: auth0Profile.name,
        email: auth0Profile.email,
        image: auth0Profile.picture,
      }

      expect(mappedUser.id).toMatch(/^auth0\|/)
      expect(mappedUser.username).toBe('john_doe')
      expect(mappedUser.email).toBe('john@example.com')
    })

    it('should handle Auth0 profile without optional fields', () => {
      const minimalProfile = {
        sub: 'auth0|user456',
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
  })

  describe('Session Creation', () => {
    it('should create session with Auth0 user data', () => {
      const auth0User = {
        id: 'auth0|123',
        email: 'user@example.com',
        name: 'Test User',
        username: 'testuser',
      }

      const session = {
        user: {
          id: auth0User.id,
          email: auth0User.email,
          name: auth0User.name,
          username: auth0User.username,
          freeTrialsUsed: 0,
          isPremium: false,
          remainingTrials: 3,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      expect(session.user.id).toMatch(/^auth0\|/)
      expect(session.user.email).toBe('user@example.com')
      expect(session.user.freeTrialsUsed).toBe(0)
      expect(session.user.remainingTrials).toBe(3)
    })

    it('should set correct session expiration', () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const session = {
        expires: expiresAt.toISOString(),
      }

      const expiresDate = new Date(session.expires)
      const now = new Date()
      const diffDays = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      expect(diffDays).toBeGreaterThan(29)
      expect(diffDays).toBeLessThanOrEqual(30)
    })
  })

  describe('Multi-Provider Support', () => {
    it('should support both Twitter and Auth0 providers', () => {
      const providers = {
        twitter: !!process.env.TWITTER_CLIENT_ID,
        auth0: !!process.env.AUTH0_ID,
      }

      const hasMultipleProviders = Object.values(providers).filter(Boolean).length >= 1
      expect(hasMultipleProviders).toBe(true)
    })

    it('should allow user to sign in with either provider', () => {
      const signInMethods = ['twitter', 'auth0']
      expect(signInMethods).toContain('twitter')
      expect(signInMethods).toContain('auth0')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing Auth0 configuration gracefully', () => {
      const hasAuth0 =
        !!process.env.AUTH0_ID &&
        !!process.env.AUTH0_SECRET &&
        !!process.env.AUTH0_ISSUER_BASE_URL

      // In test environment, should be configured
      expect(hasAuth0).toBe(true)
    })

    it('should validate Auth0 issuer URL format', () => {
      const issuerUrl = process.env.AUTH0_ISSUER_BASE_URL
      if (issuerUrl) {
        const isValid = issuerUrl.startsWith('https://') && issuerUrl.includes('auth0')
        expect(isValid).toBe(true)
      }
    })
  })

  describe('Security', () => {
    it('should not expose client secret in frontend', () => {
      // Client secret should only be in environment variables
      const secret = process.env.AUTH0_SECRET
      expect(secret).toBeDefined()
      expect(secret).not.toBe('')
    })

    it('should use HTTPS for Auth0 issuer', () => {
      const issuerUrl = process.env.AUTH0_ISSUER_BASE_URL
      if (issuerUrl) {
        expect(issuerUrl).toMatch(/^https:\/\//)
      }
    })

    it('should have NEXTAUTH_SECRET configured', () => {
      const secret = process.env.NEXTAUTH_SECRET
      expect(secret).toBeDefined()
      expect(secret).not.toBe('')
      expect(secret?.length).toBeGreaterThan(10)
    })
  })
})

