'use client'

import { useSession } from 'next-auth/react'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { FrameCompareInterface } from '@/components/compare/FrameCompareInterface'

/**
 * Client-side gate for the Frame Compare page.
 *
 * Renders nothing (null) while session is loading or unauthenticated, allowing
 * the server-rendered landing content to show. When the session resolves as
 * authenticated, renders the FrameCompareInterface on top.
 */
export function FrameCompareGate() {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return null
  }

  const initialRemainingCredits = session.user?.remainingTrials ?? 0

  return (
    <AutoRefreshWrapper>
      <FrameCompareInterface initialRemainingCredits={initialRemainingCredits} />
    </AutoRefreshWrapper>
  )
}
