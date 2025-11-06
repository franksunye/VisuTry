'use client'

import Link from 'next/link'
import { Glasses, Receipt } from 'lucide-react'
import { analytics, type UserType } from '@/lib/analytics'

interface DashboardQuickActionsProps {
  userType: UserType
  remainingTrials: number
}

export function DashboardQuickActions({ userType, remainingTrials }: DashboardQuickActionsProps) {
  return (
    <div className="p-6 bg-white border shadow-sm rounded-xl">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
      <div className="space-y-3">
        <Link
          href="/try-on"
          className="flex items-center justify-center w-full px-4 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Glasses className="w-5 h-5 mr-2" />
          Start AI Try-On
        </Link>

        <Link
          href="/pricing"
          onClick={() => {
            analytics.trackUpgradeClick('quick_actions', userType, remainingTrials, false)
          }}
          className="flex items-center justify-center w-full px-4 py-3 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Upgrade to Standard
        </Link>

        <Link
          href="/payments"
          onClick={() => {
            analytics.trackViewPaymentHistory(userType, true)
          }}
          className="flex items-center justify-center w-full px-4 py-3 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Receipt className="w-5 h-5 mr-2" />
          Payment History
        </Link>
      </div>
    </div>
  )
}

