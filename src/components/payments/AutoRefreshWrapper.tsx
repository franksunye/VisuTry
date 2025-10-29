'use client'

import { useAutoRefreshSession } from '@/hooks/useAutoRefreshSession'

/**
 * Auto-Refresh Wrapper Component
 * Used for Payments and Try-on pages to automatically keep session up-to-date
 */
export function AutoRefreshWrapper({ children }: { children: React.ReactNode }) {
  // Enable auto-refresh (every 5 minutes or on page switch)
  useAutoRefreshSession({
    enabled: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  })

  return <>{children}</>
}

