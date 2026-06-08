import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Suspense } from "react"
import { DashboardStatsAsync } from "@/components/dashboard/DashboardStatsAsync"
import { RecentTryOnsAsync } from "@/components/dashboard/RecentTryOnsAsync"
import { RecentFaceAnalysesAsync } from "@/components/dashboard/RecentFaceAnalysesAsync"
import { DashboardStatsSkeleton } from "@/components/dashboard/DashboardStatsSkeleton"
import { RecentTryOnsSkeleton } from "@/components/dashboard/RecentTryOnsSkeleton"
import { RecentFaceAnalysesSkeleton } from "@/components/dashboard/RecentFaceAnalysesSkeleton"
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard"
import { PaymentSuccessHandler } from "@/components/dashboard/PaymentSuccessHandler"
import { ClientPerformanceMonitor } from "@/components/performance/ClientPerformanceMonitor"
import { Glasses, Plus, Receipt } from "lucide-react"
import Link from "next/link"
import { perfLogger, logPageLoad } from "@/lib/performance-logger"
import { getCachedUserPayment } from "@/lib/cache"
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions"

// 性能优化：使用 Suspense 流式渲染
// 1. 立即返回页面框架（< 100ms）
// 2. 数据异步加载，不阻塞渲染
// 3. 用户立即看到页面，而不是白屏等待
export const revalidate = 60 // 60秒后台重新验证

type DashboardPageProps = {
  params: { locale: string }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
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

  // 🔥 修复：直接使用 session.user 作为唯一数据源，避免缓存不一致
  // session.user 已经包含了所有必要的用户信息（来自 JWT token）
  // 只需要获取最新支付记录来确定订阅类型
  const latestPayment = await getCachedUserPayment(session.user.id)

  // 确定订阅类型（这是 session 中没有的额外信息）
  const subscriptionType = latestPayment?.productType || null
  const isYearlySubscription = subscriptionType === 'PREMIUM_YEARLY'

  // 直接使用 session.user 的数据，不从数据库覆盖
  const userForCard = {
    ...session.user,
    subscriptionType,
    isYearlySubscription,
  }

  // 🔍 计算总耗时并输出摘要
  const totalDuration = Date.now() - pageStartTime
  logPageLoad('Dashboard (Initial Render)', totalDuration, {
    'Session获取': perfLogger.getDuration('dashboard:getSession'),
  })

  perfLogger.mark('dashboard:rendering-start')

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Client-side performance monitoring */}
      <ClientPerformanceMonitor pageName="Dashboard" />

      {/* Payment success handler - auto-refresh session */}
      <Suspense fallback={null}>
        <PaymentSuccessHandler />
      </Suspense>

      {/* Page Header - 立即渲染 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/try-on"
          className="flex items-center px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start Try-On
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - 使用 Suspense 异步加载 */}
        <div className="space-y-8 lg:col-span-2">
          {/* Stats Cards - 异步加载 */}
          <Suspense fallback={<DashboardStatsSkeleton />}>
            <DashboardStatsAsync
              userId={session.user.id}
              isPremiumActive={session.user.isPremiumActive}
              subscriptionType={subscriptionType}
              isYearlySubscription={isYearlySubscription}
              remainingTrials={session.user.remainingTrials}
              creditsPurchased={(session.user as any).creditsPurchased || 0}
              creditsUsed={(session.user as any).creditsUsed || 0}
              freeTrialsUsed={session.user.freeTrialsUsed}
              premiumUsageCount={(session.user as any).premiumUsageCount || 0}
            />
          </Suspense>

          {/* Recent Try-Ons - 异步加载 */}
          <Suspense fallback={<RecentTryOnsSkeleton />}>
            <RecentTryOnsAsync userId={session.user.id} />
          </Suspense>

          <Suspense fallback={<RecentFaceAnalysesSkeleton />}>
            <RecentFaceAnalysesAsync userId={session.user.id} locale={params.locale} />
          </Suspense>
        </div>

        {/* Sidebar - 立即渲染 */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <SubscriptionCard user={userForCard} />

          {/* Quick Actions */}
          <DashboardQuickActions
            userType={session.user.isPremiumActive ? 'premium' : ((session.user as any).creditsPurchased - (session.user as any).creditsUsed) > 0 ? 'credits' : 'free'}
            remainingTrials={session.user.remainingTrials}
          />

          {/* Tips Card */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <h3 className="mb-3 text-lg font-semibold text-blue-900">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use clear, front-facing photos for best results</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Good lighting improves AI accuracy</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Try different frame styles to find your perfect match</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

