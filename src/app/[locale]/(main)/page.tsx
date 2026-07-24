import Link from 'next/link'
import { Database, ScanFace, ArrowRight, Grid2X2, Glasses, LockKeyhole, Sparkles, Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FaceAnalysisPreviewVisual } from '@/components/face-analysis/FaceAnalysisPreviewVisual'
import { ModelTryOnSlides } from '@/components/marketing/ModelTryOnSlides'

export const dynamic = 'force-static'

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

  const toolPath = [
    { step: '01', href: `/${locale}/face-shape-detector`, icon: ScanFace, label: t('tools.faceTitle'), isStart: true },
    { step: '02', href: `/${locale}/face-analysis`, icon: Sparkles, label: t('tools.advisorTitle') },
    { step: '03', href: `/${locale}/try-on/glasses`, icon: Glasses, label: t('tools.glassesTitle') },
    { step: '04', href: `/${locale}/try-on/glasses/compare`, icon: Grid2X2, label: t('tools.compareTitle') },
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
      <header className="mb-10 text-center">
        <h1 className="max-w-3xl mx-auto text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {t('heroTitle')}
        </h1>
        <p className="mx-auto max-w-3xl text-lg md:text-xl text-gray-600 font-medium">
          {t('heroSubtitle')}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
        <p className="mt-5 text-sm font-medium text-gray-500">
          {t('trustLine')}
        </p>
      </header>

      {/* Compact product path */}
      <section className="mx-auto mb-16 max-w-5xl" aria-labelledby="tool-path-title">
        <p id="tool-path-title" className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-600">
          {t('recommendedWorkflow')}
        </p>
        <ol className="grid overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {toolPath.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href} className="border-b border-gray-200 last:border-b-0 sm:[&:nth-child(odd)]:border-e lg:border-b-0 lg:border-e lg:last:border-e-0">
                <Link
                  href={item.href}
                  className="flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50/60"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-gray-400">
                      {item.step}{item.isStart ? ` · ${t('bestPlaceToStart')}` : ''}
                    </span>
                    <span className="mt-0.5 block text-sm font-bold text-gray-900">{item.label}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Free detector to paid advice */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="grid gap-8 overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-white p-5 shadow-sm md:p-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              <ScanFace className="me-2 h-4 w-4" />
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
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </div>
          <FaceAnalysisPreviewVisual variant="workflow" />
        </div>
      </section>

      {/* Step 3 and 4 product proof */}
      <section className="max-w-6xl mx-auto mb-16">
        <ModelTryOnSlides locale={locale} mode="home" preloadFirstImage={false} />
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

      {/* Quiet B2B bridge */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="flex flex-col gap-5 rounded-lg border border-blue-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">For optical stores and eyewear sellers</p>
              <h2 className="text-xl font-bold text-gray-950">Offer shoppers a hosted AI eyewear advisor and try-on link.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                VisuTry Store is a lightweight pilot for merchants who want frame guidance, virtual try-on, comparison, and lead capture before building a full integration.
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/store`}
            className="inline-flex flex-shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          >
            Explore VisuTry Store
            <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('faqTitle')}</h2>
          <p className="text-lg text-gray-600">{t('faqSubtitle')}</p>
        </div>

        <div className="flex flex-col gap-y-6">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900 pe-4">
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