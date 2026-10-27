import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { StyleExplorerHandoffGate } from '@/components/style-explorer/StyleExplorerHandoffGate'
import { RouteMessagesProvider } from '@/components/i18n/RouteMessagesProvider'

interface StyleExplorerPageProps {
  params: { locale: string }
}

// Marketing must not invoke a server function for every anonymous visit.
// URL query context is resolved after hydration in a client-only effect.
export const dynamic = 'force-static'

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

export default function StyleExplorerPage({ params }: StyleExplorerPageProps) {
  setRequestLocale(params.locale)
  return (
    <RouteMessagesProvider namespaces={['marketing.styleExplorer']}>
      <StyleExplorerHandoffGate locale={params.locale} />
    </RouteMessagesProvider>
  )
}
