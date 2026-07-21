import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { generateI18nSEO } from '@/lib/seo'
import { Locale } from '@/i18n'
import { FaceAnalysisLanding } from '@/components/face-analysis/FaceAnalysisLanding'
import { FaceAnalysisGate } from '@/components/face-analysis/FaceAnalysisGate'

type Props = {
  params: { locale: string }
}

export const dynamic = 'force-static'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  setRequestLocale(params.locale)
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
  setRequestLocale(params.locale)
  const t = await getTranslations('common')

  return (
    <FaceAnalysisGate
      landing={<FaceAnalysisLanding locale={params.locale} />}
      loadingText={t('loading')}
    />
  )
}
