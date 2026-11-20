'use client'

import { useSession } from 'next-auth/react'
import { ReactNode, Suspense, useEffect, useState } from 'react'
import { FaceAnalysisInterface } from '@/components/face-analysis/FaceAnalysisInterface'
import { DetectorAdvisorContinuation } from '@/components/face-analysis/DetectorAdvisorContinuation'
import { ConversionPaywallBoundary } from '@/components/payments/ConversionPaywallBoundary'
import styles from './FaceAnalysisGate.module.css'

interface FaceAnalysisGateProps {
  landing: ReactNode
  loadingText: string
  locale?: string
}

/**
 * Client-side gate for the Face Analysis page.
 *
 * Shows the server-rendered landing content until the first session resolves.
 * Once authenticated, keep the interface mounted while session.update() is
 * refreshing so task recovery effects cannot restart from a clean mount.
 */
export function FaceAnalysisGate({ landing, loadingText, locale = 'en' }: FaceAnalysisGateProps) {
  const { data: session, status } = useSession()
  const [lastAuthenticatedSession, setLastAuthenticatedSession] = useState<typeof session>(null)

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setLastAuthenticatedSession(session)
    } else if (status === 'unauthenticated') {
      // Preserve the strict sign-out boundary, even after a background refresh.
      setLastAuthenticatedSession(null)
    }
  }, [session, status])

  // NextAuth may report loading with data=null during update(). Do not unmount
  // the live Advisor workspace (including its one-time photo handoff) until a
  // real unauthenticated state is confirmed.
  const visibleSession = status === 'authenticated'
    ? session
    : status === 'loading' ? lastAuthenticatedSession : null

  if (!visibleSession) {
    return (
      <Suspense fallback={landing}>
        <DetectorAdvisorContinuation locale={locale} fallback={landing} />
      </Suspense>
    )
  }

  return (
    <div className={`${styles.app} container mx-auto px-4 py-5 sm:py-8`}>
      <Suspense fallback={<div className="py-12 text-center text-gray-500">{loadingText}</div>}>
        <ConversionPaywallBoundary source="face_analysis">
          <FaceAnalysisInterface />
        </ConversionPaywallBoundary>
      </Suspense>
    </div>
  )
}
