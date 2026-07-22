'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useMemo } from 'react'
import { calculateRemainingQuota, getSubscriptionQuotaLabel, QUOTA_CONFIG, type ProductType } from '@/config/pricing'
import { getUserType, type UserType } from '@/lib/analytics'

/**
 * Unified quota hook for client components.
 *
 * Replaces inline quota calculations across 11+ components.
 * Uses session.user as the primary data source (no extra fetch needed),
 * with optional refresh() to get fresh data from /api/user/balance.
 *
 * Usage:
 *   const { creditsRemaining, totalRemaining, userType, isPremiumActive } = useQuota()
 */

export interface QuotaState {
  // ── Raw values (from session or refreshed balance) ──
  isPremiumActive: boolean
  subscriptionType: ProductType | string | null
  isYearlySubscription: boolean
  creditsPurchased: number
  creditsUsed: number
  freeTrialsUsed: number
  premiumUsageCount: number

  // ── Computed values ──
  creditsRemaining: number
  subscriptionRemaining: number
  totalRemaining: number
  description: string
  userType: UserType
  quotaLabel: string
  quotaLabelCount: number

  // ── Loading state ──
  loading: boolean
}

export function useQuota(): QuotaState {
  const { data: session, status } = useSession()

  const user = session?.user as Record<string, unknown> | undefined

  const isPremiumActive = (user?.isPremiumActive as boolean) || false
  const subscriptionType = (user?.subscriptionType as ProductType | string | null) || (user?.currentSubscriptionType as ProductType | string | null) || null
  const isYearlySubscription = String(subscriptionType).includes('YEARLY')
  const creditsPurchased = (user?.creditsPurchased as number) || 0
  const creditsUsed = (user?.creditsUsed as number) || 0
  const freeTrialsUsed = (user?.freeTrialsUsed as number) || 0
  const premiumUsageCount = (user?.premiumUsageCount as number) || 0

  const computed = useMemo(() => {
    const { subscriptionRemaining, creditsRemaining, totalRemaining, description } =
      calculateRemainingQuota(
        isPremiumActive,
        subscriptionType,
        freeTrialsUsed,
        premiumUsageCount,
        creditsPurchased,
        creditsUsed,
      )

    const userType = getUserType(isPremiumActive, creditsRemaining, status === 'authenticated')

    const { quota: quotaLabelCount, label: quotaLabel } = getSubscriptionQuotaLabel(
      isPremiumActive,
      subscriptionType,
      freeTrialsUsed,
    )

    return {
      subscriptionRemaining,
      creditsRemaining,
      totalRemaining,
      description,
      userType,
      quotaLabel,
      quotaLabelCount,
    }
  }, [isPremiumActive, subscriptionType, freeTrialsUsed, premiumUsageCount, creditsPurchased, creditsUsed, status])

  return {
    isPremiumActive,
    subscriptionType,
    isYearlySubscription,
    creditsPurchased,
    creditsUsed,
    freeTrialsUsed,
    premiumUsageCount,
    ...computed,
    loading: status === 'loading',
  }
}

/**
 * Get fresh balance from the server.
 * Useful after payments or quota consumption.
 */
export function useRefreshBalance() {
  return useCallback(async () => {
    const response = await fetch('/api/user/balance')
    if (!response.ok) return null
    const data = await response.json()
    if (!data.success) return null
    return data.data as {
      creditsPurchased: number
      creditsUsed: number
      premiumUsageCount: number
      freeTrialsUsed: number
      isPremiumActive: boolean
      currentSubscriptionType: string | null
    }
  }, [])
}
