'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { ConversionPaywallBoundary } from '@/components/payments/ConversionPaywallBoundary'
import { CreditExhaustedSurface } from '@/components/payments/CreditExhaustedBar'
import { FrameCompareInterface } from '@/components/compare/FrameCompareInterface'

interface ComparePageClientProps {
  landing: ReactNode
}

/**
 * Client-side controller for the Frame Compare page.
 *
 * The server-rendered landing content (SEO-optimized, with structured data) is
 * shown by default. When useSession resolves as authenticated, the landing is
 * hidden and Frame Compare renders inside the contextual purchase boundary.
 */
export function ComparePageClient({ landing }: ComparePageClientProps) {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return <>{landing}</>
  }

  const initialRemainingCredits = session.user?.remainingTrials ?? 0

  return (
    <AutoRefreshWrapper>
      <ConversionPaywallBoundary source="frame_compare">
        <CreditExhaustedSurface
          kind="frame_compare"
          availableCredits={initialRemainingCredits}
          requiredCredits={4}
        >
          <FrameCompareInterface initialRemainingCredits={initialRemainingCredits} />
        </CreditExhaustedSurface>
      </ConversionPaywallBoundary>
    </AutoRefreshWrapper>
  )
}
