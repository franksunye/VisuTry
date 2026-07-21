'use client'

import { useSession } from 'next-auth/react'
import { ReactNode, Suspense } from 'react'
import { FaceAnalysisInterface } from '@/components/face-analysis/FaceAnalysisInterface'

interface FaceAnalysisGateProps {
  landing: ReactNode
  loadingText: string
}

/**
 * Client-side gate for the Face Analysis page.
 *
 * Shows the server-rendered landing content while session is loading or
 * unauthenticated. When authenticated, renders the FaceAnalysisInterface.
 */
export function FaceAnalysisGate({ landing, loadingText }: FaceAnalysisGateProps) {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return <>{landing}</>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center py-12 text-gray-500">{loadingText}</div>}>
        <FaceAnalysisInterface />
      </Suspense>
    </div>
  )
}
