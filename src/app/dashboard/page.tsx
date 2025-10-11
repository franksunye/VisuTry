import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from 'next/cache'
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { RecentTryOns } from "@/components/dashboard/RecentTryOns"
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard"
import { Glasses, Plus } from "lucide-react"
import Link from "next/link"

// 性能优化：使用智能缓存策略
// 1. 使用 unstable_cache 缓存用户数据（带用户专属标签）
// 2. 当用户状态变更时，通过 revalidateTag 立即清除缓存
// 3. 既保证性能（< 1秒），又保证数据实时性（状态变更立即生效）
export const revalidate = 60 // 60秒后台重新验证

// 智能缓存函数：获取用户 Dashboard 数据
// 使用用户专属标签，支持按需清除缓存
function getUserDashboardData(userId: string) {
  return unstable_cache(
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
          premiumExpiresAt: true,
          freeTrialsUsed: true,
          tryOnTasks: {
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
              id: true,
              status: true,
              userImageUrl: true,
              resultImageUrl: true,
              createdAt: true,
            },
          },
        },
      })
    },
    [`dashboard-data-${userId}`], // 用户专属缓存键
    {
      revalidate: 60, // 60秒后重新验证
      tags: [`user-${userId}`, 'dashboard'], // 用户专属标签，支持按需清除
    }
  )()
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // 确保用户 ID 有效
  if (!session.user?.id || session.user.id === "unknown") {
    console.error('Invalid user ID in session:', session.user?.id)
    redirect("/auth/signin?error=InvalidSession")
  }

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
    // 性能优化：使用智能缓存获取用户数据
    // 1. 首次访问：查询数据库（可能较慢）
    // 2. 后续访问：从缓存读取（< 1秒）
    // 3. 状态变更：通过 revalidateTag 立即清除缓存，下次访问获取最新数据
    const userWithTasks = await getUserDashboardData(session.user.id)

    if (userWithTasks) {
      // 更新用户统计数据
      userStats = {
        isPremium: userWithTasks.isPremium,
        premiumExpiresAt: userWithTasks.premiumExpiresAt,
        freeTrialsUsed: userWithTasks.freeTrialsUsed,
      }

      // 在内存中计算统计数据（非常快，通常 < 1ms）
      const allTasks = userWithTasks.tryOnTasks
      totalTryOns = allTasks.length
      completedTryOns = allTasks.filter(task => task.status === 'COMPLETED').length

      // 只显示最近 6 条
      recentTryOns = allTasks.slice(0, 6)

      // 如果用户有超过 50 条记录，totalTryOns 可能不准确
      // 在这种情况下，我们可以添加一个 _count 查询
      // 但对于大多数用户来说，50 条已经足够
      if (allTasks.length === 50) {
        // 用户可能有更多记录，执行精确计数
        const exactCount = await prisma.tryOnTask.count({
          where: { userId: session.user.id },
        })
        totalTryOns = exactCount

        // 重新计算完成数（如果需要精确值）
        const exactCompletedCount = await prisma.tryOnTask.count({
          where: {
            userId: session.user.id,
            status: 'COMPLETED'
          },
        })
        completedTryOns = exactCompletedCount
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)

    // 如果是数据库连接错误，显示友好的错误信息
    if (error instanceof Error && error.message.includes('connect')) {
      throw new Error('Unable to connect to database. Please try again later.')
    }

    // 其他错误，使用默认值（已在声明时初始化）
  }

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

  return (
    <div className="container px-4 py-8 mx-auto">
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
