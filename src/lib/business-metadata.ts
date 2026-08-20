import type { Metadata } from 'next'
import { businessPages, type BusinessPageKey } from '@/config/business-site'

const siteUrl = 'https://www.visutry.com'

export function businessPageMetadata(locale: string, pageKey: BusinessPageKey): Metadata {
  const page = businessPages[pageKey]
  const url = `${siteUrl}/${locale}${page.slug}`

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url,
      siteName: 'VisuTry',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: page.metaTitle,
      description: page.metaDescription,
    },
  }
}
