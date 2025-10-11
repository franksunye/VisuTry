import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from 'next/cache'
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { RecentTryOns } from "@/components/dashboard/RecentTryOns"
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard"
import { ClientPerformanceMonitor } from "@/components/performance/ClientPerformanceMonitor"
import { Glasses, Plus } from "lucide-react"
import Link from "next/link"
import { perfLogger, logPageLoad } from "@/lib/performance-logger"

// 性能优化：使用智能缓存策略
// 1. 使用 unstable_cache 缓存用户数据（带用户专属标签）
// 2. 当用户状态变更时，通过 revalidateTag 立即清除缓存
// 3. 既保证性能（< 1秒），又保证数据实时性（状态变更立即生效）
export const revalidate = 60 // 60秒后台重新验证

// 智能缓存函数：只缓存用户基本信息（轻量级数据）
// 任务数据不缓存，避免超过 2MB 限制
function getUserBasicData(userId: string) {
  return unstable_cache(
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
          premiumExpiresAt: true,
          freeTrialsUsed: true,
        },
      })
    },
    [`user-basic-${userId}`], // 用户专属缓存键
    {
      revalidate: 60, // 60秒后重新验证
      tags: [`user-${userId}`, 'dashboard'], // 用户专属标签，支持按需清除
    }
  )()
}

// 获取任务数据（不缓存，因为包含图片 URL，数据量大）
async function getUserTasks(userId: string) {
  return await prisma.tryOnTask.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      userImageUrl: true,
      resultImageUrl: true,
      createdAt: true,
    },
  })
}

export default async function DashboardPage() {
  // 🔍 开始性能监控
  const pageStartTime = Date.now()
  perfLogger.mark('dashboard:page-start')

  // 🔍 监控 Session 获取
  perfLogger.start('dashboard:getSession')
  const session = await getServerSession(authOptions)
  perfLogger.end('dashboard:getSession')

  if (!session) {
    redirect("/auth/signin")
  }

  // 确保用户 ID 有效
  if (!session.user?.id || session.user.id === "unknown") {
    console.error('Invalid user ID in session:', session.user?.id)
    redirect("/auth/signin?error=InvalidSession")
  }

  perfLogger.mark('dashboard:session-validated', { userId: session.user.id })

  // 定义类型
  let totalTryOns = 0
  let completedTryOns = 0
  let recentTryOns: Array<{
    id: string
    status: string
    userImageUrl: string
    resultImageUrl: string | null
    createdAt: Date
  }> = []
  let userStats = {
    isPremium: false,
    premiumExpiresAt: null as Date | null,
    freeTrialsUsed: 0,
  }

  try {
    // 性能优化：分离缓存策略
    // 1. 用户基本信息（轻量级）：使用缓存，< 1KB
    // 2. 任务数据（包含图片 URL）：不缓存，避免超过 2MB 限制

    // 🔍 监控数据库查询
    perfLogger.start('dashboard:db-queries')
    perfLogger.mark('dashboard:fetching-user-and-tasks')

    // 并行获取用户数据和任务数据
    const [currentUser, allTasks] = await Promise.all([
      perfLogger.measure(
        'dashboard:db:getUserBasicData',
        () => getUserBasicData(session.user.id),
        { userId: session.user.id, cached: true }
      ),
      perfLogger.measure(
        'dashboard:db:getUserTasks',
        () => getUserTasks(session.user.id),
        { userId: session.user.id, cached: false }
      ),
    ])

    perfLogger.end('dashboard:db-queries', {
      userFound: !!currentUser,
      tasksCount: allTasks.length
    })

    if (currentUser) {
      // 🔍 监控数据处理
      perfLogger.start('dashboard:data-processing')

      // 更新用户统计数据
      userStats = {
        isPremium: currentUser.isPremium,
        premiumExpiresAt: currentUser.premiumExpiresAt,
        freeTrialsUsed: currentUser.freeTrialsUsed,
      }

      // 在内存中计算统计数据（非常快，通常 < 1ms）
      totalTryOns = allTasks.length
      completedTryOns = allTasks.filter(task => task.status === 'COMPLETED').length

      // 只显示最近 6 条
      recentTryOns = allTasks.slice(0, 6)

      perfLogger.end('dashboard:data-processing', {
        totalTryOns,
        completedTryOns,
        recentCount: recentTryOns.length
      })

      // 如果用户有超过 50 条记录，totalTryOns 可能不准确
      // 在这种情况下，我们可以添加一个 _count 查询
      // 但对于大多数用户来说，50 条已经足够
      if (allTasks.length === 50) {
        // 🔍 监控额外的计数查询
        perfLogger.mark('dashboard:need-exact-count')

        // 用户可能有更多记录，执行精确计数
        const exactCount = await perfLogger.measure(
          'dashboard:db:exactTaskCount',
          () => prisma.tryOnTask.count({
            where: { userId: session.user.id },
          }),
          { userId: session.user.id }
        )
        totalTryOns = exactCount

        // 重新计算完成数（如果需要精确值）
        const exactCompletedCount = await perfLogger.measure(
          'dashboard:db:exactCompletedCount',
          () => prisma.tryOnTask.count({
            where: {
              userId: session.user.id,
              status: 'COMPLETED'
            },
          }),
          { userId: session.user.id }
        )
        completedTryOns = exactCompletedCount
      }
    }
  } catch (error) {
    perfLogger.end('dashboard:db-queries', { success: false, error: true })
    console.error('Error fetching dashboard data:', error)

    // 如果是数据库连接错误，显示友好的错误信息
    if (error instanceof Error && error.message.includes('connect')) {
      throw new Error('Unable to connect to database. Please try again later.')
    }

    // 其他错误，使用默认值（已在声明时初始化）
  }

  // 🔍 监控数据计算
  perfLogger.start('dashboard:compute-stats')

  // 计算会员状态和剩余次数
  const isPremiumActive = userStats.isPremium &&
    (!userStats.premiumExpiresAt || userStats.premiumExpiresAt > new Date())
  const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
  const remainingTrials = Math.max(0, freeTrialLimit - userStats.freeTrialsUsed)

  const stats = {
    totalTryOns,
    completedTryOns,
    remainingTrials,
    isPremium: isPremiumActive,
  }

  // 更新 session.user 以便传递给 SubscriptionCard
  const userForCard = {
    ...session.user,
    isPremium: userStats.isPremium,
    premiumExpiresAt: userStats.premiumExpiresAt,
    freeTrialsUsed: userStats.freeTrialsUsed,
    isPremiumActive,
    remainingTrials,
  }

  perfLogger.end('dashboard:compute-stats')

  // 🔍 计算总耗时并输出摘要
  const totalDuration = Date.now() - pageStartTime
  logPageLoad('Dashboard', totalDuration, {
    'Session获取': perfLogger.getDuration('dashboard:getSession'),
    '数据库查询': perfLogger.getDuration('dashboard:db-queries'),
    '数据处理': perfLogger.getDuration('dashboard:data-processing'),
    '统计计算': perfLogger.getDuration('dashboard:compute-stats'),
  })

  perfLogger.mark('dashboard:rendering-start')

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* 客户端性能监控 */}
      <ClientPerformanceMonitor pageName="Dashboard" />

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back, {session.user.name || "User"}!
          </p>
        </div>
        <Link
          href="/try-on"
          className="flex items-center px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start Try-On
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Stats Cards */}
          <DashboardStats stats={stats} />

          {/* Recent Try-Ons */}
          <RecentTryOns tryOns={recentTryOns} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <SubscriptionCard user={userForCard} />

          {/* Quick Actions */}
          <div className="p-6 bg-white border shadow-sm rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/try-on"
                className="flex items-center justify-center w-full px-4 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Glasses className="w-5 h-5 mr-2" />
                Start AI Try-On
              </Link>

              <Link
                href="/pricing"
                className="flex items-center justify-center w-full px-4 py-3 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="p-6 border border-blue-200 bg-blue-50 rounded-xl">
            <h3 className="mb-3 text-lg font-semibold text-blue-900">Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Upload clear front-facing photos for best results</li>
              <li>• Ensure good lighting and no face obstructions</li>
              <li>• Try different styles of glasses</li>
              <li>• Premium members get priority processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
