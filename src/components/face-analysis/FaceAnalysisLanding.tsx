import Link from 'next/link'
import { CheckCircle2, ScanFace, Shield, Sparkles, Upload } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LoginButton } from '@/components/auth/LoginButton'
import { generateStructuredData } from '@/lib/seo'

interface FaceAnalysisLandingProps {
  locale: string
}

const faceAnalysisFaqContent = [
  {
    question: 'What is AI face analysis for glasses?',
    answer: 'VisuTry provides AI face analysis for glasses by estimating your face shape and key visible features, then suggesting frame styles before virtual try-on.',
  },
  {
    question: 'Can AI recommend glasses for my face shape?',
    answer: 'Yes. AI face analysis can recommend frame directions for round, square, oval, heart, diamond, oblong, and triangle face shapes. Use virtual try-on as the final visual check.',
  },
  {
    question: 'Is my face analysis private?',
    answer: 'Your uploaded photo and analysis stay private to your account. VisuTry uses the image to generate your face shape report and glasses recommendations.',
  },
]

const valuePoints = [
  'Detect your likely face shape from one clear photo',
  'Get frame directions before browsing hundreds of styles',
  'Use virtual try-on as the final visual check',
]

export async function FaceAnalysisLanding({ locale }: FaceAnalysisLandingProps) {
  const t = await getTranslations('faceAnalysis.landing')
  const faqSchema = generateStructuredData('faqPage', {
    questions: faceAnalysisFaqContent,
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

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              AI face shape analysis for glasses
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {t('title')}
            </h1>
            <p className="mb-6 text-lg leading-8 text-gray-600">
              {t('description')}
            </p>
            <div className="mb-7 grid gap-3">
              {valuePoints.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LoginButton
                className="justify-center py-3"
                callbackUrl={`/${locale}/face-analysis`}
              />
              <Link
                href={`/${locale}/try-on/glasses`}
                className="inline-flex items-center justify-center px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {t('tryGlasses')}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm md:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mb-2 text-base font-semibold text-gray-950">{step.title}</h2>
                    <p className="text-sm leading-6 text-gray-600">{step.description}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
              VisuTry estimates your face shape and suggests frame styles, then lets you compare
              those recommendations with AI virtual try-on.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
                Questions shoppers ask
              </p>
              <h2 className="text-2xl font-bold text-gray-950">
                AI face analysis FAQ
              </h2>
            </div>
            <Link
              href={`/${locale}/blog/ai-face-analysis-for-glasses-guide`}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Read the full guide
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {faceAnalysisFaqContent.map((item) => (
              <div key={item.question} className="rounded-lg border border-gray-200 p-5">
                <h3 className="mb-3 text-base font-semibold text-gray-950">{item.question}</h3>
                <p className="text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
