/**
 * Blog content management utilities
 * Supports static articles and future dynamic articles
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

// Static blog posts list (can be fetched from database in the future)
export const staticBlogPosts: BlogPost[] = [
  {
    slug: 'how-to-choose-glasses-for-your-face',
    title: 'How to Choose the Right Glasses for Your Face Shape? Complete Guide',
    description: 'Detailed analysis of suitable glasses styles for different face shapes, including round, square, long faces and professional advice. Use AI try-on tools to find the best match.',
    publishedAt: '2025-10-15T10:00:00Z',
    modifiedAt: '2025-10-15T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Glasses Guide',
    readTime: '5 min read',
    tags: ['Face Shape', 'Glasses Selection', 'Style Guide'],
    isPublished: true,
  },
  // More articles can be added in the future
]

/**
 * Get all published blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  // Currently returns static articles, can be fetched from database in the future
  return staticBlogPosts.filter(post => post.isPublished)
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts()
  return posts.find(post => post.slug === slug) || null
}

/**
 * Get blog sitemap entries
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
