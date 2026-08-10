'use client'

import { useSession } from 'next-auth/react'
import { ReactNode, Suspense } from 'react'
import { FaceAnalysisInterface } from '@/components/face-analysis/FaceAnalysisInterface'
import styles from './FaceAnalysisGate.module.css'

interface FaceAnalysisGateProps {
  landing: ReactNode
  loadingText: string
}

/**
 * Client-side gate for the Face Analysis page.
 *
 * Shows the server-rendered landing content until the first session resolves.
 * Once authenticated, keep the interface mounted while session.update() is
 * refreshing so task recovery effects cannot restart from a clean mount.
 */
export function FaceAnalysisGate({ landing, loadingText }: FaceAnalysisGateProps) {
  const { data: session, status } = useSession()

  if (status === 'unauthenticated' || !session) {
    return <>{landing}</>
  }

  return (
    <div className={`${styles.app} container mx-auto px-4 py-5 sm:py-8`}>
      <Suspense fallback={<div className="py-12 text-center text-gray-500">{loadingText}</div>}>
        <FaceAnalysisInterface />
      </Suspense>
    </div>
  )
}
