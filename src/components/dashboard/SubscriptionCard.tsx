'use client'

import { Star, Crown, Clock, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { analytics } from "@/lib/analytics"

interface User {
  id: string
  name?: string | null
  isPremium?: boolean
  premiumExpiresAt?: Date | null
  freeTrialsUsed?: number
  isPremiumActive?: boolean
  remainingTrials?: number
  subscriptionType?: string | null
  isYearlySubscription?: boolean
  premiumUsageCount?: number
  creditsPurchased?: number
  creditsUsed?: number
}

interface SubscriptionCardProps {
  user: User
}

export function SubscriptionCard({ user }: SubscriptionCardProps) {
  const freeTrialLimit = 3

  // Calculate quota for all user types
  const isPremiumActive = user.isPremiumActive || false
  const subscriptionType = user.subscriptionType
  const isYearlySubscription = user.isYearlySubscription || false

  // Subscription quota
  let subscriptionQuota = 0
  let subscriptionUsed = 0
  let subscriptionLabel = ''

  if (isPremiumActive && subscriptionType) {
    subscriptionQuota = isYearlySubscription ? 420 : 30
    subscriptionUsed = user.premiumUsageCount || 0
    subscriptionLabel = isYearlySubscription ? 'Annual' : 'Monthly'
  } else {
    subscriptionQuota = freeTrialLimit
    subscriptionUsed = user.freeTrialsUsed || 0
    subscriptionLabel = 'Free'
  }

  // Credits quota
  const creditsPurchased = user.creditsPurchased || 0
  const creditsUsed = user.creditsUsed || 0

  // Total quota
  const totalQuota = subscriptionQuota + creditsPurchased
  const totalUsed = subscriptionUsed + creditsUsed
  const totalRemaining = totalQuota - totalUsed

  // Progress percentage
  const usagePercentage = totalQuota > 0 ? (totalUsed / totalQuota) * 100 : 0

  // Detail text
  const subscriptionRemaining = subscriptionQuota - subscriptionUsed
  const creditsRemaining = creditsPurchased - creditsUsed

  let detailText = ''
  if (creditsPurchased > 0) {
    detailText = `${subscriptionLabel}: ${subscriptionRemaining}/${subscriptionQuota}, Credits: ${creditsRemaining}/${creditsPurchased}`
  } else {
    detailText = `${subscriptionLabel}: ${subscriptionRemaining}/${subscriptionQuota}`
  }

  // Progress bar color based on usage
  let progressColor = 'bg-blue-600'
  if (usagePercentage >= 80) {
    progressColor = 'bg-red-600'
  } else if (usagePercentage >= 50) {
    progressColor = 'bg-yellow-600'
  }

  if (isPremiumActive) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-yellow-900">Standard Member</h3>
            <p className="text-yellow-700 text-sm">Enjoy enhanced AI try-ons</p>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-800 text-sm">Try-ons Used</span>
            <span className="text-yellow-900 font-medium">
              {totalUsed} / {totalQuota}
            </span>
          </div>

          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div
              className={`${progressColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-xs text-yellow-700">
              {detailText}
            </p>
            <p className="text-xs text-yellow-600">
              Total: {totalRemaining} try-ons remaining
            </p>
          </div>
        </div>

        {user.premiumExpiresAt && (
          <div className="pt-4 border-t border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800 text-sm">Subscription Expires</span>
              <span className="text-yellow-900 font-medium text-sm">
                {formatDistanceToNow(new Date(user.premiumExpiresAt), {
                  addSuffix: true
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Free user
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">Free User</h3>
          <p className="text-gray-600 text-sm">Experience AI try-on</p>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-sm">Try-ons Used</span>
          <span className="text-gray-900 font-medium">
            {totalUsed} / {totalQuota}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${progressColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-600">
            {detailText}
          </p>
          <p className="text-xs text-gray-500">
            Total: {totalRemaining} try-ons remaining
          </p>
        </div>
      </div>

      {/* Upgrade Notice */}
      {totalRemaining <= 1 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 text-sm font-medium">
            Running low on try-ons!
          </p>
          <p className="text-orange-700 text-xs mt-1">
            Upgrade to Standard for more try-ons or purchase Credits Pack
          </p>
        </div>
      )}

      {/* Upgrade Button */}
      <Link
        href="/pricing"
        onClick={() => {
          const quotaWarning = totalRemaining <= 1
          analytics.trackUpgradeClick('subscription_card', 'free', totalRemaining, quotaWarning)
        }}
        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
      >
        <Star className="w-5 h-5 mr-2" />
        Upgrade to Standard
        <ArrowUpRight className="w-4 h-4 ml-2" />
      </Link>

      {/* Premium Features Preview */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 mb-3">Standard benefits:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            30/month or 420/year
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Priority processing
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Standard frames
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Priority support
          </div>
        </div>
      </div>
    </div>
  )
}
