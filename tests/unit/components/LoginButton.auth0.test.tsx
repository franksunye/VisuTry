/**
 * LoginButton Auth0 Integration Tests
 * Tests for multi-provider login button
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { LoginButton } from '@/components/auth/LoginButton'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  SessionProvider: ({ children }: any) => children,
}))

// Mock useTestSession hook
jest.mock('@/hooks/useTestSession', () => ({
  useTestSession: jest.fn(() => ({
    testSession: null,
    loading: false,
    clearTestSession: jest.fn(),
  })),
}))

describe('LoginButton - Auth0 Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unauthenticated State', () => {
    it('should render Auth0 login button', () => {
      render(
        <SessionProvider session={null}>
          <LoginButton />
        </SessionProvider>
      )

      const auth0Button = screen.getByText(/Sign in with Auth0/i)
      expect(auth0Button).toBeInTheDocument()
    })

    it('should call signIn with auth0 provider when button is clicked', () => {
      const { signIn } = require('next-auth/react')

      render(
        <SessionProvider session={null}>
          <LoginButton />
        </SessionProvider>
      )

      const auth0Button = screen.getByText(/Sign in with Auth0/i)
      fireEvent.click(auth0Button)

      expect(signIn).toHaveBeenCalledWith('auth0', {
        callbackUrl: '/dashboard',
      })
    })

    it('should use custom callbackUrl when provided', () => {
      const { signIn } = require('next-auth/react')
      
      render(
        <SessionProvider session={null}>
          <LoginButton callbackUrl="/custom-page" />
        </SessionProvider>
      )

      const twitterButton = screen.getByText(/Sign in with Twitter/i)
      fireEvent.click(twitterButton)

      expect(signIn).toHaveBeenCalledWith('twitter', {
        callbackUrl: '/custom-page',
      })
    })

    it('should apply correct styling variants', () => {
      const { container } = render(
        <SessionProvider session={null}>
          <LoginButton variant="default" />
        </SessionProvider>
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(2)

      // Check for variant classes
      buttons.forEach((button) => {
        expect(button.className).toContain('bg-')
      })
    })
  })

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        username: 'testuser',
        freeTrialsUsed: 0,
        isPremium: false,
        premiumExpiresAt: null,
        isPremiumActive: false,
        remainingTrials: 3,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    it('should show user profile when authenticated', () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(
        <SessionProvider session={mockSession}>
          <LoginButton />
        </SessionProvider>
      )

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText(/Sign Out/i)).toBeInTheDocument()
    })

    it('should call signOut when Sign Out button is clicked', () => {
      const { useSession, signOut } = require('next-auth/react')
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(
        <SessionProvider session={mockSession}>
          <LoginButton />
        </SessionProvider>
      )

      const signOutButton = screen.getByText(/Sign Out/i)
      fireEvent.click(signOutButton)

      expect(signOut).toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while session is loading', () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(
        <SessionProvider session={null}>
          <LoginButton />
        </SessionProvider>
      )

      expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    })
  })
})

