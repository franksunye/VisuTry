'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, X } from 'lucide-react'
import { logger } from '@/lib/logger'

/**
 * Payment Success Handler Component
 * Detects ?payment=success parameter, auto-refreshes session, shows success toast
 */
export function PaymentSuccessHandler() {
  const searchParams = useSearchParams()
  const { update } = useSession()
  const [showToast, setShowToast] = useState(false)
  const [refreshed, setRefreshed] = useState(false)

  useEffect(() => {
    const paymentSuccess = searchParams?.get('payment') === 'success'

    if (paymentSuccess && !refreshed) {
      console.log('💳 Payment success detected, refreshing session...')
      logger.info('general', 'Payment success detected, refreshing session')

      // Auto-refresh session
      update()
        .then(() => {
          console.log('✅ Session refreshed after payment')
          logger.info('general', 'Session refreshed after payment')
          setRefreshed(true)
          setShowToast(true)

          // Auto-hide toast after 3 seconds
          setTimeout(() => {
            setShowToast(false)
          }, 3000)
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error))
          console.error('❌ Failed to refresh session:', error)
          logger.error('general', 'Failed to refresh session after payment', err)
          setRefreshed(true)
        })
    }
  }, [searchParams, refreshed, update])

  if (!showToast) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4 flex items-start space-x-3 max-w-sm">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            Balance Updated
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Your account balance has been successfully updated
          </p>
        </div>
        <button
          onClick={() => setShowToast(false)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

