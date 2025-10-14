import { Glasses, CheckCircle, Clock, Star } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    totalTryOns: number
    completedTryOns: number
    remainingTrials: number
    isPremium: boolean
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Try-Ons",
      value: stats.totalTryOns,
      icon: <Glasses className="w-6 h-6 text-blue-600" />,
      bgColor: "bg-blue-100",
      description: "Cumulative usage count"
    },
    {
      title: "Successful Try-Ons",
      value: stats.completedTryOns,
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      bgColor: "bg-green-100",
      description: "Completed try-ons"
    },
    {
      title: "Remaining Uses",
      value: stats.isPremium ? "30+/month" : stats.remainingTrials,
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      bgColor: "bg-orange-100",
      description: stats.isPremium ? "Standard Member" : "Free Quota"
    },
    {
      title: "Membership",
      value: stats.isPremium ? "Standard" : "Free",
      icon: <Star className="w-6 h-6 text-purple-600" />,
      bgColor: "bg-purple-100",
      description: stats.isPremium ? "Enhanced try-on experience" : "Upgrade for more"
    }
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
