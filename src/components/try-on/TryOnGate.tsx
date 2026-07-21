'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
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
 * Shows the server-rendered landing content while session is loading or
 * unauthenticated. When authenticated, renders the TryOnInterface.
 */
export function TryOnGate({ tryOnType, landing, structuredData }: TryOnGateProps) {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return <>{landing}</>
  }

  return (
    <AutoRefreshWrapper>
      <div className="container mx-auto px-4 py-8">
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
        <TryOnInterface type={tryOnType} />
      </div>
    </AutoRefreshWrapper>
  )
}
