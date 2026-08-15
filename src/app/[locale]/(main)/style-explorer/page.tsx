import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { StyleExplorerGate } from '@/components/style-explorer/StyleExplorerGate'
import { RouteMessagesProvider } from '@/components/i18n/RouteMessagesProvider'

interface StyleExplorerPageProps {
  params: { locale: string }
  searchParams?: {
    source?: string | string[]
    taskId?: string | string[]
  }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: StyleExplorerPageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.styleExplorer' })
  const canonical = `https://www.visutry.com/${params.locale}/style-explorer`
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonical,
      type: 'website',
      images: [
        {
          url: 'https://www.visutry.com/assets/marketing/style-explorer-female-results.jpg',
          width: 1536,
          height: 1024,
          alt: t('ogImageAlt'),
        },
      ],
    },
  }
}

export default function StyleExplorerPage({ params, searchParams }: StyleExplorerPageProps) {
  setRequestLocale(params.locale)
  const source = typeof searchParams?.source === 'string' ? searchParams.source : null
  const taskId = typeof searchParams?.taskId === 'string' ? searchParams.taskId : null
  const faceAnalysisTaskId = source === 'face-analysis' && taskId ? taskId : null
  const callbackParams = new URLSearchParams()

  if (faceAnalysisTaskId) {
    callbackParams.set('source', 'face-analysis')
    callbackParams.set('taskId', faceAnalysisTaskId)
  }

  const callbackQuery = callbackParams.toString()
  const callbackUrl = `/${params.locale}/style-explorer${callbackQuery ? `?${callbackQuery}` : ''}`
  const signInHref = `/${params.locale}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return (
    <RouteMessagesProvider namespaces={['marketing.styleExplorer']}>
      <StyleExplorerGate
        locale={params.locale}
        signInHref={signInHref}
        faceAnalysisTaskId={faceAnalysisTaskId}
      />
    </RouteMessagesProvider>
  )
}
