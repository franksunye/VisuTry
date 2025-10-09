import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { RecentTryOns } from "@/components/dashboard/RecentTryOns"
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard"
import { Glasses, Plus } from "lucide-react"
import Link from "next/link"

// 启用部分预渲染和缓存优化
export const dynamic = 'force-dynamic' // 因为需要用户session数据
export const revalidate = 60 // 60秒后重新验证缓存

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

  try {
    // 优化：使用单个并行查询获取所有数据，减少数据库往返
    const [statusGroups, tasks] = await Promise.all([
      // 使用 groupBy 一次性获取总数和完成数
      prisma.tryOnTask.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: {
          id: true,
        },
      }),
      // 获取最近的试戴记录
      prisma.tryOnTask.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          status: true,
          userImageUrl: true,
          resultImageUrl: true,
          createdAt: true,
        },
      }),
    ])

    // 从 groupBy 结果中计算统计数据
    totalTryOns = statusGroups.reduce((sum, group) => sum + group._count.id, 0)
    completedTryOns = statusGroups.find(g => g.status === 'COMPLETED')?._count.id || 0
    recentTryOns = tasks
  } catch (error) {
    console.error('Error fetching dashboard data:', error)

    // 如果是数据库连接错误，显示友好的错误信息
    if (error instanceof Error && error.message.includes('connect')) {
      throw new Error('Unable to connect to database. Please try again later.')
    }

    // 其他错误，使用默认值（已在声明时初始化）
  }

  const stats = {
    totalTryOns,
    completedTryOns,
    remainingTrials: session.user.remainingTrials || 0,
    isPremium: session.user.isPremiumActive || false,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {session.user.name || "User"}!
          </p>
        </div>
        <Link
          href="/try-on"
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start Try-On
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Cards */}
          <DashboardStats stats={stats} />

          {/* Recent Try-Ons */}
          <RecentTryOns tryOns={recentTryOns} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <SubscriptionCard user={session.user} />

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/try-on"
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Glasses className="w-5 h-5 mr-2" />
                Start AI Try-On
              </Link>

              <Link
                href="/pricing"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips</h3>
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
