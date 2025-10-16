import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getBlogSitemapEntries } from '@/lib/blog'

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

  // Dynamic user public pages
  let userPages: MetadataRoute.Sitemap = []
  try {
    // Get users with public pages
    const publicUsers = await prisma.user.findMany({
      where: {
        // Add conditions here, e.g., users who chose to make their profile public
        // isPublic: true,
        // or users with public try-on records
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      take: 1000, // Limit to avoid sitemap being too large
    })

    userPages = publicUsers.map(user => ({
      url: `${baseUrl}/user/${user.name}`,
      lastModified: user.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  } catch (error) {
    console.log('Unable to fetch user pages, skipping user sitemap generation')
    userPages = []
  }

  // Dynamic try-on share pages (public share pages)
  let sharePages: MetadataRoute.Sitemap = []
  try {
    // Get public try-on share pages
    const publicShares = await prisma.tryOnTask.findMany({
      where: {
        // isPublic: true, // Commented out temporarily as the model may not have this field
        // Add conditions based on actual requirements
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 100, // Limit to avoid sitemap being too large
    })

    sharePages = publicShares.map(share => ({
      url: `${baseUrl}/share/${share.id}`,
      lastModified: share.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.log('Unable to fetch share pages, skipping share sitemap generation')
    sharePages = []
  }

  // Merge all pages
  return [
    ...staticPages,
    ...blogPages,
    ...userPages,
    ...sharePages,
  ]
}

// Optional: Configure sitemap revalidation frequency
export const revalidate = 3600 // Regenerate every hour
