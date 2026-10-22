'use client'

import { useSession } from 'next-auth/react'
import { ReactNode, useEffect, useState } from 'react'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { ConversionPaywallBoundary } from '@/components/payments/ConversionPaywallBoundary'
import { CreditExhaustedSurface } from '@/components/payments/CreditExhaustedBar'
import { TryOnInterface } from '@/components/try-on/TryOnInterface'
import type { TryOnType } from '@/config/try-on-types'

interface TryOnGateProps {
  tryOnType: TryOnType
  landing: ReactNode
  structuredData?: Record<string, unknown>
}

/**
 * Client-side gate for the Try-On page.
 *
 * Shows the server-rendered landing content until authentication succeeds,
 * and again after sign-out. A background NextAuth session refresh must not
 * unmount TryOnInterface and discard an already-generated result.
 * Quota-exhausted purchase actions stay inside the current try-on context.
 */
export function TryOnGate({ tryOnType, landing, structuredData }: TryOnGateProps) {
  const { data: session, status } = useSession()
  const [lastAuthenticatedSession, setLastAuthenticatedSession] = useState<typeof session>(null)

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setLastAuthenticatedSession(session)
    } else if (status === 'unauthenticated') {
      // Never retain the authenticated UI after a real sign-out.
      setLastAuthenticatedSession(null)
    }
  }, [session, status])

  // NextAuth update() may briefly report loading with data=null. Retain the
  // mounted try-on workspace only if this gate already saw a valid session.
  const visibleSession = status === 'authenticated'
    ? session
    : status === 'loading' ? lastAuthenticatedSession : null

  if (!visibleSession) {
    return <>{landing}</>
  }

  const remainingCredits = visibleSession.user?.remainingTrials ?? 0

  return (
    <AutoRefreshWrapper>
      <ConversionPaywallBoundary source="try_on">
        <CreditExhaustedSurface kind="try_on" availableCredits={remainingCredits} requiredCredits={1}>
          <div className="container mx-auto px-4 py-8">
            {structuredData && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
              />
            )}
            <TryOnInterface type={tryOnType} />
          </div>
        </CreditExhaustedSurface>
      </ConversionPaywallBoundary>
    </AutoRefreshWrapper>
  )
}
