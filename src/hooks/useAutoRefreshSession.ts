'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'

/**
 * Auto-Refresh Session Hook
 *
 * Automatically refreshes session in the following cases (completely in background, transparent to user):
 * 1. When page switches from background to foreground
 * 2. When session might be expired (not refreshed for more than 5 minutes)
 *
 * @param options Configuration options
 * @param options.enabled Whether to enable auto-refresh (default: true)
 * @param options.refreshInterval Refresh interval in milliseconds (default: 5 minutes)
 */
export function useAutoRefreshSession(options?: {
  enabled?: boolean
  refreshInterval?: number
}) {
  const { enabled = true, refreshInterval = 5 * 60 * 1000 } = options || {}
  const { data: session, status, update } = useSession()
  const lastRefreshTime = useRef<number>(Date.now())
  const refreshInProgress = useRef<boolean>(false)

  // Function to refresh session
  const refreshSession = async (reason: string) => {
    if (!enabled || status !== 'authenticated' || refreshInProgress.current) {
      return
    }

    try {
      refreshInProgress.current = true
      console.log(`🔄 Auto-refreshing session (reason: ${reason})...`)
      logger.debug('hook', `Auto-refreshing session (reason: ${reason})`)

      await update()

      lastRefreshTime.current = Date.now()
      console.log('✅ Session auto-refreshed successfully')
      logger.info('hook', 'Session auto-refreshed successfully')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('❌ Failed to auto-refresh session:', error)
      logger.error('hook', 'Failed to auto-refresh session', err)
    } finally {
      refreshInProgress.current = false
    }
  }

  // Listen for page visibility changes
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current

        // Refresh session if exceeded refresh interval
        if (timeSinceLastRefresh > refreshInterval) {
          refreshSession('page became visible')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, refreshInterval])

  // Periodically check if refresh is needed
  useEffect(() => {
    if (!enabled) return

    const checkInterval = setInterval(() => {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.current

      if (timeSinceLastRefresh > refreshInterval) {
        refreshSession('periodic check')
      }
    }, 60 * 1000) // Check every minute

    return () => {
      clearInterval(checkInterval)
    }
  }, [enabled, refreshInterval])

  return {
    lastRefreshTime: lastRefreshTime.current,
    refreshSession: () => refreshSession('manual'),
  }
}

