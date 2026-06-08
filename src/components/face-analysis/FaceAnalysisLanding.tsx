import Link from 'next/link'
import { ScanFace, Shield, Sparkles, Upload } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LoginButton } from '@/components/auth/LoginButton'

interface FaceAnalysisLandingProps {
  locale: string
}

export async function FaceAnalysisLanding({ locale }: FaceAnalysisLandingProps) {
  const t = await getTranslations('faceAnalysis.landing')

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-950 mb-4">{t('title')}</h1>
          <p className="text-lg text-gray-600 mb-8">{t('description')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
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

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="grid gap-4">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <Upload className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-950">{t('steps.uploadTitle')}</h2>
              <p className="text-sm text-gray-600">{t('steps.uploadDescription')}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <ScanFace className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-950">{t('steps.analysisTitle')}</h2>
              <p className="text-sm text-gray-600">{t('steps.analysisDescription')}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <Sparkles className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-950">{t('steps.reportTitle')}</h2>
              <p className="text-sm text-gray-600">{t('steps.reportDescription')}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <Shield className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-950">{t('steps.privacyTitle')}</h2>
              <p className="text-sm text-gray-600">{t('steps.privacyDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
