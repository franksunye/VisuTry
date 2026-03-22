import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionProvider, signOut, useSession } from 'next-auth/react'
import { redirectTo } from '@/lib/browser-navigation'

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/hooks/useTestSession', () => ({
  useTestSession: jest.fn(() => ({
    testSession: null,
    loading: false,
    clearTestSession: jest.fn(),
  })),
}))

jest.mock('@/lib/browser-navigation', () => ({
  redirectTo: jest.fn(),
}))

const { LoginButton } = require('@/components/auth/LoginButton')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockRedirectTo = redirectTo as jest.MockedFunction<typeof redirectTo>

function setSession(status: 'loading' | 'authenticated' | 'unauthenticated', data: any = null) {
  mockUseSession.mockReturnValue({
    data,
    status,
    update: jest.fn(),
  })
}

describe('LoginButton Auth0 integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setSession('unauthenticated')
  })

  it('renders the auth0 sign-in CTA', () => {
    render(
      <SessionProvider session={null}>
        <LoginButton />
      </SessionProvider>
    )

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('redirects to auth route with default callback', () => {
    render(
      <SessionProvider session={null}>
        <LoginButton />
      </SessionProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockRedirectTo).toHaveBeenCalledWith('http://localhost/api/auth/signin/auth0?callbackUrl=%2Ftry-on')
  })

  it('shows sign out controls for authenticated auth0 users', () => {
    setSession('authenticated', {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        username: 'testuser',
        role: 'USER',
        freeTrialsUsed: 0,
        premiumUsageCount: 0,
        creditsPurchased: 0,
        creditsUsed: 0,
        isPremium: false,
        premiumExpiresAt: null,
        isPremiumActive: false,
        remainingTrials: 3,
      },
      expires: '2099-01-01T00:00:00.000Z',
    })

    render(
      <SessionProvider session={null}>
        <LoginButton />
      </SessionProvider>
    )

    expect(screen.getByText('Test User')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalled()
  })
})
