'use client'

import { Upload, Sparkles, Share2 } from 'lucide-react'
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
        <h1 className="max-w-3xl mx-auto text-4xl md:text-5xl font-bold text-gray-900 mb-3">
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
    </main>
  )
}
