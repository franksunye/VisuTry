import type { Metadata } from 'next'
import { businessPages, type BusinessPageKey } from '@/config/business-site'

const siteUrl = 'https://www.visutry.com'

export function businessPageMetadata(locale: string, pageKey: BusinessPageKey): Metadata {
  const page = businessPages[pageKey]
  const url = `${siteUrl}/${locale}${page.slug}`
  const { metaTitle: title, metaDescription: description } = page

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'VisuTry',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}
