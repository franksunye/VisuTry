'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { analytics, type ProductType } from '@/lib/analytics'

const TRACKED_PAYMENT_PREFIX = 'visutry_purchase_tracked:'
const MAX_ATTEMPTS = 12
const RETRY_DELAY_MS = 1500

type CompletedPaymentResponse = {
  success: true
  status: 'completed'
  data: {
    transactionId: string
    productType: ProductType
    value: number
    currency: string
  }
}

/**
 * Converts a verified, completed Payment row into the GA4 recommended
 * `purchase` event. It lives in the locale layout so every Stripe return path
 * (pricing or face-analysis unlock) receives the same attribution behavior.
 */
export function PaymentConversionTracker() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return

    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    if (!sessionId) return

    const storageKey = `${TRACKED_PAYMENT_PREFIX}${sessionId}`
    try {
      if (window.localStorage.getItem(storageKey)) return
    } catch {
      // GA4 also de-duplicates purchases by transaction_id. Continue when
      // localStorage is unavailable.
    }

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const verifyAndTrack = async (attempt: number) => {
      try {
        const response = await fetch(
          `/api/payment/conversion?session_id=${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' },
        )
        const payload = await response.json()

        if (cancelled) return

        if (response.ok && payload.status === 'completed') {
          if (!window.gtag && !window.dataLayer) {
            throw new Error('Analytics runtime is not ready')
          }

          const completed = payload as CompletedPaymentResponse
          analytics.trackPurchase(
            completed.data.transactionId,
            completed.data.productType,
            completed.data.value,
          )
          try {
            window.localStorage.setItem(storageKey, new Date().toISOString())
          } catch {
            // Tracking already succeeded; storage is only a client-side guard.
          }
          return
        }
      } catch {
        // A temporary network or webhook timing failure should retry quietly.
      }

      if (attempt < MAX_ATTEMPTS && !cancelled) {
        timeoutId = setTimeout(() => verifyAndTrack(attempt + 1), RETRY_DELAY_MS)
      }
    }

    void verifyAndTrack(1)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [status])

  return null
}
