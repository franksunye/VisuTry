import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Grid2X2,
  Link2,
  ShieldCheck,
  Store,
  Upload,
} from 'lucide-react'
import { StoreLandingTracker, StoreCtaLink } from '@/components/store/StoreLandingAnalytics'
import { StoreLeadForm } from '@/components/store/StoreLeadForm'
import { StoreMarketingVisual } from '@/components/store/StoreMarketingVisual'
import { generateStructuredData } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'

interface StorePageProps {
  params: {
    locale: string
  }
}

export const dynamic = 'force-static'

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.store' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `https://www.visutry.com/${params.locale}/store`,
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `https://www.visutry.com/${params.locale}/store`,
      type: 'website',
    },
  }
}

export default async function StoreLandingPage({ params }: StorePageProps) {
  setRequestLocale(params.locale)
  const locale = params.locale
  const t = await getTranslations({ locale, namespace: 'marketing.store' })

  const workflow = [
    {
      icon: Upload,
      title: t('workflow.s1Title'),
      description: t('workflow.s1Description'),
    },
    {
      icon: Link2,
      title: t('workflow.s2Title'),
      description: t('workflow.s2Description'),
    },
    {
      icon: Grid2X2,
      title: t('workflow.s3Title'),
      description: t('workflow.s3Description'),
    },
    {
      icon: BarChart3,
      title: t('workflow.s4Title'),
      description: t('workflow.s4Description'),
    },
  ]

  const shopperBenefits = [
    t('shopperBenefits.b1'),
    t('shopperBenefits.b2'),
    t('shopperBenefits.b3'),
    t('shopperBenefits.b4'),
  ]

  const merchantBenefits = [
    t('merchantBenefits.b1'),
    t('merchantBenefits.b2'),
    t('merchantBenefits.b3'),
  ]

  const storeSchema = generateStructuredData('softwareApplication', {
    name: t('schema.appName'),
    url: `https://www.visutry.com/${locale}/store`,
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'Web Browser',
    description: t('schema.appDescription'),
    featureList: [
      t('schema.feature1'),
      t('schema.feature2'),
      t('schema.feature3'),
      t('schema.feature4'),
      t('schema.feature5'),
      t('schema.feature6'),
    ],
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <StoreLandingTracker locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }} />

      <section className="mx-auto mb-20 max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <Store className="mr-2 h-4 w-4" />
              {t('heroBadge')}
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight text-gray-950 md:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
              {t('heroDescription')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <StoreCtaLink
                href="#store-form"
                locale={locale}
                ctaLocation="hero_primary"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                {t('heroCtaPrimary')}
                <ArrowRight className="h-4 w-4" />
              </StoreCtaLink>
              <StoreCtaLink
                href="#workflow"
                locale={locale}
                ctaLocation="hero_secondary"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                {t('heroCtaSecondary')}
              </StoreCtaLink>
            </div>
            <p className="mt-5 text-sm text-gray-500">{t('heroNote')}</p>
          </div>

          <StoreMarketingVisual
            src="/images/store/store-hero-shopper.png"
            alt={t('heroImageAlt')}
            label="Hero shopper visual"
            description="Upload the approved Asset A as public/images/store/store-hero-shopper.png."
            aspectClass="aspect-[4/3]"
            priority
          />
        </div>
      </section>

      <section id="workflow" className="mx-auto mb-20 max-w-6xl scroll-mt-24">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{t('workflowEyebrow')}</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-950 md:text-4xl">{t('workflowTitle')}</h2>
          <p className="mt-4 text-base leading-7 text-gray-600">{t('workflowDescription')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {workflow.map((item, index) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-gray-400">0{index + 1}</span>
                </div>
                <h3 className="text-base font-bold text-gray-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{t('shopperEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">{t('shopperTitle')}</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              {t('shopperDescription')}
            </p>
            <div className="mt-6 grid gap-3">
              {shopperBenefits.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <StoreMarketingVisual
            src="/images/store/store-shopper-experience.png"
            alt={t('shopperImageAlt')}
            label="Shopper experience visual"
            description="Upload the approved Asset B as public/images/store/store-shopper-experience.png."
            aspectClass="aspect-[16/10]"
          />
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-5 md:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.62fr_0.38fr] lg:items-center">
          <StoreMarketingVisual
            src="/images/store/store-owner-dashboard.png"
            alt={t('merchantImageAlt')}
            label="Store owner dashboard visual"
            description="Upload the approved Asset C as public/images/store/store-owner-dashboard.png."
            aspectClass="aspect-[4/3]"
          />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{t('merchantEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">{t('merchantTitle')}</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              {t('merchantDescription')}
            </p>
            <div className="mt-6 grid gap-3">
              {merchantBenefits.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-semibold text-gray-800">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="store-form" className="mx-auto mb-14 max-w-6xl scroll-mt-24">
        <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <div className="pt-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{t('formEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">{t('formTitle')}</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              {t('formDescription')}
            </p>
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-950">{t('formTrustTitle')}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {t('formTrustDescription')}
                  </p>
                  <Link href={`/${locale}/privacy`} className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900">
                    {t('formTrustLink')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <StoreLeadForm locale={locale} />
        </div>
      </section>
    </main>
  )
}
