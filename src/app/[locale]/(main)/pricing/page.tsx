import { PricingSection } from "@/components/pricing/PricingSection"
import Link from "next/link"
import { Metadata } from 'next'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { PRODUCT_METADATA, formatPrice, getPricingQuotas } from '@/config/pricing'
import { Locale } from '@/i18n'
import { CheckCircle2, Glasses, Grid2X2, ScanFace, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.pricing' })

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    pathname: '/pricing',
  })
}

export const dynamic = 'force-static'

export default async function PricingPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const quotas = getPricingQuotas()
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.pricing' })

  // User data is fetched on the client via useSession() inside PricingSection,
  // so we pass null here to allow static rendering.
  const userForDisplay = null

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
    <div className="container px-4 py-6 mx-auto md:py-8">
      {/* Structured Data for Offers */}
      {offerSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Page Header */}
      <div className="mb-6 max-w-3xl md:mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600 md:mb-3 md:text-sm">
          {t('eyebrow')}
        </p>
        <h1 className="mb-3 text-2xl font-bold leading-tight text-gray-900 md:mb-4 md:text-4xl">
          {t('title', { count: quotas.creditsPack })}
        </h1>
        <p className="text-sm leading-6 text-gray-600 md:text-base md:leading-7">
          {t('description')}
        </p>
      </div>

      <Link
        href={`/${params.locale}/face-shape-detector`}
        className="mb-5 flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 transition hover:border-green-300 md:mb-8 md:flex-row md:items-center md:justify-between md:p-5"
      >
        <span className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-green-700 md:h-10 md:w-10">
            <ScanFace className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-green-950 md:text-base">{t('freeDetector.title')}</span>
            <span className="mt-1 block text-xs leading-5 text-green-900 md:text-sm md:leading-6">{t('freeDetector.description')}</span>
          </span>
        </span>
        <span className="hidden flex-shrink-0 font-semibold text-green-800 sm:inline">{t('freeDetector.cta')} →</span>
      </Link>

      {/* These education cards are useful on desktop, but on mobile they delay
          the first purchase decision by several screens. Keep the compact
          free-detector note above and move straight into pricing on phones. */}
      <div className="mb-8 hidden gap-4 md:grid md:grid-cols-3">
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

      {/* Pricing Section (Cards + Comparison + Promo Input) */}
      <PricingSection user={userForDisplay} quotas={quotas} />

      {/* FAQ */}
      <div className="mt-10 md:mt-12">
        <h2 className="mb-5 text-xl font-bold text-center text-gray-900 md:mb-6 md:text-2xl">{t('faqTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="p-5 bg-white rounded-lg border shadow-sm md:p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q1Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q1Answer', { count: quotas.creditsPack })}
            </p>
          </div>

          <div className="p-5 bg-white rounded-lg border shadow-sm md:p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q2Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q2Answer')}
            </p>
          </div>

          <div className="p-5 bg-white rounded-lg border shadow-sm md:p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q3Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q3Answer')}
            </p>
          </div>

          <div className="p-5 bg-white rounded-lg border shadow-sm md:p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q4Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q4Answer')}
            </p>
          </div>

          <div className="p-5 bg-white rounded-lg border shadow-sm md:p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q5Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q5Answer')}
            </p>
          </div>

          <div className="p-5 bg-white rounded-lg border shadow-sm md:p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q6Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q6Answer')}
            </p>
          </div>

          <div className="p-5 bg-white rounded-lg border shadow-sm md:p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{t('faq.q7Title')}</h3>
            <p className="text-sm text-gray-600">
              {t('faq.q7Answer')}
            </p>
          </div>
        </div>
      </div>

      {/* Neutral legal links apply to both one-time purchases and subscriptions. */}
      <div className="p-4 mt-8 bg-blue-50 rounded-lg border border-blue-200">
        <p className="flex flex-col items-center justify-center gap-2 text-sm text-gray-700 sm:flex-row">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link href={`/${params.locale}/terms`} className="font-medium text-blue-600 hover:underline">
              {t('legal.terms')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href={`/${params.locale}/privacy`} className="font-medium text-blue-600 hover:underline">
              {t('legal.privacy')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href={`/${params.locale}/refund`} className="font-medium text-blue-600 hover:underline">
              {t('legal.refund')}
            </Link>
          </span>
        </p>
      </div>
    </div>
  )
}
