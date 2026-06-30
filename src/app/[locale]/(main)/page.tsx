import Link from 'next/link'
import { Database, ScanFace, ArrowRight, Grid2X2, Glasses, LockKeyhole, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FaceAnalysisPreviewVisual } from '@/components/face-analysis/FaceAnalysisPreviewVisual'
import { ModelTryOnSlides } from '@/components/marketing/ModelTryOnSlides'

export default function Home({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale
  const t = useTranslations('marketing.home')

  const faqItems = [
    { question: t('faq.q1Question'), answer: t('faq.q1Answer') },
    { question: t('faq.q2Question'), answer: t('faq.q2Answer') },
    { question: t('faq.q3Question'), answer: t('faq.q3Answer') },
    { question: t('faq.q4Question'), answer: t('faq.q4Answer') },
    { question: t('faq.q5Question'), answer: t('faq.q5Answer') },
  ]

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }

  return (
    <main className="container px-4 py-8 mx-auto">
      {/* FAQ Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero Header */}
      <header className="mb-16 text-center">
        <h1 className="max-w-3xl mx-auto text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {t('heroTitle')}
        </h1>
        <p className="mx-auto max-w-3xl text-lg md:text-xl text-gray-600 font-medium">
          {t('heroSubtitle')}
        </p>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto mb-16">

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={`/${locale}/face-shape-detector`} className="flex flex-col items-center rounded-lg border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
              <ScanFace className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('tools.faceTitle')}</h3>
            <p className="text-center text-gray-600">{t('tools.faceDescription')}</p>
          </Link>

          <Link href={`/${locale}/face-analysis`} className="flex flex-col items-center rounded-lg border border-violet-100 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-violet-100 rounded-full">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('tools.advisorTitle')}</h3>
            <p className="text-center text-gray-600">{t('tools.advisorDescription')}</p>
          </Link>

          <Link href={`/${locale}/try-on/glasses`} className="flex flex-col items-center rounded-lg border border-green-100 bg-white p-5 shadow-sm transition hover:border-green-300 hover:shadow-md">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
              <Glasses className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('tools.glassesTitle')}</h3>
            <p className="text-center text-gray-600">{t('tools.glassesDescription')}</p>
          </Link>

          <Link href={`/${locale}/try-on/glasses/compare`} className="flex flex-col items-center rounded-lg border border-indigo-100 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-indigo-100 rounded-full">
              <Grid2X2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('tools.compareTitle')}</h3>
            <p className="text-center text-gray-600">{t('tools.compareDescription')}</p>
          </Link>
        </div>

        <ModelTryOnSlides locale={locale} mode="home" preloadFirstImage={false} />

        {/* CTA Section - Glasses Only */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}/face-shape-detector`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-blue-700"
          >
            {t('ctaPrimary')}
          </Link>
          <Link
            href={`/${locale}/try-on/glasses`}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-800 transition-colors duration-200 hover:border-blue-300 hover:text-blue-700"
          >
            {t('ctaSecondary')}
          </Link>
        </div>
      </section>

      {/* Face Analysis to Try-On Section */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="grid gap-8 overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-white p-5 shadow-sm md:p-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              <ScanFace className="mr-2 h-4 w-4" />
              {t('workflow.badge')}
            </p>
            <h2 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">
              {t('workflow.title')}
            </h2>
            <p className="mb-6 text-base leading-7 text-gray-600">
              {t('workflow.description')}
            </p>
            <div className="mb-6 grid gap-3 text-sm font-semibold text-gray-700">
              {[t('workflow.point1'), t('workflow.point2'), t('workflow.point3')].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href={`/${locale}/face-analysis`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
            >
              {t('workflow.cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <FaceAnalysisPreviewVisual variant="workflow" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto mb-16">
        <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3 md:p-5">
          {[
            {
              icon: Sparkles,
              title: t('benefits.generatedTitle'),
              description: t('benefits.generatedDescription'),
            },
            {
              icon: Database,
              title: t('benefits.historyTitle'),
              description: t('benefits.historyDescription'),
            },
            {
              icon: LockKeyhole,
              title: t('benefits.privacyTitle'),
              description: t('benefits.privacyDescription'),
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex gap-3 rounded-lg bg-gray-50 p-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-950">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('faqTitle')}</h2>
          <p className="text-lg text-gray-600">{t('faqSubtitle')}</p>
        </div>

        <div className="space-y-6">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {item.question}
                </h3>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
