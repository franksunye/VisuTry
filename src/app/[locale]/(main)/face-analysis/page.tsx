import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { generateI18nSEO } from '@/lib/seo'
import { Locale } from '@/i18n'
import { FaceAnalysisInterface } from '@/components/face-analysis/FaceAnalysisInterface'
import { FaceAnalysisLanding } from '@/components/face-analysis/FaceAnalysisLanding'
import { Suspense } from 'react'

type Props = {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'faceAnalysis.meta' })

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: t('title'),
    description: t('description'),
    image: '/assets/marketing/face-analysis-landing-art.jpg',
    imageWidth: 1536,
    imageHeight: 1024,
    pathname: '/face-analysis',
  })
}

export default async function FaceAnalysisPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('common')

  if (!session) {
    return <FaceAnalysisLanding locale={params.locale} />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center py-12 text-gray-500">{t('loading')}</div>}>
        <FaceAnalysisInterface />
      </Suspense>
    </div>
  )
}
