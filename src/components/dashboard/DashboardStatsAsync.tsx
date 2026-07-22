import { DashboardStats } from "./DashboardStats"
import { perfLogger } from "@/lib/performance-logger"
import { getCachedUserStats } from "@/lib/cache"
import { calculateRemainingQuota, QUOTA_CONFIG } from "@/config/pricing"

interface DashboardStatsAsyncProps {
  userId: string
  // 🔥 修复：从 session 传入用户状态，避免缓存不一致
  isPremiumActive: boolean
  subscriptionType: string | null
  isYearlySubscription: boolean
  remainingTrials: number
  creditsPurchased: number
  creditsUsed: number
  freeTrialsUsed: number
  premiumUsageCount: number
}

/**
 * 异步加载统计数据组件
 * 用于 Suspense 流式渲染
 *
 * 🔥 重要：用户状态（isPremium等）从 session 传入，不从数据库读取
 * 这样可以避免缓存不一致导致的显示错误
 */
export async function DashboardStatsAsync({
  userId,
  isPremiumActive,
  subscriptionType,
  isYearlySubscription,
  remainingTrials,
  creditsPurchased,
  creditsUsed,
  freeTrialsUsed,
  premiumUsageCount
}: DashboardStatsAsyncProps) {
  perfLogger.start('dashboard-async:stats')

  try {
    // 🔥 只获取统计数据，不再获取用户基本信息（从 session 传入）
    const userStats = await perfLogger.measure(
      'dashboard-async:getUserStats',
      () => getCachedUserStats(userId),
      { userId }
    )

    const { totalTryOns, completedTryOns } = userStats || { totalTryOns: 0, completedTryOns: 0 }

    perfLogger.end('dashboard-async:stats', {
      totalTryOns,
      completedTryOns,
    })

    // 使用传入的订阅状态（来自 session）
    const isMonthlySubscription = subscriptionType === 'PREMIUM_MONTHLY'

    // 计算剩余量显示
    // 🔥 计数器模式：
    // - Premium 用户：使用 premiumUsageCount（从 session 传入，每次使用递增，续费时重置）
    // - 免费用户：使用 freeTrialsUsed（免费试用的使用次数）
    // 使用统一的 calculateRemainingQuota 计算剩余额度
    const { subscriptionRemaining, creditsRemaining, totalRemaining } = calculateRemainingQuota(
      isPremiumActive,
      subscriptionType,
      freeTrialsUsed,
      premiumUsageCount,
      creditsPurchased,
      creditsUsed,
    )

    let remainingDisplay: string | number
    let remainingDescription: string

    if (isPremiumActive) {
      if (isYearlySubscription) {
        // 年费用户：使用 premiumUsageCount 计数器
        remainingDisplay = totalRemaining
        remainingDescription = creditsRemaining > 0
          ? `Annual (${subscriptionRemaining}) + Credits (${creditsRemaining}/${creditsPurchased})`
          : "Annual Plan"
      } else if (isMonthlySubscription) {
        // 月费用户：使用 premiumUsageCount 计数器
        remainingDisplay = totalRemaining
        remainingDescription = creditsRemaining > 0
          ? `Monthly (${subscriptionRemaining}) + Credits (${creditsRemaining}/${creditsPurchased})`
          : "Monthly Plan"
      } else {
        // 其他订阅类型
        remainingDisplay = creditsRemaining > 0 ? creditsRemaining : "Standard"
        remainingDescription = "Subscription"
      }
    } else {
      // 免费用户：使用 freeTrialsUsed（只计算免费试用期的使用）
      remainingDisplay = totalRemaining
      remainingDescription = creditsRemaining > 0
        ? `Free (${subscriptionRemaining}) + Credits (${creditsRemaining}/${creditsPurchased})`
        : "Free Quota"
    }

    const stats = {
      totalTryOns,
      completedTryOns,
      remainingDisplay,
      remainingDescription,
      isPremium: isPremiumActive,
      subscriptionType,
      isYearlySubscription,
    }

    return <DashboardStats stats={stats} />
  } catch (error) {
    perfLogger.end('dashboard-async:stats', { error: true })
    console.error('Error loading dashboard stats:', error)
    
    // 返回默认值（使用配置的免费试用额度）
    return <DashboardStats stats={{
      totalTryOns: 0,
      completedTryOns: 0,
      remainingDisplay: QUOTA_CONFIG.FREE_TRIAL,
      remainingDescription: "Free Quota",
      isPremium: false,
      subscriptionType: null,
      isYearlySubscription: false,
    }} />
  }
}

