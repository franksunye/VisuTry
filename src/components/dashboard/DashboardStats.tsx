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
      title: "总试戴次数",
      value: stats.totalTryOns,
      icon: <Glasses className="w-6 h-6 text-blue-600" />,
      bgColor: "bg-blue-100",
      description: "累计使用次数"
    },
    {
      title: "成功试戴",
      value: stats.completedTryOns,
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      bgColor: "bg-green-100",
      description: "完成的试戴"
    },
    {
      title: "剩余次数",
      value: stats.isPremium ? "无限" : stats.remainingTrials,
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      bgColor: "bg-orange-100",
      description: stats.isPremium ? "高级会员" : "免费额度"
    },
    {
      title: "会员状态",
      value: stats.isPremium ? "高级" : "免费",
      icon: <Star className="w-6 h-6 text-purple-600" />,
      bgColor: "bg-purple-100",
      description: stats.isPremium ? "享受无限试戴" : "升级解锁更多"
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
