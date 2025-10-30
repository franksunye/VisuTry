"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

export function UserStatusBanner() {
  const { data: session } = useSession()
  
  if (!session?.user) {
    return null
  }

  const user = session.user
  const isPremiumActive = user.isPremiumActive
  const remainingTrials = user.remainingTrials || 0

  if (isPremiumActive) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
        <div className="flex items-center">
          <div className="text-yellow-800 text-sm">
            <strong>Standard Member</strong> - Enhanced AI try-ons available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
      <div className="flex items-center justify-between">
        <div className="text-blue-800 text-sm">
          <strong>Free User</strong> - Remaining try-ons: {remainingTrials}
        </div>
        {remainingTrials === 0 && (
          <Link
            href="/pricing"
            className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </Link>
        )}
      </div>
    </div>
  )
}

