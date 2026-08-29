'use client'

import { useContext } from 'react'
import { SessionContext, type SessionContextValue } from 'next-auth/react'

/**
 * next-auth `useSession()` returns `undefined` in production when no
 * SessionProvider is mounted. Public Store/Campaign discovery intentionally
 * omits that provider so first paint does not call `/api/auth/session`.
 */
export function useOptionalSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) {
    return {
      data: null,
      status: 'unauthenticated',
      update: async () => null,
    }
  }
  return value
}
