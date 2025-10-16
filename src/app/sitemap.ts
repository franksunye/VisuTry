import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getBlogSitemapEntries } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.vercel.app'
  
  // 静态页面
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

  // 动态博客文章页面
  const blogPages: MetadataRoute.Sitemap = await getBlogSitemapEntries()

  // 动态用户公开页面（如果有公开用户页面的话）
  let userPages: MetadataRoute.Sitemap = []
  try {
    // 获取有公开页面的用户（假设有 isPublic 字段）
    const publicUsers = await prisma.user.findMany({
      where: {
        // 这里可以添加条件，比如用户选择公开个人页面
        // isPublic: true,
        // 或者有公开试戴记录的用户
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      take: 1000, // 限制数量避免sitemap过大
    })

    userPages = publicUsers.map(user => ({
      url: `${baseUrl}/user/${user.name}`,
      lastModified: user.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  } catch (error) {
    console.log('无法获取用户页面，跳过用户sitemap生成')
    userPages = []
  }

  // 动态试戴分享页面（公开的分享页面）
  let sharePages: MetadataRoute.Sitemap = []
  try {
    // 获取公开的试戴分享页面
    const publicShares = await prisma.tryOnTask.findMany({
      where: {
        // isPublic: true, // 暂时注释，因为模型中可能没有这个字段
        // 可以根据实际需求添加条件
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 100, // 限制数量避免sitemap过大
    })

    sharePages = publicShares.map(share => ({
      url: `${baseUrl}/share/${share.id}`,
      lastModified: share.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.log('无法获取分享页面，跳过分享sitemap生成')
    sharePages = []
  }

  // 合并所有页面
  return [
    ...staticPages,
    ...blogPages,
    ...userPages,
    ...sharePages,
  ]
}

// 可选：配置sitemap的更新频率
export const revalidate = 3600 // 每小时重新生成一次
