import { DashboardStats } from "./DashboardStats"
import { perfLogger } from "@/lib/performance-logger"
import { getCachedUserStats } from "@/lib/cache"

interface DashboardStatsAsyncProps {
  userId: string
  // 🔥 修复：从 session 传入用户状态，避免缓存不一致
  isPremiumActive: boolean
  subscriptionType: string | null
  isYearlySubscription: boolean
  remainingTrials: number
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
  remainingTrials
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
    let remainingDisplay: string | number
    if (isPremiumActive) {
      if (isYearlySubscription) {
        // 年费用户：420 - 已使用 = 剩余
        const yearlyUsed = totalTryOns // 简化：使用总使用量
        const yearlyLimit = 420
        const remaining = Math.max(0, yearlyLimit - yearlyUsed)
        remainingDisplay = remaining.toString()
      } else if (isMonthlySubscription) {
        // 月费用户：30 - 本月已使用 = 剩余
        // 简化：显示30+表示充足
        remainingDisplay = "30+"
      } else {
        remainingDisplay = "Standard"
      }
    } else {
      // 免费用户：使用从 session 传入的剩余次数
      remainingDisplay = remainingTrials
    }

    const stats = {
      totalTryOns,
      completedTryOns,
      remainingDisplay,
      isPremium: isPremiumActive,
      subscriptionType,
      isYearlySubscription,
    }

    return <DashboardStats stats={stats} />
  } catch (error) {
    perfLogger.end('dashboard-async:stats', { error: true })
    console.error('Error loading dashboard stats:', error)
    
    // 返回默认值
    return <DashboardStats stats={{
      totalTryOns: 0,
      completedTryOns: 0,
      remainingDisplay: 3,
      isPremium: false,
      subscriptionType: null,
      isYearlySubscription: false,
    }} />
  }
}

