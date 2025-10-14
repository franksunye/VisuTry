import { prisma } from "@/lib/prisma"
import { DashboardStats } from "./DashboardStats"
import { perfLogger } from "@/lib/performance-logger"

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
    // 🔥 优化：并行查询所有数据，减少数据库往返次数
    const [user, totalTryOns, completedTryOns, latestPayment] = await Promise.all([
      perfLogger.measure(
        'dashboard-async:getUserBasicData',
        () => prisma.user.findUnique({
          where: { id: userId },
          select: {
            isPremium: true,
            premiumExpiresAt: true,
            freeTrialsUsed: true,
          },
        }),
        { userId }
      ),
      perfLogger.measure(
        'dashboard-async:getTotalCount',
        () => prisma.tryOnTask.count({
          where: { userId },
        }),
        { userId }
      ),
      perfLogger.measure(
        'dashboard-async:getCompletedCount',
        () => prisma.tryOnTask.count({
          where: { userId, status: 'COMPLETED' },
        }),
        { userId }
      ),
      perfLogger.measure(
        'dashboard-async:getLatestPayment',
        () => prisma.payment.findFirst({
          where: {
            userId,
            status: 'COMPLETED',
            productType: { in: ['PREMIUM_MONTHLY', 'PREMIUM_YEARLY'] }
          },
          orderBy: { createdAt: 'desc' },
          select: {
            productType: true,
            createdAt: true,
          },
        }),
        { userId }
      ),
    ])

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

    // 计算配额显示
    let quotaDisplay: string | number
    if (isPremiumActive) {
      if (isYearlySubscription) {
        quotaDisplay = "420/year"
      } else if (isMonthlySubscription) {
        quotaDisplay = "30/month"
      } else {
        quotaDisplay = "Standard"
      }
    } else {
      const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
      const remainingTrials = Math.max(0, freeTrialLimit - (user?.freeTrialsUsed || 0))
      quotaDisplay = remainingTrials
    }

    const stats = {
      totalTryOns,
      completedTryOns,
      quotaDisplay,
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
      quotaDisplay: 3,
      isPremium: false,
      subscriptionType: null,
      isYearlySubscription: false,
    }} />
  }
}

