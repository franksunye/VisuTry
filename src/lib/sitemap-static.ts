import type { SitemapEntry } from '@/lib/sitemap-xml'
import { locales } from '@/i18n'
import { businessGuides } from '@/config/business-resources'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { FACE_SHAPE_COMPARISON_SLUGS } from '@/config/face-shape-comparisons'
import { CURATED_BRAND_SLUGS } from '@/config/brand-try-on-content'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import { getEditorialImagePaths } from '@/config/editorial-image-discovery'
import { VISUTRY_DEMO_FRAME_ROUTES } from '@/lib/visutry-demo-frame-routes'

export function buildSitemapAlternates(baseUrl: string, path: string): Record<string, string> {
  const alternates: Record<string, string> = {}
  locales.forEach((locale) => {
    alternates[locale] = `${baseUrl}/${locale}${path}`
  })
  alternates['x-default'] = `${baseUrl}/en${path}`
  return alternates
}

function editorialImages(baseUrl: string, path: string, locale = 'en'): Pick<SitemapEntry, 'images'> {
  const paths = getEditorialImagePaths(path, locale)
  return paths.length > 0 ? { images: paths.map((imagePath) => `${baseUrl}${imagePath}`) } : {}
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
    { path: '/discover', priority: 0.8, changeFrequency: 'daily' },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/refund', priority: 0.5, changeFrequency: 'monthly' },
  ]
  const englishOnlyStaticPagePaths = [
    { path: '/face-shape-measurement', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/face-shapes', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/hairstyles-for-face-shape', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/business', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/business/platform', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/business/store', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/business/campaigns', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/business/commerce-intelligence', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/business/pricing', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/business/examples', priority: 0.75, changeFrequency: 'weekly' },
    { path: '/business/integrations', priority: 0.65, changeFrequency: 'monthly' },
    { path: '/business/pilot', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/business/resources', priority: 0.65, changeFrequency: 'monthly' },
    ...businessGuides.map(({ path }) => ({ path, priority: 0.65, changeFrequency: 'monthly' as const })),
    ...VISUTRY_DEMO_FRAME_ROUTES.map(({ slug }) => ({ path: `/demo/frames/${slug}`, priority: 0.65, changeFrequency: 'monthly' as const })),
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
        ...editorialImages(baseUrl, path, locale),
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
        ...editorialImages(baseUrl, path, locale),
      })
    })
  })

  staticFaceShapePaths.forEach((path) => {
    entries.push({
      url: `${baseUrl}/en${path}`,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
      ...editorialImages(baseUrl, path),
    })
  })

  combinationSearchPaths.forEach((path) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: buildSitemapAlternates(baseUrl, path) },
        ...editorialImages(baseUrl, path, locale),
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
