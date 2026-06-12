import Link from 'next/link'
import { ArrowRight, CheckCircle2, Glasses, ScanFace, Shield, Sparkles, Upload } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LoginButton } from '@/components/auth/LoginButton'
import { generateStructuredData } from '@/lib/seo'
import { FaceAnalysisPreviewVisual } from '@/components/face-analysis/FaceAnalysisPreviewVisual'

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
  {
    question: 'What glasses suit my face shape?',
    answer: 'Round faces often start with angular frames, square faces with round or oval frames, oval faces with balanced rectangular or browline frames, and heart faces with lightweight or softly upswept frames.',
  },
]

const valuePoints = [
  'AI face shape detector for glasses',
  'Frame picks with a reason',
  'Continue into virtual try-on',
]

const faceShapeGuidance = [
  {
    shape: 'Round face',
    slug: 'round-face',
    frames: 'Rectangular, square, geometric, and slightly wider frames',
    reason: 'Angular lines add definition and help balance softer curves.',
  },
  {
    shape: 'Square face',
    slug: 'square-face',
    frames: 'Round, oval, thin metal, and softly curved frames',
    reason: 'Curved shapes soften a strong jawline and reduce visual weight.',
  },
  {
    shape: 'Oval face',
    slug: 'oval-face',
    frames: 'Balanced rectangular, browline, aviator, and classic shapes',
    reason: 'Oval proportions are flexible, so scale and personal style matter most.',
  },
  {
    shape: 'Heart face',
    slug: 'heart-face',
    frames: 'Lightweight, rounded, cat-eye, and bottom-balanced frames',
    reason: 'Softer or lifted shapes balance a wider forehead with a narrower chin.',
  },
]

export async function FaceAnalysisLanding({ locale }: FaceAnalysisLandingProps) {
  const t = await getTranslations('faceAnalysis.landing')
  const isEnglish = locale === 'en'
  const heroTitle = isEnglish ? 'AI Face Shape Detector for Glasses' : t('title')
  const heroDescription = isEnglish
    ? 'Upload one clear portrait, learn what glasses suit your face, then start virtual glasses try-on with frames that are actually worth testing.'
    : t('description')
  const faqSchema = generateStructuredData('faqPage', {
    questions: faceAnalysisFaqContent,
  })
  const appSchema = generateStructuredData('softwareApplication', {
    name: 'VisuTry AI Face Analysis for Glasses',
    url: `https://visutry.com/${locale}/face-analysis`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web Browser',
    description: 'AI face shape analysis for glasses recommendations and virtual try-on planning.',
    featureList: [
      'AI face shape detection',
      'Personalized glasses recommendations',
      'Frame styles to try and avoid',
      'Virtual glasses try-on workflow',
    ],
  })
  const howToSchema = generateStructuredData('howTo', {
    name: 'How to choose glasses with AI face analysis',
    description: 'Use one clear photo to estimate your face shape, shortlist glasses styles, and validate the look with AI virtual try-on.',
    totalTime: 'PT3M',
    steps: [
      {
        name: 'Upload a front-facing photo',
        text: 'Use a clear photo with your face visible and good lighting.',
      },
      {
        name: 'Review your AI face shape report',
        text: 'Check the estimated face shape, confidence score, and visible style features.',
      },
      {
        name: 'Try recommended glasses styles',
        text: 'Use the suggested frame directions as your first virtual try-on shortlist.',
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
        <section className="mx-auto grid min-h-[680px] max-w-6xl gap-10 px-4 py-10 md:py-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700 shadow-sm">
              Face shape detector for glasses
            </p>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-gray-950 md:text-5xl">
              {heroTitle}
            </h1>
            <p className="mb-7 text-lg leading-8 text-gray-600">
              {heroDescription}
            </p>
            <div className="mb-8 grid gap-3">
              {valuePoints.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LoginButton
                className="justify-center px-5 py-3"
                callbackUrl={`/${locale}/face-analysis`}
                eventName="face_analysis_signin_click"
                eventParameters={{ source: 'face_analysis_landing' }}
                label={isEnglish ? 'Start face analysis' : undefined}
              />
              <Link
                href={`/${locale}/try-on/glasses`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                {isEnglish ? 'Try glasses on photo' : t('tryGlasses')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link href={`/${locale}/glasses-for-face-shape`} className="font-semibold text-blue-700 hover:text-blue-900">
                Compare glasses by face shape
              </Link>
              <span className="text-gray-300">/</span>
              <Link href={`/${locale}/blog/ai-face-analysis-for-glasses-guide`} className="font-semibold text-blue-700 hover:text-blue-900">
                Read the AI glasses guide
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[720px]">
            <FaceAnalysisPreviewVisual variant="report" />
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <section className="grid gap-3 md:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-gray-950">{step.title}</h2>
                </div>
                <p className="text-sm leading-6 text-gray-600">{step.description}</p>
              </div>
            )
          })}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center gap-2">
            <Glasses className="h-5 w-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-950">
              Best glasses by face shape
            </h2>
          </div>
          <p className="mb-5 max-w-2xl text-sm leading-6 text-gray-600">
            If you are asking what glasses suit my face, start with face shape as a first filter.
            Use these frame directions to build your shortlist, then validate scale and style with
            virtual glasses try-on.
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1fr_1.35fr_1.45fr] gap-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                <span>Face shape</span>
                <span>Try first</span>
                <span>Why it works</span>
              </div>
              {faceShapeGuidance.map((item) => (
                <div
                  key={item.shape}
                  className="grid grid-cols-[1fr_1.35fr_1.45fr] gap-3 border-t border-gray-200 px-4 py-4 text-sm"
                >
                  <span className="font-semibold text-gray-950">{item.shape}</span>
                  <span className="text-gray-700">{item.frames}</span>
                  <span className="text-gray-600">
                    {item.reason}{' '}
                    <Link href={`/${locale}/style/${item.slug}`} className="font-semibold text-blue-700 hover:text-blue-900">
                      See styles
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${locale}/glasses-for-face-shape`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Explore the face-shape guide
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/try-on/glasses`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Try glasses on your photo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
        <section className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
