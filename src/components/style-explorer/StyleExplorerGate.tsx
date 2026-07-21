'use client'

import { useSession } from 'next-auth/react'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { StyleExplorerInterface } from '@/components/style-explorer/StyleExplorerInterface'
import { StyleExplorerMarketing } from '@/components/style-explorer/StyleExplorerMarketing'

interface StyleExplorerGateProps {
  locale: string
  signInHref: string
}

/**
 * Client-side gate for the Style Explorer page.
 *
 * Replaces the previous server-side getServerSession check so the page can be
 * fully static-rendered. The session is resolved on the client via useSession(),
 * which fetches /api/auth/session on mount.
 */
export function StyleExplorerGate({ locale, signInHref }: StyleExplorerGateProps) {
  const { data: session, status } = useSession()

  // While session is loading, render marketing to avoid layout shift for
  // the majority (unauthenticated) visitors. Authenticated users will see a
  // brief flash of marketing before the interface hydrates.
  if (status === 'loading' || !session) {
    return <StyleExplorerMarketing locale={locale} signInHref={signInHref} />
  }

  const initialRemainingCredits = session.user?.remainingTrials ?? 0

  return (
    <AutoRefreshWrapper>
      <StyleExplorerInterface initialRemainingCredits={initialRemainingCredits} />
    </AutoRefreshWrapper>
  )
}
