import { DashboardStats } from "./DashboardStats"
import { perfLogger } from "@/lib/performance-logger"
import { getCachedUserData, getCachedUserPayment, getCachedUserStats } from "@/lib/cache"

interface DashboardStatsAsyncProps {
  userId: string
}

/**
 * 异步加载统计数据组件
 * 用于 Suspense 流式渲染
 */
export async function DashboardStatsAsync({ userId }: DashboardStatsAsyncProps) {
  perfLogger.start('dashboard-async:stats')

  try {
    // 🔥 优化：使用统一的缓存管理工具，减少数据库往返次数
    const [user, userStats, latestPayment] = await Promise.all([
      perfLogger.measure(
        'dashboard-async:getUserBasicData',
        () => getCachedUserData(userId),
        { userId }
      ),
      perfLogger.measure(
        'dashboard-async:getUserStats',
        () => getCachedUserStats(userId),
        { userId }
      ),
      perfLogger.measure(
        'dashboard-async:getLatestPayment',
        () => getCachedUserPayment(userId),
        { userId }
      ),
    ])

    const { totalTryOns, completedTryOns } = userStats || { totalTryOns: 0, completedTryOns: 0 }

    perfLogger.end('dashboard-async:stats', {
      totalTryOns,
      completedTryOns,
    })

    // 计算会员状态和配额信息
    const isPremiumActive = !!(user?.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date()))

    // 确定订阅类型
    const subscriptionType = latestPayment?.productType || null
    const isYearlySubscription = subscriptionType === 'PREMIUM_YEARLY'
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
      const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
      const remainingTrials = Math.max(0, freeTrialLimit - (user?.freeTrialsUsed || 0))
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

