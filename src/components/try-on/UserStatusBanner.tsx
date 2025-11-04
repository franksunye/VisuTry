"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { AlertCircle, Zap } from "lucide-react"

export function UserStatusBanner() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const user = session.user
  const isPremiumActive = user.isPremiumActive
  const remainingTrials = user.remainingTrials || 0
  const freeTrialsUsed = user.freeTrialsUsed || 0
  const creditsBalance = (user as any).creditsBalance || 0

  // Premium user banner
  if (isPremiumActive) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <div className="text-yellow-800 text-sm">
              <strong>Standard Member</strong> - Enhanced AI try-ons available
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Free user with no quota - RED WARNING
  if (remainingTrials === 0) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-red-800 text-sm">
              <strong>No remaining try-ons</strong>
              <p className="text-red-700 mt-0.5">
                You've used all your free try-ons. Upgrade to continue.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="ml-4 bg-red-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-700 transition-colors font-medium flex-shrink-0"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    )
  }

  // Free user with quota - BLUE INFO
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="text-blue-800 text-sm">
          <strong>Free User</strong>
          <div className="mt-1 text-blue-700 text-xs">
            <div>Free try-ons: <span className="font-semibold">{Math.max(0, 3 - freeTrialsUsed)}/3</span></div>
            {creditsBalance > 0 && (
              <div>Credits available: <span className="font-semibold">{creditsBalance}</span></div>
            )}
            <div className="mt-1">Total remaining: <span className="font-semibold">{remainingTrials}</span></div>
          </div>
        </div>
        <Link
          href="/pricing"
          className="ml-4 bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium flex-shrink-0"
        >
          Buy Credits
        </Link>
      </div>
    </div>
  )
}

