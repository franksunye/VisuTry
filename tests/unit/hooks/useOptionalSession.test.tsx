import { renderHook } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { useOptionalSession } from '@/hooks/useOptionalSession'
import { useQuota } from '@/hooks/useQuota'

describe('useOptionalSession', () => {
  it('returns an unauthenticated guest session when no provider is mounted', () => {
    const { result } = renderHook(() => useOptionalSession())
    expect(result.current.data).toBeNull()
    expect(result.current.status).toBe('unauthenticated')
  })
})

describe('useQuota', () => {
  it('does not throw outside SessionProvider', () => {
    const { result } = renderHook(() => useQuota())
    expect(result.current.loading).toBe(false)
    expect(result.current.totalRemaining).toBeGreaterThanOrEqual(0)
    expect(result.current.userType).toBe('anonymous')
  })

  it('reads signed-in credits from session when a provider is present', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider
        session={{
          user: {
            creditsPurchased: 5,
            creditsUsed: 2,
            isPremiumActive: false,
            freeTrialsUsed: 0,
            premiumUsageCount: 0,
          } as never,
          expires: new Date(Date.now() + 60_000).toISOString(),
        }}
      >
        {children}
      </SessionProvider>
    )
    const { result } = renderHook(() => useQuota(), { wrapper })
    expect(result.current.loading).toBe(false)
    expect(result.current.creditsPurchased).toBe(5)
    expect(result.current.creditsUsed).toBe(2)
  })
})
