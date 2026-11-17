import type { Metadata } from 'next'
import { getBlogArticleLocales } from '@/lib/blog'
import { generateI18nSEO, SITE_CONFIG } from '@/lib/seo'

type SeoInput = Parameters<typeof generateI18nSEO>[0]

/**
 * Published article indexing policy. Untranslated locale-shell URLs remain
 * 200/accessible, but defer their canonical and hreflang to the English owner.
 * No redirect/noindex: let search engines consolidate duplicate signals.
 */
export function generateBlogArticleSEO(input: SeoInput): Metadata {
  const pathname = input.pathname || ''
  if (!pathname.startsWith('/blog/')) {
    throw new Error('generateBlogArticleSEO requires an article /blog/ pathname')
  }

  const articleLocales = getBlogArticleLocales(pathname.slice('/blog/'.length))
  const metadata = generateI18nSEO({ ...input, availableLocales: articleLocales })

  if (articleLocales.length > 1 || input.locale === 'en') {
    return metadata
  }

  const englishUrl = new URL(`/en${pathname}`, SITE_CONFIG.url).toString()
  return {
    ...metadata,
    alternates: {
      canonical: englishUrl,
      languages: { en: englishUrl, 'x-default': englishUrl },
    },
    openGraph: {
      ...metadata.openGraph,
      url: englishUrl,
      locale: 'en_US',
      alternateLocale: [],
    },
  }
}
