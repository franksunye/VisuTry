/**
 * Blog content management utilities
 * Supports static articles and future dynamic articles
 */

import { blogArt } from '@/config/blog-art'
import { getAiGlassesAdvisorArticleCopy } from '@/config/ai-glasses-advisor-article-locales'

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
  coverAlt?: string
}

export const blogShareImage = '/blog-covers/visutry-social.jpg'

// Static blog posts list (can be fetched from database in the future)
export const staticBlogPosts: BlogPost[] = [
  {
    slug: 'eyewear-trends-2026-glasses-sunglasses',
    title: 'Eyewear Trends 2026: 16 Glasses and Sunglasses Styles to Try',
    description: 'Explore 16 defining eyewear styles for 2026, from timeless Wayfarers and refined optical frames to shield sunglasses, rimless geometry, and bold statement looks.',
    publishedAt: '2026-07-20T10:00:00Z',
    modifiedAt: '2026-07-20T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Eyewear Trends',
    readTime: '12 min read',
    tags: ['Eyewear Trends', 'Glasses Trends 2026', 'Sunglasses Trends', 'Style Explorer', 'Virtual Try-On'],
    isPublished: true,
    coverImage: blogArt['eyewear-trends-2026-glasses-sunglasses'].src,
    coverAlt: blogArt['eyewear-trends-2026-glasses-sunglasses'].alt,
  },
  {
    slug: 'ai-face-analysis-for-glasses-guide',
    title: 'Which Glasses Suit My Face? Free AI Face Shape Detector',
    description: 'Upload a photo to find your face shape free, see which glasses may suit your face, and continue to personalized AI frame advice or virtual try-on.',
    publishedAt: '2026-06-08T10:00:00Z',
    modifiedAt: '2026-07-27T04:00:00Z',
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
    title: 'Ray-Ban Virtual Try-On Guide: Compare Iconic Frame Styles',
    description: 'Compare Ray-Ban Wayfarer, Aviator, Clubmaster, round, and rectangular style directions on your photo, then confirm the exact model and fit before buying.',
    publishedAt: '2025-10-16T10:00:00Z',
    modifiedAt: '2026-07-27T10:00:00Z',
    author: 'VisuTry Team',
    category: 'Brand Guide',
    readTime: '7 min read',
    tags: ['Ray-Ban', 'Designer Glasses', 'Virtual Try-On', 'Style Guide'],
    isPublished: true,
    coverImage: blogArt['rayban-glasses-virtual-tryon-guide'].src,
    coverAlt: blogArt['rayban-glasses-virtual-tryon-guide'].alt,
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
    coverImage: blogArt['celebrity-glasses-style-guide-2025'].src,
    coverAlt: blogArt['celebrity-glasses-style-guide-2025'].alt,
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
    coverImage: blogArt['oliver-peoples-finley-vintage-review'].src,
    coverAlt: blogArt['oliver-peoples-finley-vintage-review'].alt,
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
    coverImage: blogArt['tom-ford-luxury-eyewear-guide-2025'].src,
    coverAlt: blogArt['tom-ford-luxury-eyewear-guide-2025'].alt,
  },
  {
    slug: 'acetate-vs-plastic-eyeglass-frames-guide',
    title: 'Acetate vs Plastic Eyeglass Frames: What to Compare',
    description: 'Acetate is one kind of plastic. Learn what zyl means, how sheet acetate differs from molded frames, and which details to check when comparing two pairs.',
    publishedAt: '2025-10-24T17:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Materials Guide',
    readTime: '3 min read',
    tags: ['Eyeglass Materials', 'Frame Guide', 'Acetate Frames', 'Buying Guide', 'Eyewear Education'],
    isPublished: true,
    coverImage: blogArt['acetate-vs-plastic-eyeglass-frames-guide'].src,
    coverAlt: blogArt['acetate-vs-plastic-eyeglass-frames-guide'].alt,
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
    coverImage: blogArt['browline-clubmaster-glasses-complete-guide'].src,
    coverAlt: blogArt['browline-clubmaster-glasses-complete-guide'].alt,
  },
  {
    slug: 'prescription-glasses-online-shopping-guide-2025',
    title: 'How to Buy Prescription Glasses Online',
    description: 'Check your prescription, compare frame measurements and lens options, and review the seller’s full price and return terms before placing an order.',
    publishedAt: '2025-10-28T19:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Shopping Guide',
    readTime: '3 min read',
    tags: ['Online Shopping', 'Prescription Glasses', 'Buying Guide', 'Eyewear Tips', 'How-To'],
    isPublished: true,
    coverImage: blogArt['prescription-glasses-online-shopping-guide-2025'].src,
    coverAlt: blogArt['prescription-glasses-online-shopping-guide-2025'].alt,
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
    title: 'How to Try On Prescription Glasses From a Photo',
    description: 'Compare two frame styles using your portrait and a product image, then check the measurements and lens options with the seller.',
    publishedAt: '2025-11-04T10:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Virtual Try-On',
    readTime: '3 min read',
    tags: ['Virtual Try-On', 'Prescription', 'Buying Guide'],
    isPublished: true,
    coverImage: blogArt['prescription-glasses-virtual-tryon-guide'].src,
    coverAlt: blogArt['prescription-glasses-virtual-tryon-guide'].alt,
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
    coverImage: blogArt['find-perfect-glasses-online-guide'].src,
    coverAlt: blogArt['find-perfect-glasses-online-guide'].alt,
  },
  {
    slug: 'virtual-try-on-reduce-eyewear-returns',
    title: 'How to Test Whether Virtual Try-On Reduces Eyewear Returns',
    description: 'Measure whether photo try-on reduces style-related frame returns. Compare delivered units, return reasons and matched products over a complete return window.',
    publishedAt: '2026-05-27T10:00:00Z',
    modifiedAt: '2026-11-15T00:00:00Z',
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
export async function getAllBlogPosts(locale = 'en'): Promise<BlogPost[]> {
  const advisorCopy = getAiGlassesAdvisorArticleCopy(locale)

  // Currently returns static articles, can be fetched from database in the future
  return staticBlogPosts
    .filter(post => post.isPublished)
    .map((post) => post.slug === 'ai-face-analysis-for-glasses-guide'
      ? {
          ...post,
          title: advisorCopy.metaTitle,
          description: advisorCopy.metaDescription,
          category: advisorCopy.articleLabel,
          readTime: advisorCopy.readTime,
        }
      : post)
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
