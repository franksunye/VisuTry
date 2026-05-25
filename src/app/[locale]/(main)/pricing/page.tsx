import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PricingSection } from "@/components/pricing/PricingSection"
import Link from "next/link"
import { Metadata } from 'next'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { PRODUCT_METADATA, QUOTA_CONFIG, formatPrice } from '@/config/pricing'
import { Locale } from '@/i18n'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Credits Pack Pricing for AI Glasses Try-On | VisuTry',
    description: 'Continue AI glasses try-on with 30 credits for USD 2.99. Upload your own glasses product images or screenshots, no subscription required.',
    pathname: '/pricing',
  })
}

// 🔥 优化：不再使用缓存，直接使用 session 作为唯一数据源
export const revalidate = 60

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  // 🔥 优化：直接从 session 读取用户数据，不再查询数据库
  // session.user 已经包含了所有必要的用户信息（来自 JWT token）
  let isPremiumActive = false
  let remainingTrials = 1 // 默认免费试用次数

  if (session) {
    // 直接使用 session 中的数据
    isPremiumActive = session.user.isPremiumActive || false
    remainingTrials = session.user.remainingTrials || 1
  }

  // 🔥 优化：直接使用 session.user，不需要重新构建
  const userForDisplay = session ? {
    ...session.user,
    isPremiumActive: isPremiumActive,
    remainingTrials: remainingTrials,
  } : null

  // Generate structured data for pricing offers from Metadata directly
  // We only include standard plans in initial SEO schema
  const pricingPlans = [
    PRODUCT_METADATA.CREDITS_PACK,
    PRODUCT_METADATA.PREMIUM_MONTHLY,
    PRODUCT_METADATA.PREMIUM_YEARLY
  ]

  const offerSchemas = pricingPlans.map(plan =>
    generateStructuredData('offer', {
      name: plan.name,
      description: plan.description,
      price: formatPrice(plan.price).replace('$', ''),
      priceCurrency: 'USD',
      priceValidUntil: '2026-12-31',
      itemOffered: {
        '@type': 'Service',
        name: `${plan.name} - AI Virtual Glasses Try-On`,
        description: plan.features ? plan.features.join(', ') : plan.description,
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

      {/* Page Header */}
      <div className="mb-8 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Simple AI glasses try-on pricing
        </p>
        <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
          Continue with 30 AI try-ons for USD 2.99
        </h1>
        <p className="text-base leading-7 text-gray-600">
          The Credits Pack is the easiest way to keep comparing glasses from your own product photos or screenshots. It is a one-time purchase, not a subscription, and your credits do not expire.
        </p>
      </div>

      {/* Promo Input is now inside PricingSection */}

      {/* Pricing Section (Cards + Comparison + Promo Input) */}
      <PricingSection user={userForDisplay} />

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">Frequently Asked Questions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Is the Credits Pack a subscription?</h3>
            <p className="text-sm text-gray-600">
              No. The Credits Pack is a one-time USD 2.99 purchase for 30 AI try-ons. It is designed for occasional users who want to compare glasses without starting a monthly plan.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Can I use credits with my own glasses screenshots?</h3>
            <p className="text-sm text-gray-600">
              Yes. Credits work with the glasses try-on flow where you upload your face photo and a glasses product image, store image, or screenshot.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Do credits expire?</h3>
            <p className="text-sm text-gray-600">
              Credits never expire after purchase. You can use them anytime at your convenience.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">What&apos;s the difference between free and paid image quality?</h3>
            <p className="text-sm text-gray-600">
              Free users receive standard quality images (800×800 pixels) with a watermark. Credits Pack and Standard users get high-quality images (1200×1200 pixels) without watermarks.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">What payment methods are supported?</h3>
            <p className="text-sm text-gray-600">
              We support all major credit and debit cards, including Visa, Mastercard, American Express, and more.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">How do I contact support?</h3>
            <p className="text-sm text-gray-600">
              You can contact us via email at support@visutry.com. Premium members enjoy priority support.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="p-4 mt-8 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-center text-gray-700">
          By subscribing, you agree to our{' '}
          <Link href="/terms" className="font-medium text-blue-600 hover:underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="font-medium text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          . View our{' '}
          <Link href="/refund" className="font-medium text-blue-600 hover:underline">
            Refund Policy
          </Link>
          {' '}for cancellation terms.
        </p>
      </div>
    </div>
  )
}
