'use client'

import { ReactNode } from 'react'
import { PaymentConversionTracker } from '@/components/analytics/PaymentConversionTracker'
import { SessionProvider } from '@/components/providers/SessionProvider'

/**
 * Auth-aware runtime for 2C consumer routes (pricing, try-on, dashboard).
 * Public Store/Campaign discovery must not mount this boundary.
 */
export function ConsumerSessionBoundary({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PaymentConversionTracker />
      {children}
    </SessionProvider>
  )
}
