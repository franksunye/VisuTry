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
  {
    slug: 'best-ai-virtual-glasses-tryon-tools-2025',
    title: 'Best AI Virtual Glasses Try-On Tools in 2025 - Complete Comparison',
    description: 'Comprehensive review of the top AI-powered virtual glasses try-on tools in 2025. Compare features, accuracy, and user experience to find the perfect solution for online eyewear shopping.',
    publishedAt: '2025-10-20T10:00:00Z',
    modifiedAt: '2025-10-20T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Technology',
    readTime: '8 min read',
    tags: ['Virtual Try-On', 'AI Technology', 'Product Comparison', 'Shopping Guide'],
    isPublished: true,
  },
  {
    slug: 'rayban-glasses-virtual-tryon-guide',
    title: 'Ray-Ban Glasses Virtual Try-On Guide 2025 - Find Your Perfect Style',
    description: 'Complete guide to Ray-Ban glasses styles with virtual try-on. Explore iconic Wayfarer, Clubmaster, and Aviator frames. Try them on virtually before you buy.',
    publishedAt: '2025-10-21T10:00:00Z',
    modifiedAt: '2025-10-21T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Brand Guide',
    readTime: '10 min read',
    tags: ['Ray-Ban', 'Designer Glasses', 'Virtual Try-On', 'Style Guide'],
    isPublished: true,
  },
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
