import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getBlogSitemapEntries } from '@/lib/blog'
import { slugify } from '@/lib/programmatic-seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/try-on`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Legal pages
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic blog post pages
  const blogPages: MetadataRoute.Sitemap = await getBlogSitemapEntries()

  // Dynamic product pages (frames)
  let productPages: MetadataRoute.Sitemap = []
  try {
    const frames = await prisma.glassesFrame.findMany({
      where: { isActive: true },
      select: { brand: true, model: true, updatedAt: true },
    })
    productPages = frames.map(frame => ({
      url: `${baseUrl}/try/${slugify(frame.brand || '')}-${slugify(frame.model || '')}`,
      lastModified: frame.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.log('Unable to fetch product pages, skipping product sitemap generation')
  }

  // Dynamic face shape pages
  let faceShapePages: MetadataRoute.Sitemap = []
  try {
    const shapes = await prisma.faceShape.findMany({
      select: { name: true, updatedAt: true },
    })
    faceShapePages = shapes.map(shape => ({
      url: `${baseUrl}/style/${slugify(shape.name)}`,
      lastModified: shape.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.log('Unable to fetch face shape pages, skipping face shape sitemap generation')
  }

  // Dynamic category pages
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categories = await prisma.glassesCategory.findMany({
      select: { name: true, updatedAt: true },
    })
    categoryPages = categories.map(category => ({
      url: `${baseUrl}/category/${slugify(category.name)}`,
      lastModified: category.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.log('Unable to fetch category pages, skipping category sitemap generation')
  }

  // Dynamic brand pages
  let brandPages: MetadataRoute.Sitemap = []
  try {
    const brands = await prisma.glassesFrame.findMany({
      where: { isActive: true },
      distinct: ['brand'],
      select: { brand: true, updatedAt: true },
    })
    brandPages = brands
      .filter((b): b is { brand: string; updatedAt: Date } => b.brand !== null && b.brand !== undefined)
      .map(brand => ({
        url: `${baseUrl}/brand/${slugify(brand.brand)}`,
        lastModified: brand.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
  } catch (error) {
    console.log('Unable to fetch brand pages, skipping brand sitemap generation')
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
