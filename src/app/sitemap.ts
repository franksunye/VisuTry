import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getBlogSitemapEntries } from '@/lib/blog'
import { slugify } from '@/lib/programmatic-seo'
import { locales } from '@/i18n'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { FACE_SHAPE_COMPARISON_SLUGS } from '@/config/face-shape-comparisons'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com'
  const programmaticEnabled = process.env.PROGRAMMATIC_SEO_ENABLED === 'true'

  // Helper function to generate alternate languages
  const generateAlternates = (path: string) => {
    const alternates: { [key: string]: string } = {}
    locales.forEach(locale => {
      alternates[locale] = `${baseUrl}/${locale}${path}`
    })
    alternates['x-default'] = `${baseUrl}/en${path}`
    return alternates
  }

  // Static pages with i18n support
  const staticPagePaths = [
    { path: '', priority: 1, changeFrequency: 'daily' as const },
    { path: '/face-analysis', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/face-shape-detector', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/glasses-for-face-shape', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/sunglasses-for-face-shape', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/try-on/glasses', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/pricing', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/store', priority: 0.6, changeFrequency: 'weekly' as const },
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
  const staticFaceShapePaths = FACE_SHAPE_SLUGS.flatMap((slug) => [
    `/face-shapes/${slug}`,
    `/style/${slug}-face`,
    `/hairstyles-for/${slug}-face`,
  ]).concat(FACE_SHAPE_COMPARISON_SLUGS.map((slug) => `/face-shapes/compare/${slug}`))

  // Generate static pages for all locales
  const staticPages: MetadataRoute.Sitemap = []
  staticPagePaths.forEach(({ path, priority, changeFrequency }) => {
    locales.forEach(locale => {
      staticPages.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: generateAlternates(path),
        },
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
  staticFaceShapePaths.forEach((path) => {
    staticPages.push({
      url: `${baseUrl}/en${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/en${path}` } },
    })
  })

  // Dynamic blog post pages (with i18n)
  const blogPagesBase: MetadataRoute.Sitemap = await getBlogSitemapEntries()
  const blogPages: MetadataRoute.Sitemap = []
  blogPagesBase.forEach(page => {
    // Extract path from URL
    const path = page.url.replace(baseUrl, '')
    locales.forEach(locale => {
      blogPages.push({
        ...page,
        url: `${baseUrl}/${locale}${path}`,
        alternates: {
          languages: generateAlternates(path),
        },
      })
    })
  })

  // Dynamic product pages (frames) with i18n
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
            alternates: {
              languages: generateAlternates(path),
            },
          })
        })
      })
    } catch (error) {
      console.log('Unable to fetch product pages, skipping product sitemap generation')
    }
  }

  // Dynamic face shape pages with i18n
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
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: { languages: { en: `${baseUrl}/en${path}` } },
        })
      })
    } catch (error) {
      console.log('Unable to fetch face shape pages, skipping face shape sitemap generation')
    }
  }

  // Dynamic category pages with i18n
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
            alternates: {
              languages: generateAlternates(path),
            },
          })
        })
      })
    } catch (error) {
      console.log('Unable to fetch category pages, skipping category sitemap generation')
    }
  }

  // Dynamic brand pages with i18n
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
          locales.forEach(locale => {
            brandPages.push({
              url: `${baseUrl}/${locale}${path}`,
              lastModified: brand.updatedAt,
              changeFrequency: 'monthly' as const,
              priority: 0.6,
              alternates: {
                languages: generateAlternates(path),
              },
            })
          })
        })
    } catch (error) {
      console.log('Unable to fetch brand pages, skipping brand sitemap generation')
    }
  }

  // Dynamic user public pages - DISABLED to prevent 404 errors
  // Reason: User pages are dynamic and may not exist, causing 404s in Google Search Console
  // Only enable when we have a proper "isPublic" field in the User model
  let userPages: MetadataRoute.Sitemap = []
  // try {
  //   const publicUsers = await prisma.user.findMany({
  //     where: {
  //       isPublic: true, // Only include users who explicitly made their profile public
  //     },
  //     select: {
  //       id: true,
  //       name: true,
  //       updatedAt: true,
  //     },
  //     take: 1000,
  //   })
  //   userPages = publicUsers.map(user => ({
  //     url: `${baseUrl}/user/${user.name}`,
  //     lastModified: user.updatedAt,
  //     changeFrequency: 'monthly' as const,
  //     priority: 0.5,
  //   }))
  // } catch (error) {
  //   console.log('Unable to fetch user pages, skipping user sitemap generation')
  //   userPages = []
  // }

  // Dynamic try-on share pages - DISABLED to prevent 404 errors
  // Reason: Share pages are dynamic and may not exist, causing 404s in Google Search Console
  // Only enable when we have a proper "isPublic" field in the TryOnTask model
  let sharePages: MetadataRoute.Sitemap = []
  // try {
  //   const publicShares = await prisma.tryOnTask.findMany({
  //     where: {
  //       isPublic: true, // Only include explicitly public shares
  //       status: 'COMPLETED', // Only include completed tasks
  //     },
  //     select: {
  //       id: true,
  //       updatedAt: true,
  //     },
  //     take: 100,
  //   })
  //   sharePages = publicShares.map(share => ({
  //     url: `${baseUrl}/share/${share.id}`,
  //     lastModified: share.updatedAt,
  //     changeFrequency: 'monthly' as const,
  //     priority: 0.6,
  //   }))
  // } catch (error) {
  //   console.log('Unable to fetch share pages, skipping share sitemap generation')
  //   sharePages = []
  // }

  // Merge all pages
  return [
    ...staticPages,
    ...blogPages,
    ...productPages,
    ...faceShapePages,
    ...categoryPages,
    ...brandPages,
    ...userPages,
    ...sharePages,
  ]
}

// Optional: Configure sitemap revalidation frequency
export const revalidate = 3600 // Regenerate every hour
