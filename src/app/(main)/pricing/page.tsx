import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PricingCard } from "@/components/pricing/PricingCard"
import { Glasses, Star, Zap } from "lucide-react"
import { Metadata } from 'next'
import { generateSEO, generateStructuredData } from '@/lib/seo'
import { PRODUCT_METADATA, QUOTA_CONFIG, formatPrice } from '@/config/pricing'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

export const metadata: Metadata = generateSEO({
  title: 'Pricing Plans - AI Glasses Try-On | VisuTry',
  description: 'Choose the perfect plan for AI glasses try-on. Free trials available, premium features for unlimited access. Find your ideal glasses with advanced AI technology.',
  url: '/pricing',
})

// 🔥 优化：不再使用缓存，直接使用 session 作为唯一数据源
export const revalidate = 60

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  // 🔥 优化：直接从 session 读取用户数据，不再查询数据库
  // session.user 已经包含了所有必要的用户信息（来自 JWT token）
  let isPremiumActive = false
  let remainingTrials = 3 // 默认免费试用次数

  if (session) {
    // 直接使用 session 中的数据
    isPremiumActive = session.user.isPremiumActive || false
    remainingTrials = session.user.remainingTrials || 3
  }

  // 🔥 优化：直接使用 session.user，不需要重新构建
  const userForDisplay = session ? {
    ...session.user,
    isPremiumActive: isPremiumActive,
    remainingTrials: remainingTrials,
  } : null

  // Use centralized pricing configuration
  const pricingPlans = [
    {
      id: "CREDITS_PACK",
      name: PRODUCT_METADATA.CREDITS_PACK.name,
      description: PRODUCT_METADATA.CREDITS_PACK.description,
      price: formatPrice(PRODUCT_METADATA.CREDITS_PACK.price),
      period: "One-time",
      features: [...PRODUCT_METADATA.CREDITS_PACK.features],
      buttonText: "Buy Credits Pack",
      popular: PRODUCT_METADATA.CREDITS_PACK.popular,
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: "PREMIUM_MONTHLY",
      name: PRODUCT_METADATA.PREMIUM_MONTHLY.shortName,
      description: PRODUCT_METADATA.PREMIUM_MONTHLY.description,
      price: formatPrice(PRODUCT_METADATA.PREMIUM_MONTHLY.price),
      period: "per month",
      features: [...PRODUCT_METADATA.PREMIUM_MONTHLY.features],
      buttonText: "Start Monthly Subscription",
      popular: PRODUCT_METADATA.PREMIUM_MONTHLY.popular,
      icon: <Star className="w-6 h-6" />
    },
    {
      id: "PREMIUM_YEARLY",
      name: PRODUCT_METADATA.PREMIUM_YEARLY.shortName,
      description: PRODUCT_METADATA.PREMIUM_YEARLY.description,
      price: formatPrice(PRODUCT_METADATA.PREMIUM_YEARLY.price),
      period: "per year",
      originalPrice: "$107.88", // 12 * $8.99
      features: [...PRODUCT_METADATA.PREMIUM_YEARLY.features],
      buttonText: "Start Annual Subscription",
      popular: PRODUCT_METADATA.PREMIUM_YEARLY.popular,
      icon: <Star className="w-6 h-6" />
    }
  ]

  // Generate structured data for pricing offers
  const offerSchemas = pricingPlans.map(plan =>
    generateStructuredData('offer', {
      name: plan.name,
      description: plan.description,
      price: plan.price.replace('$', ''),
      priceCurrency: 'USD',
      priceValidUntil: '2025-12-31',
      itemOffered: {
        '@type': 'Service',
        name: `${plan.name} - AI Virtual Glasses Try-On`,
        description: plan.features.join(', '),
      },
    })
  )

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Structured Data for Offers */}
      {offerSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { name: 'Pricing' },
          ]}
        />
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-1 text-gray-600">Upgrade to Standard for enhanced AI try-on experience</p>
      </div>

      {/* Current Status */}
      <div className="mb-8">
        {isPremiumActive ? (
          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-600" />
              <div>
                <strong className="text-yellow-800">You are a Standard Member</strong>
                {session?.user?.premiumExpiresAt && (
                  <span className="ml-2 text-yellow-700">
                    Expires: {new Date(session.user.premiumExpiresAt).toLocaleDateString("en-US")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Glasses className="w-5 h-5 mr-2 text-blue-600" />
                <div>
                  <strong className="text-blue-800">Free User</strong>
                  <span className="ml-2 text-blue-700">
                    Remaining try-ons: {remainingTrials}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 mb-12 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentUser={userForDisplay}
          />
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Feature Comparison</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-900">Feature</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Free</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Credits Pack</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">AI Try-ons</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">{QUOTA_CONFIG.FREE_TRIAL} times</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">+{QUOTA_CONFIG.CREDITS_PACK} times</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">{QUOTA_CONFIG.MONTHLY_SUBSCRIPTION}/month or {QUOTA_CONFIG.YEARLY_SUBSCRIPTION}/year</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Image Quality</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Standard</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">High Quality</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">High Quality</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Processing Priority</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Normal</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Normal</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">Priority</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Glasses Frame Library</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Basic</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Basic</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">Standard</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Customer Support</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Email</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Priority Email</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">Priority Support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">Frequently Asked Questions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Can I cancel my subscription anytime?</h3>
            <p className="text-sm text-gray-600">
              Yes, you can cancel your subscription at any time. After cancellation, you can still use premium features until the end of the current billing period.
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">What payment methods are supported?</h3>
            <p className="text-sm text-gray-600">
              We support all major credit and debit cards, including Visa, Mastercard, American Express, and more.
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Do credits expire?</h3>
            <p className="text-sm text-gray-600">
              Credits never expire after purchase. You can use them anytime at your convenience.
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">How do I contact support?</h3>
            <p className="text-sm text-gray-600">
              You can contact us via email at support@visutry.com. Premium members enjoy priority support.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700 text-center">
          By subscribing, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 hover:underline font-medium">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
            Privacy Policy
          </Link>
          . View our{' '}
          <Link href="/refund" className="text-blue-600 hover:underline font-medium">
            Refund Policy
          </Link>
          {' '}for cancellation terms.
        </p>
      </div>
    </div>
  )
}
