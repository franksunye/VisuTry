"use client"

import { useSession } from "next-auth/react"
import { Crown, Zap, Calendar } from "lucide-react"
import { cn } from "@/utils/cn"

interface UserProfileProps {
  className?: string
  showDetails?: boolean
  variant?: "light" | "dark"
}

export function UserProfile({ className, showDetails = true, variant = "light" }: UserProfileProps) {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const { user } = session
  const isPremiumActive = user.isPremiumActive
  const remainingTrials = user.remainingTrials

  // 根据 variant 定义样式
  const containerStyles = variant === "dark"
    ? "bg-gray-800 border-gray-700"
    : "bg-white border"

  const textPrimaryStyles = variant === "dark"
    ? "text-white"
    : "text-gray-900"

  const textSecondaryStyles = variant === "dark"
    ? "text-gray-300"
    : "text-gray-500"

  const textTertiaryStyles = variant === "dark"
    ? "text-gray-400"
    : "text-gray-600"

  const avatarBgStyles = variant === "dark"
    ? "bg-gray-700"
    : "bg-gray-200"

  return (
    <div className={cn("rounded-lg shadow-sm p-4", containerStyles, className)}>
      {/* User Basic Info */}
      <div className="flex items-center space-x-3 mb-4">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User avatar"}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", avatarBgStyles)}>
            <span className={cn("text-lg font-semibold", textTertiaryStyles)}>
              {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold truncate", textPrimaryStyles)}>
            {user.name || user.username || "User"}
          </h3>
          {user.email && (
            <p className={cn("text-sm truncate", textSecondaryStyles)}>{user.email}</p>
          )}
        </div>
      </div>

      {showDetails && (
        <>
          {/* 会员状态 */}
          <div className="mb-4">
            {isPremiumActive ? (
              <div className="flex items-center space-x-2 text-yellow-500">
                <Crown className="w-5 h-5" />
                <span className="font-medium">高级会员</span>
                {user.premiumExpiresAt && (
                  <span className={cn("text-sm", textSecondaryStyles)}>
                    到期: {new Date(user.premiumExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <div className={cn("flex items-center space-x-2", textTertiaryStyles)}>
                <Zap className="w-5 h-5" />
                <span className="font-medium">免费用户</span>
              </div>
            )}
          </div>

          {/* 使用统计 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn("text-sm", textTertiaryStyles)}>剩余免费次数</span>
              <span className={cn(
                "font-semibold",
                remainingTrials > 0 ? "text-green-500" : "text-red-500"
              )}>
                {remainingTrials}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={cn("text-sm", textTertiaryStyles)}>已使用次数</span>
              <span className={cn("font-semibold", textPrimaryStyles)}>
                {user.freeTrialsUsed}
              </span>
            </div>

            {/* 进度条 */}
            <div className={cn(
              "w-full rounded-full h-2",
              variant === "dark" ? "bg-gray-700" : "bg-gray-200"
            )}>
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
            <div className={cn(
              "mt-4 p-3 rounded-lg",
              variant === "dark"
                ? "bg-blue-900/30 border border-blue-700"
                : "bg-blue-50 border border-blue-200"
            )}>
              <p className={cn(
                "text-sm",
                variant === "dark" ? "text-blue-300" : "text-blue-800"
              )}>
                免费次数已用完，升级到高级会员享受无限试戴！
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
