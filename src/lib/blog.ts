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
  coverImage: string
}

// Static blog posts list (can be fetched from database in the future)
export const staticBlogPosts: BlogPost[] = [
  {
    slug: 'ai-face-analysis-for-glasses-guide',
    title: 'AI Face Analysis for Glasses - How to Find Frames That Fit Your Face Shape',
    description: 'Learn how AI face analysis helps identify your face shape, narrow down glasses styles, and use virtual try-on to choose frames with more confidence.',
    publishedAt: '2026-06-08T10:00:00Z',
    modifiedAt: '2026-06-12T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Face Shape Guide',
    readTime: '8 min read',
    tags: ['AI Face Analysis', 'Face Shape', 'Glasses Selection', 'Virtual Try-On'],
    isPublished: true,
    coverImage: '/blog-covers/face-shape-guide.jpg',
  },
  {
    slug: 'how-to-choose-glasses-for-your-face',
    title: 'How to Choose the Right Glasses for Your Face Shape? Complete Guide',
    description: 'Learn how to choose glasses for your face shape, use AI face analysis for a clearer starting point, and confirm frame choices with virtual try-on.',
    publishedAt: '2025-10-12T10:00:00Z',
    modifiedAt: '2026-06-12T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Glasses Guide',
    readTime: '5 min read',
    tags: ['Face Shape', 'Glasses Selection', 'Style Guide'],
    isPublished: true,
    coverImage: '/blog-covers/face-shape-guide.jpg',
  },
  {
    slug: 'best-ai-virtual-glasses-tryon-tools-2025',
    title: 'AI Virtual Try-On Tools in 2026 - What Actually Matters',
    description: 'A practical 2026 guide to choosing virtual try-on tools for eyewear, including photo-based AI, real-time AR, catalog coverage, privacy, and shopping workflow fit.',
    publishedAt: '2025-10-14T10:00:00Z',
    modifiedAt: '2026-06-12T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Technology',
    readTime: '8 min read',
    tags: ['Virtual Try-On', 'AI Technology', 'Eyewear Ecommerce', 'Shopping Guide'],
    isPublished: true,
    coverImage: '/blog-covers/ai-virtual-tryon-tools-2026.jpg',
  },
  {
    slug: 'rayban-glasses-virtual-tryon-guide',
    title: 'Ray-Ban Glasses Virtual Try-On Guide 2025 - Find Your Perfect Style',
    description: 'Complete guide to Ray-Ban glasses styles with virtual try-on. Explore iconic Wayfarer, Clubmaster, and Aviator frames. Try them on virtually before you buy.',
    publishedAt: '2025-10-16T10:00:00Z',
    modifiedAt: '2025-10-16T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Brand Guide',
    readTime: '10 min read',
    tags: ['Ray-Ban', 'Designer Glasses', 'Virtual Try-On', 'Style Guide'],
    isPublished: true,
    coverImage: '/blog-covers/rayban-guide.jpg',
  },
  {
    slug: 'celebrity-glasses-style-guide-2025',
    title: 'Celebrity Glasses Style Guide 2025 - Get the Iconic Look',
    description: 'Discover how celebrities like Cindy Crawford and Joan Smalls rock their eyewear. Get inspired by iconic glasses styles and learn how to recreate celebrity looks.',
    publishedAt: '2025-10-18T14:00:00Z',
    modifiedAt: '2025-10-18T14:00:00Z',
    author: 'VisuTry Team',
    category: 'Celebrity Style',
    readTime: '9 min read',
    tags: ['Celebrity Style', 'Fashion Trends', 'Style Inspiration', 'Eyewear Fashion', 'Virtual Try-On'],
    isPublished: true,
    coverImage: '/blog-covers/celebrity-style.jpg',
  },
  {
    slug: 'oliver-peoples-finley-vintage-review',
    title: 'Oliver Peoples Finley Vintage Review: Face Shape Fit & Try-On',
    description: 'Oliver Peoples Finley Vintage review with face-shape fit advice, frame sizing notes, and virtual glasses try-on guidance before you buy.',
    publishedAt: '2025-10-20T15:00:00Z',
    modifiedAt: '2026-06-12T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Product Review',
    readTime: '8 min read',
    tags: ['Oliver Peoples', 'Luxury Eyewear', 'Product Review', 'Designer Glasses', 'Premium Frames'],
    isPublished: true,
    coverImage: '/blog-covers/oliver-peoples-review.jpg',
  },
  {
    slug: 'tom-ford-luxury-eyewear-guide-2025',
    title: 'Tom Ford Luxury Eyewear Guide 2025 - Ultimate Style & Quality',
    description: 'Explore Tom Ford luxury eyeglasses collection. Discover iconic styles, premium craftsmanship, and why Tom Ford frames are the ultimate status symbol.',
    publishedAt: '2025-10-22T16:00:00Z',
    modifiedAt: '2025-10-22T16:00:00Z',
    author: 'VisuTry Team',
    category: 'Luxury Brands',
    readTime: '7 min read',
    tags: ['Tom Ford', 'Luxury Eyewear', 'Designer Glasses', 'Premium Frames', 'Fashion'],
    isPublished: true,
    coverImage: '/blog-covers/tom-ford-luxury.jpg',
  },
  {
    slug: 'acetate-vs-plastic-eyeglass-frames-guide',
    title: 'Acetate vs Plastic Eyeglass Frames 2025 - Complete Comparison',
    description: 'Discover the key differences between acetate and plastic eyeglass frames. Learn about durability, comfort, style, and which material is best for your needs.',
    publishedAt: '2025-10-24T17:00:00Z',
    modifiedAt: '2025-10-24T17:00:00Z',
    author: 'VisuTry Team',
    category: 'Materials Guide',
    readTime: '7 min read',
    tags: ['Eyeglass Materials', 'Frame Guide', 'Acetate Frames', 'Buying Guide', 'Eyewear Education'],
    isPublished: true,
    coverImage: '/blog-covers/acetate-vs-plastic.jpg',
  },
  {
    slug: 'browline-clubmaster-glasses-complete-guide',
    title: 'Browline/Clubmaster Glasses Complete Guide 2025 - Retro Revival',
    description: 'Discover the history, style, and modern appeal of browline/Clubmaster glasses. Learn why this retro style is making a major comeback in 2025.',
    publishedAt: '2025-10-26T18:00:00Z',
    modifiedAt: '2025-10-26T18:00:00Z',
    author: 'VisuTry Team',
    category: 'Style Guide',
    readTime: '8 min read',
    tags: ['Browline Glasses', 'Clubmaster', 'Retro Style', 'Vintage Eyewear', 'Fashion Trends'],
    isPublished: true,
    coverImage: '/blog-covers/browline-clubmaster.jpg',
  },
  {
    slug: 'prescription-glasses-online-shopping-guide-2025',
    title: 'How to Buy Prescription Glasses Online 2025 - Complete Guide',
    description: 'Learn how to safely buy prescription glasses online. Get tips on measuring PD, reading prescriptions, choosing lenses, and avoiding common mistakes.',
    publishedAt: '2025-10-28T19:00:00Z',
    modifiedAt: '2025-10-28T19:00:00Z',
    author: 'VisuTry Team',
    category: 'Shopping Guide',
    readTime: '10 min read',
    tags: ['Online Shopping', 'Prescription Glasses', 'Buying Guide', 'Eyewear Tips', 'How-To'],
    isPublished: true,
    coverImage: '/blog-covers/prescription-online-shopping.jpg',
  },
  {
    slug: 'best-glasses-for-face-shapes-guide',
    title: 'Best Glasses for Different Face Shapes - Complete Guide 2025',
    description: 'Comprehensive guide to finding the best glasses for your face shape. Learn which frame styles work best for round, square, oval, heart, and oblong faces.',
    publishedAt: '2025-11-02T11:00:00Z',
    modifiedAt: '2025-11-02T11:00:00Z',
    author: 'VisuTry Team',
    category: 'Style Guide',
    readTime: '8 min read',
    tags: ['Face Shape', 'Glasses Selection', 'Style Guide'],
    isPublished: false,
    coverImage: '/blog-covers/face-shape-guide.jpg',
  },
  {
    slug: 'prescription-glasses-virtual-tryon-guide',
    title: 'Prescription Glasses Virtual Try-On Guide - Find Your Perfect Fit Online',
    description: 'Complete guide to using virtual try-on tools for prescription glasses. Learn how to find the perfect fit online without visiting a store.',
    publishedAt: '2025-11-04T10:00:00Z',
    modifiedAt: '2025-11-04T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Virtual Try-On',
    readTime: '6 min read',
    tags: ['Virtual Try-On', 'Prescription', 'Buying Guide'],
    isPublished: true,
    coverImage: '/blog-covers/ai-virtual-tryon.jpg',
  },
  {
    slug: 'find-perfect-glasses-online-guide',
    title: 'How to Find Your Perfect Glasses Online - Step-by-Step Guide',
    description: 'Complete step-by-step guide to finding and buying the perfect glasses online. Learn how to choose frames, use virtual try-on, and make confident purchases.',
    publishedAt: '2025-11-06T12:00:00Z',
    modifiedAt: '2025-11-06T12:00:00Z',
    author: 'VisuTry Team',
    category: 'Shopping Guide',
    readTime: '7 min read',
    tags: ['Online Shopping', 'Glasses Guide', 'Virtual Try-On'],
    isPublished: true,
    coverImage: '/blog-covers/ai-virtual-tryon.jpg',
  },
  {
    slug: 'virtual-try-on-reduce-eyewear-returns',
    title: 'How Virtual Try-On Helps Online Eyewear Stores Reduce Returns',
    description: 'A practical guide for eyewear ecommerce teams on using virtual try-on to improve buyer confidence, set better expectations, and reduce avoidable frame-fit returns.',
    publishedAt: '2026-05-27T10:00:00Z',
    modifiedAt: '2026-05-27T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Ecommerce',
    readTime: '7 min read',
    tags: ['Eyewear Ecommerce', 'Virtual Try-On', 'Returns', 'Conversion Optimization'],
    isPublished: true,
    coverImage: '/blog-covers/virtual-try-on-reduce-returns.jpg',
  },
]

/**
 * Get all published blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  // Currently returns static articles, can be fetched from database in the future
  return staticBlogPosts
    .filter(post => post.isPublished)
    .sort((a, b) => {
      const dateA = new Date(a.modifiedAt || a.publishedAt).getTime()
      const dateB = new Date(b.modifiedAt || b.publishedAt).getTime()
      return dateB - dateA
    })
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com'

  return posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.modifiedAt || post.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
}
