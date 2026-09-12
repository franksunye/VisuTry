import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Grid2X2, Sparkles, Store } from 'lucide-react'
import { ComparePageClient } from '@/components/compare/ComparePageClient'
import { CompareLandingVisual } from '@/components/marketing/CompareLandingVisual'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { generateStructuredData } from '@/lib/seo'

interface FrameComparePageProps {
  params: {
    locale: string
  }
}

export const dynamic = 'force-static'

export async function generateMetadata({ params }: FrameComparePageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.compareLanding' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `https://www.visutry.com/${params.locale}/try-on/glasses/compare`,
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('ogDescription'),
      url: `https://www.visutry.com/${params.locale}/try-on/glasses/compare`,
      type: 'website',
    },
  }
}

export default async function FrameComparePage({ params }: FrameComparePageProps) {
  setRequestLocale(params.locale)

  return (
    <ComparePageClient
      landing={<PublicFrameCompareLanding locale={params.locale} />}
    />
  )
}

async function PublicFrameCompareLanding({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'marketing.compareLanding' })
  const appSchema = generateStructuredData('softwareApplication', {
    name: 'VisuTry Frame Compare',
    url: `https://www.visutry.com/${locale}/try-on/glasses/compare`,
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'Web Browser',
    description: t('metaDescription'),
    featureList: [
      t('featureList.f1'),
      t('featureList.f2'),
      t('featureList.f3'),
      t('featureList.f4'),
    ],
  })
  const signInHref = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(
    `/${locale}/try-on/glasses/compare`,
  )}`

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <h1 className="sr-only">{t('srOnlyTitle')}</h1>
      <CompareLandingVisual locale={locale} startHref={signInHref} />

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            title: t('startCreditTitle'),
            description: t('cards.c1Description'),
          },
          {
            title: t('upToFourTitle'),
            description: t('cards.c2Description'),
          },
          {
            title: t('savedTitle'),
            description: t('cards.c3Description'),
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="mb-4 h-5 w-5 text-green-600" />
            <h2 className="mb-2 text-base font-bold text-gray-950">{item.title}</h2>
            <p className="text-sm leading-6 text-gray-600">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
            <Grid2X2 className="h-4 w-4" />
            {t('compareBefore')}
          </div>
          <p className="max-w-2xl text-sm leading-6 text-blue-900">
            {t('compareDescription')}
          </p>
          <p className="mt-2 text-sm text-blue-900">
            {t('shortlistPrefix')}{' '}
            <Link href={`/${locale}/face-shape-detector`} className="font-bold text-blue-700 hover:text-blue-950">
              {t('shortlistLink')}
            </Link>
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row">
          <Link
            href={signInHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            {t('startComparing')}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:border-blue-300"
          >
            {t('viewPricing')}
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-950">{t('sellingFramesTitle')}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              {t('sellingFramesDescription')}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/store`}
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-blue-300 hover:text-blue-700 sm:mt-0"
        >
          {t('sellingFramesCta')}
        </Link>
      </section>
    </main>
  )
}
