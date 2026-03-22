import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { signIn, signOut, useSession } from 'next-auth/react'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('@/hooks/useTestSession', () => ({
  useTestSession: jest.fn(),
}))

import { useTestSession } from '@/hooks/useTestSession'
const { LoginButton } = require('@/components/auth/LoginButton')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUseTestSession = useTestSession as jest.MockedFunction<typeof useTestSession>

function mockNextAuthSession(overrides: {
  data?: any
  status?: 'loading' | 'authenticated' | 'unauthenticated'
} = {}) {
  mockUseSession.mockReturnValue({
    data: overrides.data ?? null,
    status: overrides.status ?? 'unauthenticated',
    update: jest.fn(),
  })
}

describe('LoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNextAuthSession()
    mockUseTestSession.mockReturnValue({
      testSession: null,
      loading: false,
      clearTestSession: jest.fn(),
    })
  })

  it('shows loading state when auth session is loading', () => {
    mockNextAuthSession({ status: 'loading' })

    render(<LoginButton />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders auth0 sign-in button when unauthenticated', () => {
    render(<LoginButton />)

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('uses the default try-on callback when signing in', () => {
    render(<LoginButton />)

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSignIn).toHaveBeenCalledWith('auth0', { callbackUrl: '/try-on' })
  })

  it('uses a custom callback when provided', () => {
    render(<LoginButton callbackUrl="/dashboard" />)

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSignIn).toHaveBeenCalledWith('auth0', { callbackUrl: '/dashboard' })
  })

  it('renders authenticated next-auth users and signs out', () => {
    mockNextAuthSession({
      status: 'authenticated',
      data: {
        user: {
          id: 'user-1',
          name: 'John Doe',
          username: 'johndoe',
          role: 'USER',
          freeTrialsUsed: 0,
          premiumUsageCount: 0,
          creditsPurchased: 0,
          creditsUsed: 0,
          isPremium: false,
          premiumExpiresAt: null,
          isPremiumActive: false,
          remainingTrials: 3,
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2099-01-01T00:00:00.000Z',
      },
    })

    render(<LoginButton />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByAltText('John Doe')).toHaveAttribute('src', 'https://example.com/avatar.jpg')

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('renders test sessions and clears them instead of calling signOut', () => {
    const clearTestSession = jest.fn()
    mockUseTestSession.mockReturnValue({
      testSession: {
        source: 'test',
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          image: '',
          username: 'testuser',
          freeTrialsUsed: 0,
          creditsPurchased: 0,
          creditsUsed: 0,
          premiumUsageCount: 0,
          isPremium: false,
          premiumExpiresAt: null,
          currentSubscriptionType: null,
        },
      },
      loading: false,
      clearTestSession,
    })

    render(<LoginButton variant="outline" className="custom-class" />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Test Mode')).toBeInTheDocument()

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    expect(signOutButton).toHaveClass('custom-class')

    fireEvent.click(signOutButton)
    expect(clearTestSession).toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})
