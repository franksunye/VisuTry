"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Zap } from "lucide-react"

export function UserStatusBanner() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const user = session.user
  const isPremiumActive = user.isPremiumActive
  const remainingTrials = user.remainingTrials || 0

  // Premium user - simple badge
  if (isPremiumActive) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-md font-medium">
          <Zap className="w-3.5 h-3.5" />
          Standard
        </span>
        <Link
          href="/dashboard"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          View Dashboard →
        </Link>
      </div>
    )
  }

  // Free user - simple badge with remaining count
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
        Free User
      </span>
      <Link
        href="/dashboard"
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        Remaining: <span className="font-semibold text-gray-900">{remainingTrials}</span>
      </Link>
    </div>
  )
}

