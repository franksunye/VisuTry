'use client'

import Link from 'next/link'
import { Upload, Sparkles, Share2, Zap, Shield, Clock, Database, ScanFace, ArrowRight, Grid2X2, Glasses } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTestSession } from '@/hooks/useTestSession'
import { useTranslations } from 'next-intl'
import { FaceAnalysisPreviewVisual } from '@/components/face-analysis/FaceAnalysisPreviewVisual'
import { ModelTryOnSlides } from '@/components/marketing/ModelTryOnSlides'

// English FAQ content - displayed in all languages
const englishFaqContent = [
  {
    question: "How does VisuTry's AI try-on work?",
    answer: "VisuTry combines face guidance, AI glasses try-on, and frame comparison. Upload a portrait, choose a glasses image or preset, and generate realistic previews in your browser."
  },
  {
    question: "What is Frame Compare?",
    answer: "Frame Compare lets you pick built-in glasses presets and generate side-by-side try-on results from the same photo, so you can compare shape and scale faster."
  },
  {
    question: "Is my photo data safe and private?",
    answer: "Absolutely! Your photos are encrypted during upload and processing. We never share your images publicly or use them for AI training without explicit permission. Free users' data is stored for 7 days, Credits users for 90 days, and Premium members for 1 year."
  },
  {
    question: "What's the difference between free and Premium quality?",
    answer: "Free users get standard quality images (800×800 pixels) with a small watermark. Premium users receive high-quality images (1200×1200 pixels) without watermarks, plus priority processing and longer data retention (1 year vs 7 days)."
  },
  {
    question: "Can I use the generated images commercially?",
    answer: "Yes! Premium and Credits Pack users can use their watermark-free images for any purpose, including commercial use. Free users receive images with a watermark for personal use only."
  },
  {
    question: "How long does it take to generate a try-on?",
    answer: "Most try-ons complete in 10-30 seconds. Premium users enjoy priority processing, which means faster results even during peak times. The exact time depends on server load and image complexity."
  },
  {
    question: "What happens to my try-on history?",
    answer: "Your try-on history is automatically saved based on your plan: Free users (7 days), Credits users (90 days), Premium users (1 year). You'll receive an email reminder 3 days before expiration, giving you time to download or upgrade."
  }
]

export default function Home() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { data: session } = useSession()
  const { testSession } = useTestSession()
  const t = useTranslations('home')
  const tCommon = useTranslations('common')

  const isAuthenticated = session || testSession

  const handleStartTryOn = (type: 'glasses' | 'outfit' | 'shoes' | 'accessories' = 'glasses') => {
    router.push(`/${locale}/try-on/${type}`)
  }

  // Generate FAQ structured data for SEO - using English content
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": englishFaqContent.map((item) => ({
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
          AI Glasses Try-On, Face Analysis, and Frame Compare
        </h1>
        <p className="mx-auto max-w-3xl text-lg md:text-xl text-gray-600 font-medium">
          Find better frames before you buy: analyze your face shape, try custom glasses images, and compare preset frames side by side.
        </p>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto mb-16">

        <div className="grid gap-4 mb-8 md:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
              <ScanFace className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Face</h3>
            <p className="text-center text-gray-600">Detect face shape and get frame directions before spending credits.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
              <Glasses className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Glasses</h3>
            <p className="text-center text-gray-600">Upload product photos or screenshots and preview them on your face.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-indigo-100 rounded-full">
              <Grid2X2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Compare</h3>
            <p className="text-center text-gray-600">Pick built-in presets and review multiple frame results in one board.</p>
          </div>
        </div>

        <ModelTryOnSlides locale={locale} mode="home" />

        {/* CTA Section - Glasses Only */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}/face-analysis`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-blue-700"
          >
            Start with Face
          </Link>
          <Link
            href={`/${locale}/try-on/glasses/compare`}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-800 transition-colors duration-200 hover:border-blue-300 hover:text-blue-700"
          >
            Compare frames
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ScanFace,
              title: 'Face Analysis',
              description: 'A professional face-shape report with frame style recommendations.',
              href: `/${locale}/face-analysis`,
            },
            {
              icon: Glasses,
              title: 'Custom Glasses Try-On',
              description: 'Use your own glasses product image, store photo, or screenshot.',
              href: `/${locale}/try-on/glasses`,
            },
            {
              icon: Grid2X2,
              title: 'Frame Compare',
              description: 'Quickly test built-in frame presets from the same portrait.',
              href: `/${locale}/try-on/glasses/compare`,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.title} href={item.href} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <Icon className="mb-4 h-6 w-6 text-blue-600" />
                <h2 className="mb-2 text-lg font-bold text-gray-950">{item.title}</h2>
                <p className="text-sm leading-6 text-gray-600">{item.description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600">
                  Open tool <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Face Analysis to Try-On Section */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="grid gap-8 overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-white p-5 shadow-sm md:p-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              <ScanFace className="mr-2 h-4 w-4" />
              Face analysis for glasses
            </p>
            <h2 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">
              Start try-on with frames that already fit the face
            </h2>
            <p className="mb-6 text-base leading-7 text-gray-600">
              VisuTry now uses one portrait to read face shape, narrow the first frame shortlist,
              and send shoppers directly into glasses try-on with better choices.
            </p>
            <div className="mb-6 grid gap-3 text-sm font-semibold text-gray-700">
              {['Face shape report', 'Recommended frame styles', 'One path into AI try-on'].map((item) => (
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
              Analyze my face
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <FaceAnalysisPreviewVisual variant="workflow" />
        </div>
      </section>

      {/* Key Features Section */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Feature 1: Google Nano Banana */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('features.feature1.title')}
            </h3>
            <p className="text-gray-600">
              {t('features.feature1.description')}
            </p>
          </div>

          {/* Feature 2: Smart Data Retention */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('features.feature2.title')}
            </h3>
            <p className="text-gray-600">
              {t('features.feature2.description')}
            </p>
          </div>

          {/* Feature 3: Lightning Fast */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('features.feature3.title')}
            </h3>
            <p className="text-gray-600">
              {t('features.feature3.description')}
            </p>
          </div>

          {/* Feature 4: Privacy Protected */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('features.feature4.title')}
            </h3>
            <p className="text-gray-600">
              {t('features.feature4.description')}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {englishFaqContent.map((item, index) => (
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
