/**
 * 博客内容管理工具
 * 支持静态文章和将来的动态文章
 */

export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  modifiedAt?: string
  author: string
  category: string
  readTime: string
  tags: string[]
  isPublished: boolean
}

// 静态博客文章列表（将来可以从数据库获取）
export const staticBlogPosts: BlogPost[] = [
  {
    slug: 'how-to-choose-glasses-for-your-face',
    title: '如何根据脸型选择适合的眼镜？完整指南',
    description: '详细解析不同脸型适合的眼镜款式，包括圆脸、方脸、长脸等专业建议。使用AI试戴工具找到最佳搭配。',
    publishedAt: '2025-10-15T10:00:00Z',
    modifiedAt: '2025-10-15T10:00:00Z',
    author: 'VisuTry团队',
    category: '眼镜指南',
    readTime: '5分钟',
    tags: ['脸型搭配', '眼镜选择', '时尚指南'],
    isPublished: true,
  },
  // 将来可以添加更多文章
]

/**
 * 获取所有已发布的博客文章
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  // 目前返回静态文章，将来可以从数据库获取
  return staticBlogPosts.filter(post => post.isPublished)
}

/**
 * 根据slug获取博客文章
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts()
  return posts.find(post => post.slug === slug) || null
}

/**
 * 获取博客文章的sitemap条目
 */
export async function getBlogSitemapEntries() {
  const posts = await getAllBlogPosts()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.vercel.app'
  
  return posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.modifiedAt || post.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
}
