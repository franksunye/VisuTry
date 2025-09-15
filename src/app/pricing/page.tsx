import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PricingCard } from "@/components/pricing/PricingCard"
import { Glasses, ArrowLeft, Check, Star, Zap } from "lucide-react"
import Link from "next/link"

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const pricingPlans = [
    {
      id: "CREDITS_PACK",
      name: "试戴次数包",
      description: "适合偶尔使用的用户",
      price: "$2.99",
      period: "一次性",
      features: [
        "额外20次AI试戴",
        "高质量图像处理",
        "无限下载和分享",
        "优先客服支持"
      ],
      buttonText: "购买次数包",
      popular: false,
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: "PREMIUM_MONTHLY",
      name: "高级会员",
      description: "最受欢迎的选择",
      price: "$9.99",
      period: "每月",
      features: [
        "无限次AI试戴",
        "高质量图像处理",
        "优先处理队列",
        "无限下载和分享",
        "高级眼镜框架库",
        "优先客服支持",
        "无广告体验"
      ],
      buttonText: "开始月付订阅",
      popular: true,
      icon: <Star className="w-6 h-6" />
    },
    {
      id: "PREMIUM_YEARLY",
      name: "高级会员年付",
      description: "最优惠的选择",
      price: "$99.99",
      period: "每年",
      originalPrice: "$119.88",
      features: [
        "无限次AI试戴",
        "高质量图像处理",
        "优先处理队列",
        "无限下载和分享",
        "高级眼镜框架库",
        "优先客服支持",
        "无广告体验",
        "节省2个月费用"
      ],
      buttonText: "开始年付订阅",
      popular: false,
      icon: <Star className="w-6 h-6" />
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">选择您的套餐</h1>
          <p className="text-gray-600 mt-1">升级到高级会员，享受无限AI试戴体验</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回个人中心
        </Link>
      </div>

      {/* 当前状态 */}
      <div className="mb-8">
        {session.user.isPremiumActive ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <strong className="text-yellow-800">您已是高级会员</strong>
                {session.user.premiumExpiresAt && (
                  <span className="text-yellow-700 ml-2">
                    到期时间: {new Date(session.user.premiumExpiresAt).toLocaleDateString("zh-CN")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Glasses className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <strong className="text-blue-800">免费用户</strong>
                  <span className="text-blue-700 ml-2">
                    剩余试戴次数: {session.user.remainingTrials}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 定价卡片 */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentUser={session.user}
          />
        ))}
      </div>

      {/* 功能对比 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">功能对比</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">功能</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">免费用户</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">次数包</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">高级会员</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">AI试戴次数</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">3次</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">+20次</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">无限</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">图像质量</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">标准</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">高质量</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">高质量</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">处理优先级</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">普通</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">普通</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">优先</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">眼镜框架库</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">基础</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">基础</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">高级</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">客服支持</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">邮件</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">优先邮件</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">优先支持</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 常见问题 */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">常见问题</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">可以随时取消订阅吗？</h3>
            <p className="text-gray-600 text-sm">
              是的，您可以随时取消订阅。取消后，您仍可以使用高级功能直到当前计费周期结束。
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">支持哪些支付方式？</h3>
            <p className="text-gray-600 text-sm">
              我们支持所有主要的信用卡和借记卡，包括Visa、Mastercard、American Express等。
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">次数包会过期吗？</h3>
            <p className="text-gray-600 text-sm">
              次数包购买后永不过期，您可以随时使用这些试戴次数。
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">如何联系客服？</h3>
            <p className="text-gray-600 text-sm">
              您可以通过邮件联系我们：support@visutry.com，高级会员享有优先支持。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
