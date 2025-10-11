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
    const [user, totalTryOns, completedTryOns] = await Promise.all([
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
    ])

    perfLogger.end('dashboard-async:stats', {
      totalTryOns,
      completedTryOns,
    })

    // 计算会员状态和剩余次数
    const isPremiumActive = !!(user?.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date()))
    const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
    const remainingTrials = Math.max(0, freeTrialLimit - (user?.freeTrialsUsed || 0))

    const stats = {
      totalTryOns,
      completedTryOns,
      remainingTrials,
      isPremium: isPremiumActive,
    }

    return <DashboardStats stats={stats} />
  } catch (error) {
    perfLogger.end('dashboard-async:stats', { error: true })
    console.error('Error loading dashboard stats:', error)
    
    // 返回默认值
    return <DashboardStats stats={{
      totalTryOns: 0,
      completedTryOns: 0,
      remainingTrials: 3,
      isPremium: false,
    }} />
  }
}

