import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { TryOnInterface } from "@/components/try-on/TryOnInterface"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TryOnPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI眼镜试戴</h1>
          <p className="text-gray-600 mt-1">上传您的照片，选择眼镜款式，体验AI试戴效果</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回个人中心
        </Link>
      </div>

      {/* 用户状态提醒 */}
      <div className="mb-8">
        {session.user.isPremiumActive ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-yellow-800">
                <strong>高级会员</strong> - 您可以无限次使用AI试戴功能
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-blue-800">
                <strong>免费用户</strong> - 剩余试戴次数: {session.user.remainingTrials}
              </div>
              {session.user.remainingTrials === 0 && (
                <Link
                  href="/pricing"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  升级会员
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 试戴界面 */}
      <TryOnInterface />
    </div>
  )
}
