import type { Metadata } from 'next'
import type { Locale } from '@/i18n'
import { generateI18nSEO } from '@/lib/seo'

export function normalizeSearchToToolUrl(value: string | URL | null | undefined): string | URL | undefined {
  if (!value) return undefined
  const raw = value instanceof URL ? value.toString() : value
  return raw.replace(/^(https?:\/\/[^/]+)\/{2,}/, '$1/')
}

/**
 * Search→Tool SEO wrapper.
 *
 * Preview environments have historically allowed NEXT_PUBLIC_SITE_URL to end
 * with `/`. The shared SEO helper then produces `https://host//locale/...` for
 * canonical/hreflang URLs. Normalize the index-critical URLs here so this
 * rollout cannot amplify malformed alternates while the broader SEO helper is
 * cleaned up separately.
 */
export function generateSearchToToolSEO(args: {
  locale: Locale
  title: string
  description: string
  pathname: string
  noIndex?: boolean
  availableLocales?: readonly Locale[]
}): Metadata {
  const metadata = generateI18nSEO(args)
  const languages = metadata.alternates?.languages

  return {
    ...metadata,
    alternates: metadata.alternates
      ? {
          ...metadata.alternates,
          canonical: normalizeSearchToToolUrl(metadata.alternates.canonical as string | URL | undefined),
          languages: languages
            ? Object.fromEntries(
                Object.entries(languages).map(([locale, url]) => [
                  locale,
                  normalizeSearchToToolUrl(url as string | URL) as string,
                ]),
              )
            : undefined,
        }
      : undefined,
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          url: normalizeSearchToToolUrl(metadata.openGraph.url as string | URL | undefined),
        }
      : undefined,
  }
}
