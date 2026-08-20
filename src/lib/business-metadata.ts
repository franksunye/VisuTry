import type { Metadata } from 'next'
import { businessPages, type BusinessPageKey } from '@/config/business-site'

const siteUrl = 'https://www.visutry.com'

const metadataOverrides: Partial<Record<BusinessPageKey, { title: string; description: string }>> = {
  overview: {
    title: 'AI Commerce for Eyewear Brands & Agencies | VisuTry',
    description: 'Turn eyewear catalogs and campaign traffic into guided AI shopping experiences for brand, commerce, and agency teams with recommendation, virtual try-on, comparison, and measurable shopper intent.',
  },
  campaigns: {
    title: 'AI Shopping Campaigns for Eyewear Brands & Agencies | VisuTry',
    description: 'Create focused AI shopping experiences for eyewear campaigns, collections, audiences, traffic sources, creator stories, and media briefs while preserving merchant product truth.',
  },
}

export function businessPageMetadata(locale: string, pageKey: BusinessPageKey): Metadata {
  const page = businessPages[pageKey]
  const url = `${siteUrl}/${locale}${page.slug}`
  const override = metadataOverrides[pageKey]
  const title = override?.title ?? page.metaTitle
  const description = override?.description ?? page.metaDescription

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
