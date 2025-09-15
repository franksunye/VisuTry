import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { UserProfile } from "@/components/auth/UserProfile"
import { Glasses, Plus, History, Settings } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">个人中心</h1>
          <p className="text-gray-600 mt-1">管理您的试戴记录和账户设置</p>
        </div>
        <Link
          href="/"
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <Glasses className="w-5 h-5 mr-2" />
          返回首页
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧：用户信息 */}
        <div className="lg:col-span-1">
          <UserProfile />
          
          {/* 快速操作 */}
          <div className="mt-6 space-y-3">
            <Link
              href="/try-on"
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              开始新的试戴
            </Link>
            
            {!session.user.isPremiumActive && (
              <Link
                href="/pricing"
                className="w-full flex items-center justify-center px-4 py-3 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
              >
                升级到高级会员
              </Link>
            )}
          </div>
        </div>

        {/* 右侧：内容区域 */}
        <div className="lg:col-span-2">
          {/* 统计卡片 */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Glasses className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">总试戴次数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {session.user.freeTrialsUsed}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">剩余次数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {session.user.isPremiumActive ? "无限" : session.user.remainingTrials}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">会员状态</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {session.user.isPremiumActive ? "高级" : "免费"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 最近的试戴记录 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">最近的试戴记录</h2>
                <Link
                  href="/dashboard/history"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  查看全部
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {/* 这里将显示试戴历史记录 */}
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">还没有试戴记录</p>
                <Link
                  href="/try-on"
                  className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700"
                >
                  开始第一次试戴 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
