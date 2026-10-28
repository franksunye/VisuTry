'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, Clock, X } from 'lucide-react'
import { logger } from '@/lib/logger'
import {
  expectedPremiumPlan,
  isPremiumCheckoutReady,
  type ConsumerBalanceSnapshot,
} from '@/lib/payment-entitlement'

type PaymentToast = { kind: 'success' | 'pending'; title: string; description: string }

/**
 * Check the authoritative user record after Stripe redirects back to Dashboard.
 * Subscriptions do not increment Credits, and a JWT update can be rate-limited.
 * Only the API response is used for displaying the user's entitlement.
 */
export function PaymentSuccessHandler({
  onBalanceReady,
}: {
  onBalanceReady?: (balance: ConsumerBalanceSnapshot) => void
}) {
  const searchParams = useSearchParams()
  const { update } = useSession()
  const processedSession = useRef<string | null>(null)
  const [toast, setToast] = useState<PaymentToast | null>(null)

  useEffect(() => {
    if (searchParams?.get('payment') !== 'success') return
    const checkoutId = searchParams.get('session_id') || 'legacy'
    if (processedSession.current === checkoutId) return
    processedSession.current = checkoutId

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    const expectedPlan = expectedPremiumPlan(searchParams.get('checkout_product'))

    function announce(next: PaymentToast) {
      if (cancelled) return
      setToast(next)
      hideTimer = setTimeout(() => { if (!cancelled) setToast(null) }, next.kind === 'pending' ? 10_000 : 5_000)
    }

    async function waitForNextPoll() {
      await new Promise<void>((resolve) => {
        retryTimer = setTimeout(resolve, 2_000)
      })
    }

    async function verifyPaymentReturn() {
      if (!expectedPlan) {
        // Existing Credits Pack and legacy return links keep their former path.
        await update()
        announce({
          kind: 'success',
          title: 'Payment received',
          description: 'Your account may take a moment to reflect the new balance.',
        })
        return
      }

      for (let attempt = 0; attempt < 15 && !cancelled; attempt++) {
        try {
          const response = await fetch('/api/user/balance', { cache: 'no-store' })
          if (response.status === 401) {
            announce({ kind: 'pending', title: 'Sign in to continue', description: 'Please sign in again to check your subscription.' })
            return
          }
          if (!response.ok) throw new Error(`Balance read returned ${response.status}`)
          const payload = await response.json()
          const balance = payload?.data as ConsumerBalanceSnapshot | undefined
          if (payload?.success && balance && isPremiumCheckoutReady(expectedPlan, balance)) {
            onBalanceReady?.(balance)
            // NextAuth may throttle this refresh; the fresh API balance above
            // remains the displayed source of truth even when JWT is stale.
            try { await update() } catch (error) {
              logger.warn('payment', 'Session refresh after verified upgrade failed', { error: String(error) })
            }
            announce({ kind: 'success', title: 'Subscription activated', description: 'Your Premium benefits are now available.' })
            return
          }
        } catch (error) {
          logger.warn('payment', 'Waiting for Premium entitlement after checkout', { error: String(error) })
        }
        if (attempt < 14 && !cancelled) await waitForNextPoll()
      }

      announce({
        kind: 'pending',
        title: 'Subscription is still updating',
        description: 'Your payment return was received. Please refresh shortly; no additional purchase is needed.',
      })
    }

    void verifyPaymentReturn().catch((error) => {
      logger.error('payment', 'Payment return verification failed', error instanceof Error ? error : new Error(String(error)))
      announce({ kind: 'pending', title: 'Account update delayed', description: 'Please refresh your Dashboard shortly.' })
    })

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [searchParams, update, onBalanceReady])

  if (!toast) return null

  const successful = toast.kind === 'success'
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg border bg-white shadow-lg ${successful ? 'border-green-200' : 'border-amber-200'}`} role="status">
      <div className="flex items-start gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${successful ? 'bg-green-100' : 'bg-amber-100'}`}>
          {successful ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Clock className="h-6 w-6 text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{toast.title}</p>
          <p className="mt-1 text-sm text-gray-600">{toast.description}</p>
        </div>
        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss payment message">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
