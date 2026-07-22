'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardStatsSkeleton } from '@/components/dashboard/DashboardStatsSkeleton'
import { RecentTryOnsSkeleton } from '@/components/dashboard/RecentTryOnsSkeleton'
import { RecentFaceAnalysesSkeleton } from '@/components/dashboard/RecentFaceAnalysesSkeleton'
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard'
import { PaymentSuccessHandler } from '@/components/dashboard/PaymentSuccessHandler'
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions'
import { Glasses, Plus } from 'lucide-react'
import Link from 'next/link'
import { localizedPath } from '@/lib/localized-path'

interface RecentTryOn {
  id: string
  status: string
  userImageUrl: string
  resultImageUrl: string
  createdAt: string
}

interface DashboardPageClientProps {
  locale: string
}

/**
 * Client-side dashboard page.
 *
 * Replaces the previous server-side getServerSession + getCachedUserPayment +
 * prisma queries to avoid Neon HTTP driver timeouts during SSR.
 * Auth, user data, and recent items are all fetched on the client.
 */
export function DashboardPageClient({ locale }: DashboardPageClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [recentTryOns, setRecentTryOns] = useState<RecentTryOn[] | null>(null)
  const [userBalance, setUserBalance] = useState<{
    creditsPurchased: number
    creditsUsed: number
    premiumUsageCount: number
    freeTrialsUsed: number
    isPremiumActive: boolean
    currentSubscriptionType: string | null
  } | null>(null)

  // Redirect to signin if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(localizedPath(locale, '/auth/signin'))
    }
  }, [status, router, locale])

  // Fetch recent try-ons
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/try-on/history?page=1&limit=6')
      .then(async (res) => {
        if (!res.ok) return
        const json = await res.json()
        if (json.success) {
          setRecentTryOns(json.data.tasks)
        }
      })
      .catch(() => setRecentTryOns([]))
  }, [status])

  // Fetch user balance
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/balance')
      .then(async (res) => {
        if (!res.ok) return
        const json = await res.json()
        if (json.success) {
          setUserBalance(json.data)
        }
      })
      .catch(() => {})
  }, [status])

  if (status === 'loading' || !session?.user?.id) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <DashboardStatsSkeleton />
            <RecentTryOnsSkeleton />
            <RecentFaceAnalysesSkeleton />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const user = session.user as any
  const isPremiumActive = userBalance?.isPremiumActive ?? user.isPremiumActive
  const subscriptionType = userBalance?.currentSubscriptionType ?? user.subscriptionType
  const isYearlySubscription = subscriptionType === 'PREMIUM_YEARLY'
  const creditsPurchased = userBalance?.creditsPurchased ?? user.creditsPurchased ?? 0
  const creditsUsed = userBalance?.creditsUsed ?? user.creditsUsed ?? 0
  const freeTrialsUsed = userBalance?.freeTrialsUsed ?? user.freeTrialsUsed ?? 0
  const premiumUsageCount = userBalance?.premiumUsageCount ?? user.premiumUsageCount ?? 0
  const remainingTrials = user.remainingTrials ?? 3

  const userForCard = {
    ...user,
    subscriptionType,
    isYearlySubscription,
  }

  const userType = isPremiumActive ? 'premium' : (creditsPurchased - creditsUsed) > 0 ? 'credits' : 'free'

  return (
    <div className="container px-4 py-8 mx-auto">
      <PaymentSuccessHandler />

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href={localizedPath(locale, '/try-on')}
          className="flex items-center px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start Try-On
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Stats Cards */}
          {userBalance ? (
            <DashboardStats
              stats={{
                userId: user.id,
                isPremiumActive,
                subscriptionType,
                isYearlySubscription,
                remainingTrials,
                creditsPurchased,
                creditsUsed,
                freeTrialsUsed,
                premiumUsageCount,
              } as any}
            />
          ) : (
            <DashboardStatsSkeleton />
          )}

          {/* Recent Try-Ons */}
          {recentTryOns !== null ? (
            <RecentTryOnsClient tryOns={recentTryOns} />
          ) : (
            <RecentTryOnsSkeleton />
          )}

          {/* Recent Face Analyses - skeleton for now, loads on client */}
          <RecentFaceAnalysesSkeleton />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SubscriptionCard user={userForCard} />
          <DashboardQuickActions userType={userType} remainingTrials={remainingTrials} />
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <h3 className="mb-3 text-lg font-semibold text-blue-900">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use clear, front-facing photos for best results</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Good lighting improves AI accuracy</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Try different frame styles to find your perfect match</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Minimal client-side recent try-ons list.
 * Replaces the server-side RecentTryOnsAsync component.
 */
function RecentTryOnsClient({ tryOns }: { tryOns: RecentTryOn[] }) {
  if (tryOns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Recent Try-Ons</h2>
        <p className="text-gray-500">No try-on records yet. Start your first try-on!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Try-Ons</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tryOns.map((tryOn) => (
          <Link
            key={tryOn.id}
            href={`/dashboard/history`}
            className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
          >
            {tryOn.resultImageUrl ? (
              <img
                src={tryOn.resultImageUrl}
                alt="Try-on result"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Glasses className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-white capitalize">{tryOn.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
