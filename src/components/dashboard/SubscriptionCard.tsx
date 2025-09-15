import { Star, Crown, Clock, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface User {
  id: string
  name?: string | null
  isPremium?: boolean
  premiumExpiresAt?: Date | null
  freeTrialsUsed?: number
  isPremiumActive?: boolean
  remainingTrials?: number
}

interface SubscriptionCardProps {
  user: User
}

export function SubscriptionCard({ user }: SubscriptionCardProps) {
  const freeTrialLimit = 3 // 从环境变量获取或使用默认值

  if (user.isPremiumActive) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-yellow-900">高级会员</h3>
            <p className="text-yellow-700 text-sm">享受无限AI试戴</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 text-sm">试戴次数</span>
            <span className="text-yellow-900 font-medium">无限</span>
          </div>
          
          {user.premiumExpiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-yellow-800 text-sm">到期时间</span>
              <span className="text-yellow-900 font-medium text-sm">
                {formatDistanceToNow(new Date(user.premiumExpiresAt), {
                  addSuffix: true,
                  locale: zhCN
                })}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-yellow-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-900">∞</div>
              <div className="text-xs text-yellow-700">试戴次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-900">
                <Star className="w-6 h-6 mx-auto" />
              </div>
              <div className="text-xs text-yellow-700">高级功能</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 免费用户
  const usagePercentage = ((user.freeTrialsUsed || 0) / freeTrialLimit) * 100
  const remainingTrials = user.remainingTrials || 0

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">免费用户</h3>
          <p className="text-gray-600 text-sm">体验AI试戴功能</p>
        </div>
      </div>

      {/* 使用进度 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-sm">试戴次数</span>
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
          剩余 {remainingTrials} 次免费试戴
        </p>
      </div>

      {/* 升级提示 */}
      {remainingTrials <= 1 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 text-sm font-medium">
            试戴次数即将用完！
          </p>
          <p className="text-orange-700 text-xs mt-1">
            升级到高级会员享受无限试戴
          </p>
        </div>
      )}

      {/* 升级按钮 */}
      <Link
        href="/pricing"
        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
      >
        <Star className="w-5 h-5 mr-2" />
        升级到高级会员
        <ArrowUpRight className="w-4 h-4 ml-2" />
      </Link>

      {/* 高级功能预览 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 mb-3">高级会员专享：</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            无限试戴
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            优先处理
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            高级框架
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            优先支持
          </div>
        </div>
      </div>
    </div>
  )
}
