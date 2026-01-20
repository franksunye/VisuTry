"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { Session } from "next-auth"
import { ReactNode, useEffect } from "react"

interface SessionProviderProps {
  children: ReactNode
  session?: Session | null
}

/**
 * Enhanced SessionProvider with automatic retry and error recovery
 * 
 * Configuration:
 * - refetchInterval: 5 minutes - periodically refresh session to stay in sync
 * - refetchOnWindowFocus: true - refresh when user returns to tab
 * - refetchWhenOffline: false - don't attempt refresh when offline (prevents CLIENT_FETCH_ERROR)
 */
export function SessionProvider({ children, session }: SessionProviderProps) {
  // Log session fetch errors for debugging
  useEffect(() => {
    const handleOnline = () => {
      console.log('[SessionProvider] Network online, session will refresh automatically')
    }
    const handleOffline = () => {
      console.log('[SessionProvider] Network offline, session refresh paused')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <NextAuthSessionProvider 
      session={session}
      // Refetch session every 5 minutes to keep it in sync with server
      refetchInterval={5 * 60}
      // Refetch when user returns to the tab
      refetchOnWindowFocus={true}
      // Don't refetch when browser is offline to prevent CLIENT_FETCH_ERROR
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
