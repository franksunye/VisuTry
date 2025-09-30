import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { RecentTryOns } from "@/components/dashboard/RecentTryOns"
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard"
import { Glasses, Plus } from "lucide-react"
import Link from "next/link"

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

  let tryOnStats, recentTryOns, completedTryOns

  try {
    // 首先确保用户存在于数据库中
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    // 如果用户不存在，创建用户记录（防御性编程）
    if (!user) {
      console.log('User not found in database, creating user:', session.user.id)
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          username: session.user.username,
          freeTrialsUsed: 0,
          isPremium: false,
        },
        select: { id: true }
      })
    }

    // 获取用户统计数据
    [tryOnStats, recentTryOns] = await Promise.all([
      prisma.tryOnTask.aggregate({
        where: { userId: session.user.id },
        _count: {
          id: true,
        },
      }),
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

    completedTryOns = await prisma.tryOnTask.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)

    // 如果是数据库连接错误，显示友好的错误信息
    if (error instanceof Error && error.message.includes('connect')) {
      throw new Error('Unable to connect to database. Please try again later.')
    }

    // 其他错误，使用默认值
    tryOnStats = { _count: { id: 0 } }
    recentTryOns = []
    completedTryOns = 0
  }

  const stats = {
    totalTryOns: tryOnStats?._count?.id || 0,
    completedTryOns: completedTryOns || 0,
    remainingTrials: session.user.remainingTrials || 0,
    isPremium: session.user.isPremiumActive || false,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">个人中心</h1>
          <p className="text-gray-600 mt-1">
            欢迎回来，{session.user.name || "用户"}！
          </p>
        </div>
        <Link
          href="/try-on"
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          开始试戴
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧主要内容 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 统计卡片 */}
          <DashboardStats stats={stats} />

          {/* 最近的试戴记录 */}
          <RecentTryOns tryOns={recentTryOns} />
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6">
          {/* 订阅状态卡片 */}
          <SubscriptionCard user={session.user} />

          {/* 快速操作 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
            <div className="space-y-3">
              <Link
                href="/try-on"
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Glasses className="w-5 h-5 mr-2" />
                开始AI试戴
              </Link>

              <Link
                href="/pricing"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                升级到高级会员
              </Link>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">使用提示</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• 上传清晰的正面照片效果最佳</li>
              <li>• 确保面部光线充足且无遮挡</li>
              <li>• 可以尝试不同款式的眼镜</li>
              <li>• 高级会员享有优先处理</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
