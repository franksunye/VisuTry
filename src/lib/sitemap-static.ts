import type { SitemapEntry } from '@/lib/sitemap-xml'
import { locales } from '@/i18n'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { FACE_SHAPE_COMPARISON_SLUGS } from '@/config/face-shape-comparisons'
import { CURATED_BRAND_SLUGS } from '@/config/brand-try-on-content'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import { getVisualSeoAssetsForPage } from '@/config/visual-seo-assets'

export function buildSitemapAlternates(baseUrl: string, path: string): Record<string, string> {
  const alternates: Record<string, string> = {}
  locales.forEach((locale) => {
    alternates[locale] = `${baseUrl}/${locale}${path}`
  })
  alternates['x-default'] = `${baseUrl}/en${path}`
  return alternates
}

function visualSeoImages(baseUrl: string, path: string): string[] | undefined {
  const assets = getVisualSeoAssetsForPage(path)
  return assets.length > 0 ? assets.map((asset) => `${baseUrl}${asset.publicPath}`) : undefined
}

export function buildCoreSitemapEntries(baseUrl: string): SitemapEntry[] {
  const staticPagePaths = [
    { path: '', priority: 1, changeFrequency: 'daily' },
    { path: '/face-analysis', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/face-shape-detector', priority: 1, changeFrequency: 'weekly' },
    { path: '/glasses-for-face-shape', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/sunglasses-for-face-shape', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/try-on/glasses', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/what-is-my-face-shape', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/what-glasses-suit-my-face', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/find-glasses-for-my-face', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/virtual-glasses-try-on', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/try-glasses-on-photo', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/compare-glasses-frames', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/ai-glasses-advisor', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/glasses-guide', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/store', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/business', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/discover', priority: 0.8, changeFrequency: 'daily' },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/refund', priority: 0.5, changeFrequency: 'monthly' },
  ]
  const englishOnlyStaticPagePaths = [
    { path: '/face-shape-measurement', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/face-shapes', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/hairstyles-for-face-shape', priority: 0.85, changeFrequency: 'weekly' },
  ]
  const localizedSunglassesPaths = FACE_SHAPE_SLUGS.map((slug) => `/sunglasses-for/${slug}-face`)
  const localizedOrdinaryGlassesPaths = FACE_SHAPE_SLUGS.map((slug) => `/style/${slug}-face`)
  const staticFaceShapePaths = FACE_SHAPE_SLUGS.flatMap((slug) => [
    `/face-shapes/${slug}`,
    `/hairstyles-for/${slug}-face`,
  ]).concat(FACE_SHAPE_COMPARISON_SLUGS.map((slug) => `/face-shapes/compare/${slug}`))
  const combinationSearchPaths = COMBINATION_SEARCH_PAGES.map((page) => `/glasses-guide/${page.slug}`)
  const entries: SitemapEntry[] = []

  staticPagePaths.forEach(({ path, priority, changeFrequency }) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        changeFrequency,
        priority,
        alternates: { languages: buildSitemapAlternates(baseUrl, path) },
        ...(locale === 'en' && visualSeoImages(baseUrl, path) ? { images: visualSeoImages(baseUrl, path) } : {}),
      })
    })
  })

  englishOnlyStaticPagePaths.forEach(({ path, priority, changeFrequency }) => {
    entries.push({
      url: `${baseUrl}/en${path}`,
      changeFrequency,
      priority,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
    })
  })

  localizedSunglassesPaths.forEach((path) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: buildSitemapAlternates(baseUrl, path) },
      })
    })
  })

  localizedOrdinaryGlassesPaths.forEach((path) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: buildSitemapAlternates(baseUrl, path) },
        ...(locale === 'en' && visualSeoImages(baseUrl, path) ? { images: visualSeoImages(baseUrl, path) } : {}),
      })
    })
  })

  staticFaceShapePaths.forEach((path) => {
    const images = visualSeoImages(baseUrl, path)
    entries.push({
      url: `${baseUrl}/en${path}`,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
      ...(images ? { images } : {}),
    })
  })

  combinationSearchPaths.forEach((path) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: buildSitemapAlternates(baseUrl, path) },
      })
    })
  })

  CURATED_BRAND_SLUGS.forEach((brand) => {
    const path = `/brand/${brand}`
    entries.push({
      url: `${baseUrl}/en${path}`,
      lastModified: new Date('2026-08-10T00:00:00Z'),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
    })
  })

  return entries
}
