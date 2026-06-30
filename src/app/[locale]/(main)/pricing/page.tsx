import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PricingSection } from "@/components/pricing/PricingSection"
import Link from "next/link"
import { Metadata } from 'next'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { PRODUCT_METADATA, formatPrice, getPricingQuotas } from '@/config/pricing'
import { Locale } from '@/i18n'
import { CheckCircle2, Glasses, Grid2X2, ScanFace, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.pricing' })

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    pathname: '/pricing',
  })
}

// 🔥 优化：不再使用缓存，直接使用 session 作为唯一数据源
export const revalidate = 60

export default async function PricingPage({ params }: { params: { locale: string } }) {
  const quotas = getPricingQuotas()
  const session = await getServerSession(authOptions)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.pricing' })

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
          {t('eyebrow')}
        </p>
        <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
          {t('title', { count: quotas.creditsPack })}
        </h1>
        <p className="text-base leading-7 text-gray-600">
          {t('description')}
        </p>
      </div>

      <Link
        href={`/${params.locale}/face-shape-detector`}
        className="mb-8 flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-5 transition hover:border-green-300 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-green-700">
            <ScanFace className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-bold text-green-950">{t('freeDetector.title')}</span>
            <span className="mt-1 block text-sm leading-6 text-green-900">{t('freeDetector.description')}</span>
          </span>
        </span>
        <span className="font-semibold text-green-800">{t('freeDetector.cta')} →</span>
      </Link>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Sparkles,
            title: t('featureCards.faceTitle'),
            description: t('featureCards.faceDescription'),
          },
          {
            icon: Glasses,
            title: t('featureCards.glassesTitle'),
            description: t('featureCards.glassesDescription'),
          },
          {
            icon: Grid2X2,
            title: t('featureCards.compareTitle'),
            description: t('featureCards.compareDescription'),
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <Icon className="mb-4 h-5 w-5 text-blue-600" />
              <h2 className="mb-2 text-base font-bold text-gray-950">{item.title}</h2>
              <p className="text-sm leading-6 text-gray-600">{item.description}</p>
            </div>
          )
        })}
      </div>

      {/* Promo Input is now inside PricingSection */}

      {/* Pricing Section (Cards + Comparison + Promo Input) */}
      <PricingSection user={userForDisplay} quotas={quotas} />

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">{t('faqTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q1Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q1Answer', { count: quotas.creditsPack })}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q2Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q2Answer')}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q3Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q3Answer')}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q4Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q4Answer')}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q5Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q5Answer')}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q6Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q6Answer')}
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q7Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q7Answer')}
            </p>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="p-4 mt-8 bg-blue-50 rounded-lg border border-blue-200">
        <p className="flex flex-col items-center justify-center gap-2 text-sm text-gray-700 sm:flex-row">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>
          {t('legal.prefix')}{' '}
          <Link href={`/${params.locale}/terms`} className="font-medium text-blue-600 hover:underline">
            {t('legal.terms')}
          </Link>
          {' '}{t('legal.and')}{' '}
          <Link href={`/${params.locale}/privacy`} className="font-medium text-blue-600 hover:underline">
            {t('legal.privacy')}
          </Link>
          {t('legal.middle')}{' '}
          <Link href={`/${params.locale}/refund`} className="font-medium text-blue-600 hover:underline">
            {t('legal.refund')}
          </Link>
          {' '}{t('legal.suffix')}
          </span>
        </p>
      </div>
    </div>
  )
}
