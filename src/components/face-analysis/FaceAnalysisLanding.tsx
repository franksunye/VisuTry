import Link from 'next/link'
import { ArrowRight, CheckCircle2, Glasses, ScanFace, Shield, Sparkles, Upload } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LoginButton } from '@/components/auth/LoginButton'
import { FaceAnalysisLandingSlides } from '@/components/marketing/FaceAnalysisLandingSlides'
import { generateStructuredData } from '@/lib/seo'

interface FaceAnalysisLandingProps {
  locale: string
}

export async function FaceAnalysisLanding({ locale }: FaceAnalysisLandingProps) {
  const t = await getTranslations('faceAnalysis.landing')
  const tm = await getTranslations({ locale, namespace: 'marketing.faceAnalysisLanding' })
  const heroTitle = t('title')
  const heroDescription = t('description')
  const faceAnalysisFaqContent = [
    { question: tm('faq.q1Question'), answer: tm('faq.q1Answer') },
    { question: tm('faq.q2Question'), answer: tm('faq.q2Answer') },
    { question: tm('faq.q3Question'), answer: tm('faq.q3Answer') },
    { question: tm('faq.q4Question'), answer: tm('faq.q4Answer') },
    { question: tm('faq.q5Question'), answer: tm('faq.q5Answer') },
    { question: tm('faq.q6Question'), answer: tm('faq.q6Answer') },
  ]
  const valuePoints = [tm('valuePoints.p1'), tm('valuePoints.p2'), tm('valuePoints.p3')]
  const faceShapeGuidance = [
    {
      shape: tm('shapes.roundName'),
      slug: 'round-face',
      frames: tm('shapes.roundFrames'),
      reason: tm('shapes.roundReason'),
    },
    {
      shape: tm('shapes.squareName'),
      slug: 'square-face',
      frames: tm('shapes.squareFrames'),
      reason: tm('shapes.squareReason'),
    },
    {
      shape: tm('shapes.ovalName'),
      slug: 'oval-face',
      frames: tm('shapes.ovalFrames'),
      reason: tm('shapes.ovalReason'),
    },
    {
      shape: tm('shapes.heartName'),
      slug: 'heart-face',
      frames: tm('shapes.heartFrames'),
      reason: tm('shapes.heartReason'),
    },
  ]
  const faqSchema = generateStructuredData('faqPage', {
    questions: faceAnalysisFaqContent,
  })
  const appSchema = generateStructuredData('softwareApplication', {
    name: tm('schema.appName'),
    url: `https://www.visutry.com/${locale}/face-analysis`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web Browser',
    description: tm('schema.appDescription'),
    featureList: [
      tm('schema.feature1'),
      tm('schema.feature2'),
      tm('schema.feature3'),
      tm('schema.feature4'),
    ],
  })
  const howToSchema = generateStructuredData('howTo', {
    name: tm('schema.howToName'),
    description: tm('schema.howToDescription'),
    totalTime: 'PT3M',
    steps: [
      {
        name: tm('schema.howToStep1Name'),
        text: tm('schema.howToStep1Text'),
      },
      {
        name: tm('schema.howToStep2Name'),
        text: tm('schema.howToStep2Text'),
      },
      {
        name: tm('schema.howToStep3Name'),
        text: tm('schema.howToStep3Text'),
      },
    ],
  })

  const steps = [
    {
      icon: Upload,
      title: t('steps.uploadTitle'),
      description: t('steps.uploadDescription'),
    },
    {
      icon: ScanFace,
      title: t('steps.analysisTitle'),
      description: t('steps.analysisDescription'),
    },
    {
      icon: Sparkles,
      title: t('steps.reportTitle'),
      description: t('steps.reportDescription'),
    },
    {
      icon: Shield,
      title: t('steps.privacyTitle'),
      description: t('steps.privacyDescription'),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className="bg-gradient-to-b from-blue-50 via-white to-white">
        <section className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:gap-9 sm:py-9 md:py-12 lg:min-h-[620px] lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-10 lg:py-12">
          <div className="max-w-xl">
            <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700 shadow-sm sm:mb-4">
              {tm('badge')}
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 sm:text-4xl md:mb-5 md:text-5xl">
              {heroTitle}
            </h1>
            <p className="mb-5 text-base leading-7 text-gray-600 sm:mb-7 sm:text-lg sm:leading-8">
              {heroDescription}
            </p>
            <div className="mb-6 grid gap-2.5 sm:mb-8 sm:gap-3">
              {valuePoints.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <LoginButton
                className="justify-center px-5 py-3"
                preserveCurrentUrl
                eventName="face_analysis_signin_click"
                eventParameters={{ source: 'face_analysis_landing' }}
                label={tm('startFaceAnalysis')}
              />
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                {tm('useFreeDetector')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5 text-xs sm:mt-5 sm:gap-3 sm:text-sm">
              <Link href={`/${locale}/glasses-for-face-shape`} className="font-semibold text-blue-700 hover:text-blue-900">
                {tm('links.compareByShape')}
              </Link>
              <span className="text-gray-300">/</span>
              <Link href={`/${locale}/blog/ai-face-analysis-for-glasses-guide`} className="font-semibold text-blue-700 hover:text-blue-900">
                {tm('links.readGuide')}
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[720px]">
            <FaceAnalysisLandingSlides />
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-9 sm:w-9">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-xs font-semibold leading-5 text-gray-950 sm:text-sm">{step.title}</h2>
                </div>
                <p className="text-xs leading-5 text-gray-600 sm:text-sm sm:leading-6">{step.description}</p>
              </div>
            )
          })}
        </section>

        <section className="mt-8 md:mt-10">
          <div className="mb-4 flex items-center gap-2 sm:mb-5">
            <Glasses className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-950 sm:text-2xl">
              {tm('table.title')}
            </h2>
          </div>
          <p className="mb-4 max-w-2xl text-sm leading-6 text-gray-600 sm:mb-5">
            {tm('table.description')}
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="hidden grid-cols-[1fr_1.35fr_1.45fr] gap-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 md:grid">
              <span>{tm('table.colShape')}</span>
              <span>{tm('table.colTryFirst')}</span>
              <span>{tm('table.colWhy')}</span>
            </div>
            {faceShapeGuidance.map((item) => (
              <div
                key={item.shape}
                className="grid gap-3 border-t border-gray-200 px-4 py-4 text-sm first:border-t-0 md:grid-cols-[1fr_1.35fr_1.45fr] md:first:border-t"
              >
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 md:hidden">
                    {tm('table.colShape')}
                  </span>
                  <span className="font-semibold text-gray-950">{item.shape}</span>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 md:hidden">
                    {tm('table.colTryFirst')}
                  </span>
                  <span className="text-gray-700">{item.frames}</span>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 md:hidden">
                    {tm('table.colWhy')}
                  </span>
                  <span className="text-gray-600">
                    {item.reason}{' '}
                    <Link href={`/${locale}/style/${item.slug}`} className="font-semibold text-blue-700 hover:text-blue-900">
                      {tm('table.seeStyles')}
                    </Link>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:gap-3">
            <Link
              href={`/${locale}/glasses-for-face-shape`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {tm('table.ctaGuide')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/try-on/glasses`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {tm('table.ctaTry')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:mt-10">
          <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-normal text-blue-600 sm:mb-2 sm:text-sm">
                {tm('faqEyebrow')}
              </p>
              <h2 className="text-xl font-bold text-gray-950 sm:text-2xl">
                {tm('faqTitle')}
              </h2>
            </div>
            <Link
              href={`/${locale}/blog/ai-face-analysis-for-glasses-guide`}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              {tm('guideLink')}
            </Link>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {faceAnalysisFaqContent.map((item) => (
              <div key={item.question} className="rounded-lg border border-gray-200 p-4 sm:p-5">
                <h3 className="mb-2 text-sm font-semibold text-gray-950 sm:mb-3 sm:text-base">{item.question}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
