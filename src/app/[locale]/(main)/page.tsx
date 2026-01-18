'use client'

import { Upload, Sparkles, Share2, Zap, Shield, Clock, Database } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTestSession } from '@/hooks/useTestSession'
import { useTranslations } from 'next-intl'
import { TryOnShowcase } from '@/components/home/TryOnShowcase'

// English FAQ content - displayed in all languages
const englishFaqContent = [
  {
    question: "How does VisuTry's AI try-on work?",
    answer: "VisuTry uses Google Gemini 2.5 Flash AI to analyze your facial features and realistically overlay glasses onto your photo. The AI understands face shape, lighting, and perspective to create natural-looking results in seconds."
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

  const isAuthenticated = session || testSession

  const handleStartTryOn = (type: 'glasses' | 'outfit' | 'shoes' | 'accessories' = 'glasses') => {
    if (isAuthenticated) {
      router.push(`/${locale}/try-on/${type}`)
    } else {
      router.push(`/${locale}/auth/signin?callbackUrl=` + encodeURIComponent(`/${locale}/try-on/${type}`))
    }
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
          {t('hero.title')}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-medium">
          {t('hero.subtitle')}
        </p>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto mb-16">

        <div className="grid gap-8 mb-12 md:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('steps.step1.title')}</h3>
            <p className="text-center text-gray-600">{t('steps.step1.description')}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-purple-100 rounded-full">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('steps.step2.title')}</h3>
            <p className="text-center text-gray-600">{t('steps.step2.description')}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
              <Share2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('steps.step3.title')}</h3>
            <p className="text-center text-gray-600">{t('steps.step3.description')}</p>
          </div>
        </div>

        {/* Try-On Showcase Carousel */}
        <TryOnShowcase />

        {/* CTA Section - Glasses Only */}
        <div className="flex justify-center">
          <button
            onClick={() => handleStartTryOn('glasses')}
            className="px-6 py-3 text-base font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl"
          >
            👓 {t('cta.tryGlasses')}
          </button>
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
          {/* Feature 1: Google Gemini 2.5 Flash */}
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
