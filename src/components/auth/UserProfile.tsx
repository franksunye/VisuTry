"use client"

import { useSession } from "next-auth/react"
import { Crown, Zap, Calendar } from "lucide-react"
import { cn } from "@/utils/cn"

interface UserProfileProps {
  className?: string
  showDetails?: boolean
}

export function UserProfile({ className, showDetails = true }: UserProfileProps) {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const { user } = session
  const isPremiumActive = user.isPremiumActive
  const remainingTrials = user.remainingTrials

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border p-4", className)}>
      {/* User Basic Info */}
      <div className="flex items-center space-x-3 mb-4">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User avatar"}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600">
              {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
            </span>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-900">
            {user.name || user.username || "User"}
          </h3>
          {user.email && (
            <p className="text-sm text-gray-500">{user.email}</p>
          )}
        </div>
      </div>

      {showDetails && (
        <>
          {/* 会员状态 */}
          <div className="mb-4">
            {isPremiumActive ? (
              <div className="flex items-center space-x-2 text-yellow-600">
                <Crown className="w-5 h-5" />
                <span className="font-medium">高级会员</span>
                {user.premiumExpiresAt && (
                  <span className="text-sm text-gray-500">
                    到期: {new Date(user.premiumExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-600">
                <Zap className="w-5 h-5" />
                <span className="font-medium">免费用户</span>
              </div>
            )}
          </div>

          {/* 使用统计 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">剩余免费次数</span>
              <span className={cn(
                "font-semibold",
                remainingTrials > 0 ? "text-green-600" : "text-red-600"
              )}>
                {remainingTrials}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已使用次数</span>
              <span className="font-semibold text-gray-900">
                {user.freeTrialsUsed}
              </span>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  remainingTrials > 0 ? "bg-green-500" : "bg-red-500"
                )}
                style={{
                  width: `${Math.min(100, (user.freeTrialsUsed / (user.freeTrialsUsed + remainingTrials)) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* 升级提示 */}
          {!isPremiumActive && remainingTrials === 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                免费次数已用完，升级到高级会员享受无限试戴！
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
