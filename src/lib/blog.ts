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
  {
    slug: 'celebrity-glasses-style-guide-2025',
    title: 'Celebrity Glasses Style Guide 2025 - Get the Iconic Look',
    description: 'Discover how celebrities like Cindy Crawford and Joan Smalls rock their eyewear. Get inspired by iconic glasses styles and learn how to recreate celebrity looks.',
    publishedAt: '2025-10-21T14:00:00Z',
    modifiedAt: '2025-10-21T14:00:00Z',
    author: 'VisuTry Team',
    category: 'Celebrity Style',
    readTime: '9 min read',
    tags: ['Celebrity Style', 'Fashion Trends', 'Style Inspiration', 'Eyewear Fashion', 'Virtual Try-On'],
    isPublished: true,
  },
  {
    slug: 'oliver-peoples-finley-vintage-review',
    title: 'Oliver Peoples Finley Vintage Review 2025 - Worth the Investment?',
    description: 'In-depth review of the iconic Oliver Peoples Finley Vintage eyeglasses. Discover quality, fit, style, and whether these luxury frames are worth the price.',
    publishedAt: '2025-10-21T15:00:00Z',
    modifiedAt: '2025-10-21T15:00:00Z',
    author: 'VisuTry Team',
    category: 'Product Review',
    readTime: '8 min read',
    tags: ['Oliver Peoples', 'Luxury Eyewear', 'Product Review', 'Designer Glasses', 'Premium Frames'],
    isPublished: true,
  },
  {
    slug: 'tom-ford-luxury-eyewear-guide-2025',
    title: 'Tom Ford Luxury Eyewear Guide 2025 - Ultimate Style & Quality',
    description: 'Explore Tom Ford luxury eyeglasses collection. Discover iconic styles, premium craftsmanship, and why Tom Ford frames are the ultimate status symbol.',
    publishedAt: '2025-10-21T16:00:00Z',
    modifiedAt: '2025-10-21T16:00:00Z',
    author: 'VisuTry Team',
    category: 'Luxury Brands',
    readTime: '7 min read',
    tags: ['Tom Ford', 'Luxury Eyewear', 'Designer Glasses', 'Premium Frames', 'Fashion'],
    isPublished: true,
  },
  {
    slug: 'acetate-vs-plastic-eyeglass-frames-guide',
    title: 'Acetate vs Plastic Eyeglass Frames 2025 - Complete Comparison',
    description: 'Discover the key differences between acetate and plastic eyeglass frames. Learn about durability, comfort, style, and which material is best for your needs.',
    publishedAt: '2025-10-21T17:00:00Z',
    modifiedAt: '2025-10-21T17:00:00Z',
    author: 'VisuTry Team',
    category: 'Materials Guide',
    readTime: '7 min read',
    tags: ['Eyeglass Materials', 'Frame Guide', 'Acetate Frames', 'Buying Guide', 'Eyewear Education'],
    isPublished: true,
  },
  {
    slug: 'browline-clubmaster-glasses-complete-guide',
    title: 'Browline/Clubmaster Glasses Complete Guide 2025 - Retro Revival',
    description: 'Discover the history, style, and modern appeal of browline/Clubmaster glasses. Learn why this retro style is making a major comeback in 2025.',
    publishedAt: '2025-10-21T18:00:00Z',
    modifiedAt: '2025-10-21T18:00:00Z',
    author: 'VisuTry Team',
    category: 'Style Guide',
    readTime: '8 min read',
    tags: ['Browline Glasses', 'Clubmaster', 'Retro Style', 'Vintage Eyewear', 'Fashion Trends'],
    isPublished: true,
  },
  {
    slug: 'prescription-glasses-online-shopping-guide-2025',
    title: 'How to Buy Prescription Glasses Online 2025 - Complete Guide',
    description: 'Learn how to safely buy prescription glasses online. Get tips on measuring PD, reading prescriptions, choosing lenses, and avoiding common mistakes.',
    publishedAt: '2025-10-21T19:00:00Z',
    modifiedAt: '2025-10-21T19:00:00Z',
    author: 'VisuTry Team',
    category: 'Shopping Guide',
    readTime: '10 min read',
    tags: ['Online Shopping', 'Prescription Glasses', 'Buying Guide', 'Eyewear Tips', 'How-To'],
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com'

  return posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.modifiedAt || post.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
}
