import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getBlogSitemapEntries } from '@/lib/blog'
import { slugify } from '@/lib/programmatic-seo'
import { locales } from '@/i18n'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { FACE_SHAPE_COMPARISON_SLUGS } from '@/config/face-shape-comparisons'
import { CURATED_BRAND_SLUGS, isCuratedBrandSlug } from '@/config/brand-try-on-content'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import { getVisualSeoAssetsForPage } from '@/config/visual-seo-assets'
import { buildPublicExperienceSitemapEntries } from '@/lib/store-discovery-sitemap'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com').replace(/\/+$/, '')
  const programmaticEnabled = process.env.PROGRAMMATIC_SEO_ENABLED === 'true'

  const generateAlternates = (path: string) => {
    const alternates: { [key: string]: string } = {}
    locales.forEach(locale => {
      alternates[locale] = `${baseUrl}/${locale}${path}`
    })
    alternates['x-default'] = `${baseUrl}/en${path}`
    return alternates
  }

  const visualSeoImages = (path: string) => {
    const assets = getVisualSeoAssetsForPage(path)
    return assets.length > 0 ? assets.map((asset) => `${baseUrl}${asset.publicPath}`) : undefined
  }

  const staticPagePaths = [
    { path: '', priority: 1, changeFrequency: 'daily' as const },
    { path: '/face-analysis', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/face-shape-detector', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/glasses-for-face-shape', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/sunglasses-for-face-shape', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/try-on/glasses', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/what-is-my-face-shape', priority: 0.95, changeFrequency: 'weekly' as const },
    { path: '/what-glasses-suit-my-face', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/find-glasses-for-my-face', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/virtual-glasses-try-on', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/try-glasses-on-photo', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/compare-glasses-frames', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/ai-glasses-advisor', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/glasses-guide', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/pricing', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/store', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/business', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/discover', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/refund', priority: 0.5, changeFrequency: 'monthly' as const },
  ]
  const englishOnlyStaticPagePaths = [
    { path: '/face-shape-measurement', priority: 0.85, changeFrequency: 'monthly' as const },
    { path: '/face-shapes', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/hairstyles-for-face-shape', priority: 0.85, changeFrequency: 'weekly' as const },
  ]
  const localizedSunglassesPaths = FACE_SHAPE_SLUGS.map((slug) => `/sunglasses-for/${slug}-face`)
  const localizedOrdinaryGlassesPaths = FACE_SHAPE_SLUGS.map((slug) => `/style/${slug}-face`)
  const staticFaceShapePaths = FACE_SHAPE_SLUGS.flatMap((slug) => [
    `/face-shapes/${slug}`,
    `/hairstyles-for/${slug}-face`,
  ]).concat(FACE_SHAPE_COMPARISON_SLUGS.map((slug) => `/face-shapes/compare/${slug}`))
  const combinationSearchPaths = COMBINATION_SEARCH_PAGES.map((page) => `/glasses-guide/${page.slug}`)

  const staticPages: MetadataRoute.Sitemap = []
  staticPagePaths.forEach(({ path, priority, changeFrequency }) => {
    locales.forEach(locale => {
      staticPages.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: { languages: generateAlternates(path) },
        ...(locale === 'en' && visualSeoImages(path) ? { images: visualSeoImages(path) } : {}),
      })
    })
  })
  englishOnlyStaticPagePaths.forEach(({ path, priority, changeFrequency }) => {
    staticPages.push({
      url: `${baseUrl}/en${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
    })
  })
  localizedSunglassesPaths.forEach((path) => {
    locales.forEach((locale) => {
      staticPages.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: generateAlternates(path) },
      })
    })
  })
  localizedOrdinaryGlassesPaths.forEach((path) => {
    locales.forEach((locale) => {
      staticPages.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: generateAlternates(path) },
        ...(locale === 'en' && visualSeoImages(path) ? { images: visualSeoImages(path) } : {}),
      })
    })
  })
  staticFaceShapePaths.forEach((path) => {
    const images = visualSeoImages(path)
    staticPages.push({
      url: `${baseUrl}/en${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
      ...(images ? { images } : {}),
    })
  })
  combinationSearchPaths.forEach((path) => {
    locales.forEach((locale) => {
      staticPages.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: generateAlternates(path) },
      })
    })
  })

  const blogPagesBase: MetadataRoute.Sitemap = await getBlogSitemapEntries()
  const blogPages: MetadataRoute.Sitemap = []
  blogPagesBase.forEach(page => {
    const path = page.url.replace(baseUrl, '')
    const blogLocales = path === '/blog/rayban-glasses-virtual-tryon-guide' ? ['en'] : locales
    blogLocales.forEach(locale => {
      blogPages.push({
        ...page,
        url: `${baseUrl}/${locale}${path}`,
        alternates: {
          languages: path === '/blog/rayban-glasses-virtual-tryon-guide'
            ? { en: `${baseUrl}/en${path}` }
            : generateAlternates(path),
        },
      })
    })
  })

  const curatedBrandPages: MetadataRoute.Sitemap = CURATED_BRAND_SLUGS.map(brand => {
    const path = `/brand/${brand}`
    return {
      url: `${baseUrl}/en${path}`,
      lastModified: new Date('2026-08-10T00:00:00Z'),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
    }
  })

  let productPages: MetadataRoute.Sitemap = []
  if (programmaticEnabled) {
    try {
      const frames = await prisma.glassesFrame.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
      })
      frames.forEach(frame => {
        const path = `/try/${frame.id}`
        locales.forEach(locale => {
          productPages.push({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: frame.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
            alternates: { languages: generateAlternates(path) },
          })
        })
      })
    } catch (error) {
      console.log('Unable to fetch product pages, skipping product sitemap generation')
    }
  }

  let faceShapePages: MetadataRoute.Sitemap = []
  if (programmaticEnabled) {
    try {
      const shapes = await prisma.faceShape.findMany({
        select: { name: true, updatedAt: true },
      })
      shapes.forEach(shape => {
        const path = `/style/${slugify(shape.name)}`
        faceShapePages.push({
          url: `${baseUrl}/en${path}`,
          lastModified: shape.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: { languages: { en: `${baseUrl}/en${path}` } },
        })
      })
    } catch (error) {
      console.log('Unable to fetch face shape pages, skipping face shape sitemap generation')
    }
  }

  let categoryPages: MetadataRoute.Sitemap = []
  if (programmaticEnabled) {
    try {
      const categories = await prisma.glassesCategory.findMany({
        select: { name: true, updatedAt: true },
      })
      categories.forEach(category => {
        const path = `/category/${slugify(category.name)}`
        locales.forEach(locale => {
          categoryPages.push({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: category.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
            alternates: { languages: generateAlternates(path) },
          })
        })
      })
    } catch (error) {
      console.log('Unable to fetch category pages, skipping category sitemap generation')
    }
  }

  let brandPages: MetadataRoute.Sitemap = []
  if (programmaticEnabled) {
    try {
      const brands = await prisma.glassesFrame.findMany({
        where: { isActive: true },
        distinct: ['brand'],
        select: { brand: true, updatedAt: true },
      })
      brands
        .filter((b): b is { brand: string; updatedAt: Date } => b.brand !== null && b.brand !== undefined)
        .forEach(brand => {
          const path = `/brand/${slugify(brand.brand)}`
          if (isCuratedBrandSlug(slugify(brand.brand))) return
          locales.forEach(locale => {
            brandPages.push({
              url: `${baseUrl}/${locale}${path}`,
              lastModified: brand.updatedAt,
              changeFrequency: 'monthly' as const,
              priority: 0.6,
              alternates: { languages: generateAlternates(path) },
            })
          })
        })
    } catch (error) {
      console.log('Unable to fetch brand pages, skipping brand page generation')
    }
  }

  let userPages: MetadataRoute.Sitemap = []
  let sharePages: MetadataRoute.Sitemap = []

  let publicExperiencePages: MetadataRoute.Sitemap = []
  try {
    const merchants = await prisma.merchant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        slug: true,
        name: true,
        websiteUrl: true,
        pilotType: true,
        referenceData: true,
        sponsoredUsagePolicyKey: true,
        updatedAt: true,
        experiences: {
          where: { type: { in: ['STORE', 'CAMPAIGN'] } },
          orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
          select: {
            type: true,
            slug: true,
            name: true,
            status: true,
            headline: true,
            description: true,
            referenceData: true,
            updatedAt: true,
            frames: {
              where: {
                active: true,
                merchantFrame: { status: 'ACTIVE' },
              },
              select: {
                merchantFrame: { select: { productUrl: true, updatedAt: true } },
              },
            },
          },
        },
      },
    })

    publicExperiencePages = buildPublicExperienceSitemapEntries({
      baseUrl,
      merchants: merchants.map((merchant) => ({
        ...merchant,
        experiences: merchant.experiences.map((experience) => ({
          ...experience,
          frames: experience.frames.map((frame) => frame.merchantFrame),
        })),
      })),
    })
  } catch (error) {
    console.log('Unable to fetch public Store/Campaign pages, skipping discovery sitemap entries')
  }

  return [
    ...staticPages,
    ...blogPages,
    ...curatedBrandPages,
    ...productPages,
    ...faceShapePages,
    ...categoryPages,
    ...brandPages,
    ...publicExperiencePages,
    ...userPages,
    ...sharePages,
  ]
}

export const revalidate = 3600
