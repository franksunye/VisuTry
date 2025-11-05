'use client'

import { Glasses, CheckCircle, Clock } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    totalTryOns: number
    completedTryOns: number
    remainingDisplay: string | number
    remainingDescription: string
    isPremium: boolean
    subscriptionType?: string | null
    isYearlySubscription?: boolean
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Try-Ons',
      value: stats.totalTryOns,
      icon: <Glasses className="w-6 h-6 text-blue-600" />,
      bgColor: "bg-blue-100",
      description: 'Cumulative usage count'
    },
    {
      title: 'Successful Try-Ons',
      value: stats.completedTryOns,
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      bgColor: "bg-green-100",
      description: 'Completed try-ons'
    },
    {
      title: 'Remaining Uses',
      value: stats.remainingDisplay,
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      bgColor: "bg-orange-100",
      description: stats.remainingDescription
    }
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              {card.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
