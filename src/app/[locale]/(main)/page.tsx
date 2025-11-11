'use client'

import { Upload, Sparkles, Share2, Zap, Shield, Clock, Database } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTestSession } from '@/hooks/useTestSession'
import { useTranslations } from 'next-intl'
import { TryOnShowcase } from '@/components/home/TryOnShowcase'

export default function Home() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { data: session } = useSession()
  const { testSession } = useTestSession()
  const t = useTranslations('home')

  const isAuthenticated = session || testSession

  const handleStartTryOn = () => {
    if (isAuthenticated) {
      router.push(`/${locale}/try-on`)
    } else {
      router.push(`/${locale}/auth/signin?callbackUrl=` + encodeURIComponent(`/${locale}/try-on`))
    }
  }

  return (
    <main className="container px-4 py-8 mx-auto">
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

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={handleStartTryOn}
            className="px-8 py-4 text-lg font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl"
          >
            {t('cta.button')}
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
      <section className="max-w-4xl mx-auto mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <details
              key={num}
              className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {t(`faq.q${num}.question`)}
                </h3>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                <p>{t(`faq.q${num}.answer`)}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
