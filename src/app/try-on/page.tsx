import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { TryOnInterface } from "@/components/try-on/TryOnInterface"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getTestSessionFromRequest } from "@/lib/test-session"
import { headers } from "next/headers"

export default async function TryOnPage() {
  const session = await getServerSession(authOptions)

  // Check for test session if no NextAuth session
  let testSession = null
  if (!session) {
    const headersList = headers()
    const cookieHeader = headersList.get('cookie')
    if (cookieHeader) {
      const testSessionCookie = cookieHeader
        .split('; ')
        .find(row => row.startsWith('test-session='))

      if (testSessionCookie) {
        try {
          const sessionData = decodeURIComponent(testSessionCookie.split('=')[1])
          testSession = JSON.parse(sessionData)
        } catch (error) {
          console.error('Failed to parse test session:', error)
        }
      }
    }
  }

  if (!session && !testSession) {
    redirect("/auth/signin")
  }

  // Use session data from either NextAuth or test session
  const user = session?.user || testSession

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
        {testSession ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-green-800">
                <strong>测试模式</strong> - {testSession.isPremium ? '高级用户' : '免费用户'} ({testSession.name})
                {!testSession.isPremium && ` - 已使用 ${testSession.freeTrialsUsed}/3 次试戴`}
              </div>
            </div>
          </div>
        ) : user?.isPremiumActive ? (
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
                <strong>免费用户</strong> - 剩余试戴次数: {user?.remainingTrials || 0}
              </div>
              {(user?.remainingTrials === 0) && (
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
