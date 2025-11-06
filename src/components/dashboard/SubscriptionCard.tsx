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
}

interface SubscriptionCardProps {
  user: User
}

export function SubscriptionCard({ user }: SubscriptionCardProps) {
  const freeTrialLimit = 3 // Get from environment variable or use default

  if (user.isPremiumActive) {
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 text-sm">Try-ons</span>
            <span className="text-yellow-900 font-medium">
              {user.isYearlySubscription ? "420/year" : "30/month"}
            </span>
          </div>

          {user.premiumExpiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-yellow-800 text-sm">Expires</span>
              <span className="text-yellow-900 font-medium text-sm">
                {formatDistanceToNow(new Date(user.premiumExpiresAt), {
                  addSuffix: true
                })}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-yellow-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-900">
                {user.isYearlySubscription ? "420" : "30+"}
              </div>
              <div className="text-xs text-yellow-700">
                {user.isYearlySubscription ? "Per Year" : "Per Month"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-900">
                <Star className="w-6 h-6 mx-auto" />
              </div>
              <div className="text-xs text-yellow-700">Standard Features</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Free user
  const usagePercentage = ((user.freeTrialsUsed || 0) / freeTrialLimit) * 100
  const remainingTrials = user.remainingTrials || 0

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
            {user.freeTrialsUsed || 0} / {freeTrialLimit}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {remainingTrials} free try-ons remaining
        </p>
      </div>

      {/* Upgrade Notice */}
      {remainingTrials <= 1 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 text-sm font-medium">
            Running low on try-ons!
          </p>
          <p className="text-orange-700 text-xs mt-1">
            Upgrade to Standard for enhanced try-ons
          </p>
        </div>
      )}

      {/* Upgrade Button */}
      <Link
        href="/pricing"
        onClick={() => {
          const remainingTrials = user.remainingTrials || 0
          const quotaWarning = remainingTrials <= 1
          analytics.trackUpgradeClick('subscription_card', 'free', remainingTrials, quotaWarning)
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
