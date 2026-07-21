'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { FrameCompareInterface } from '@/components/compare/FrameCompareInterface'

interface ComparePageClientProps {
  landing: ReactNode
}

/**
 * Client-side controller for the Frame Compare page.
 *
 * The server-rendered landing content (SEO-optimized, with structured data) is
 * shown by default. When useSession resolves as authenticated, the landing is
 * hidden and the FrameCompareInterface is rendered instead.
 */
export function ComparePageClient({ landing }: ComparePageClientProps) {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return <>{landing}</>
  }

  const initialRemainingCredits = session.user?.remainingTrials ?? 0

  return (
    <AutoRefreshWrapper>
      <FrameCompareInterface initialRemainingCredits={initialRemainingCredits} />
    </AutoRefreshWrapper>
  )
}
