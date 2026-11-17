import { getNativeAcetateGuide } from '@/config/native-acetate-frame-guide'
import { getNativeBrowlineGuide } from '@/config/native-browline-clubmaster-guide'
import { getNativeFinleyVintageGuide } from '@/config/native-finley-vintage-guide'
import { getNativeTomFordFrameGuide } from '@/config/native-tom-ford-frame-guide'
/**
 * Blog content management utilities
 * Supports static articles and future dynamic articles
 */

import { blogArt } from '@/config/blog-art'
import { locales, getValidLocale, type Locale } from '@/i18n'
import { getAiGlassesAdvisorArticleCopy } from '@/config/ai-glasses-advisor-article-locales'
import { getPrescriptionTryOnArticleCopy, PRESCRIPTION_TRYON_PUBLISHED_LOCALES } from '@/config/prescription-tryon-article-locales'
import { getNativeChoiceGuide } from '@/config/native-choice-between-frames'
import { getNativeFaceFrameGuide } from '@/config/native-face-shape-frame-guide'
import { getNativePrescriptionShoppingGuide } from '@/config/native-prescription-shopping-guide'

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
    description: 'Compare 16 optical and sunglass styles in the VisuTry catalog, with examples from 2026 collections and photos to help you shortlist a shape.',
    publishedAt: '2026-07-20T10:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
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
    title: 'How to Choose Glasses for Your Face Shape',
    description: 'Choose two frames to compare. See how rim shape, depth and color change the look, then check the size and bridge fit before ordering.',
    publishedAt: '2025-10-15T10:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Glasses Guide',
    readTime: '3 min read',
    tags: ['Face Shape', 'Glasses Selection', 'Style Guide'],
    isPublished: true,
    coverImage: blogArt['how-to-choose-glasses-for-your-face'].src,
    coverAlt: blogArt['how-to-choose-glasses-for-your-face'].alt,
  },
  {
    slug: 'best-ai-virtual-glasses-tryon-tools-2025',
    title: 'Virtual Glasses Try-On Tools Compared: Warby Parker, Zenni and VisuTry',
    description: 'Compare three virtual glasses try-on tools. See which accepts a frame screenshot, which offers a live camera preview, and what to check before ordering.',
    publishedAt: '2025-10-14T10:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Technology',
    readTime: '3 min read',
    tags: ['Virtual Try-On', 'AI Technology', 'Eyewear Ecommerce', 'Shopping Guide'],
    isPublished: true,
    coverImage: blogArt['best-ai-virtual-glasses-tryon-tools-2025'].src,
    coverAlt: blogArt['best-ai-virtual-glasses-tryon-tools-2025'].alt,
  },
  {
    slug: 'rayban-glasses-virtual-tryon-guide',
    title: 'Ray-Ban Virtual Try On: Compare Iconic Styles on Your Photo',
    description: 'Ray-Ban virtual try on from your photo. Compare Wayfarer, Aviator, Clubmaster, and round directions, then confirm the exact model and fit before you buy.',
    publishedAt: '2025-10-16T10:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
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
    title: 'Celebrity Glasses: How to Identify a Frame From a Photo',
    description: 'Read the shape, rim and temple details in a reference photo, check a documented collaboration, and compare a similar look on your own face.',
    publishedAt: '2025-10-21T14:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Celebrity Style',
    readTime: '3 min read',
    tags: ['Celebrity Style', 'Fashion Trends', 'Style Inspiration', 'Eyewear Fashion', 'Virtual Try-On'],
    isPublished: true,
    coverImage: blogArt['celebrity-glasses-style-guide-2025'].src,
    coverAlt: blogArt['celebrity-glasses-style-guide-2025'].alt,
  },
  {
    slug: 'oliver-peoples-finley-vintage-review',
    title: 'Oliver Peoples Finley Vintage: A Buying Guide to the OV5397U',
    description: 'Check the Finley Vintage model, color and measurements, compare its shape on your photo, and decide which fit questions to take to an optician.',
    publishedAt: '2025-10-21T15:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Buying Guide',
    readTime: '3 min read',
    tags: ['Oliver Peoples', 'Luxury Eyewear', 'Product Review', 'Designer Glasses', 'Premium Frames'],
    isPublished: true,
    coverImage: blogArt['oliver-peoples-finley-vintage-review'].src,
    coverAlt: blogArt['oliver-peoples-finley-vintage-review'].alt,
  },
  {
    slug: 'tom-ford-luxury-eyewear-guide-2025',
    title: 'Tom Ford Eyeglasses: How to Read a Frame Listing',
    description: 'Use the FT5304 square optical frame to compare model codes, dimensions, temple details and the price of a complete pair.',
    publishedAt: '2025-10-21T16:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Luxury Brands',
    readTime: '3 min read',
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
    title: 'Browline vs. Clubmaster: How to Tell the Frames Apart',
    description: 'Learn what makes a browline frame, compare Ray-Ban Clubmaster Optics RB5154 with Clubmaster Classic RB3016 sunglasses, and check the size you need.',
    publishedAt: '2025-10-21T18:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Style Guide',
    readTime: '3 min read',
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
    title: 'How to Choose Between Two Pairs of Glasses Online',
    description: 'Shortlist two frames, compare their outline on the same portrait, and use the seller’s measurements and terms to decide which pair to order.',
    publishedAt: '2025-11-06T12:00:00Z',
    modifiedAt: '2026-11-16T00:00:00Z',
    author: 'VisuTry Team',
    category: 'Shopping Guide',
    readTime: '3 min read',
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
    coverImage: blogArt['virtual-try-on-reduce-eyewear-returns'].src,
    coverAlt: blogArt['virtual-try-on-reduce-eyewear-returns'].alt,
  },
]

/**
 * Publication-language contract: list a locale only when its article BODY has
 * a genuine native edition (not merely an i18n navigation/footer shell).
 * Keep sitemap, hreflang, canonical and blog cards synchronized here.
 * Untranslated routes remain available, canonically owned by their EN source.
 */
export function getBlogArticleLocales(slug: string): readonly Locale[] {
  if (slug === 'ai-face-analysis-for-glasses-guide') return locales
  if (slug === 'prescription-glasses-virtual-tryon-guide') return PRESCRIPTION_TRYON_PUBLISHED_LOCALES
  if (slug === 'find-perfect-glasses-online-guide'
      || slug === 'how-to-choose-glasses-for-your-face'
      || slug === 'prescription-glasses-online-shopping-guide-2025'
      || slug === 'acetate-vs-plastic-eyeglass-frames-guide'
      || slug === 'browline-clubmaster-glasses-complete-guide'
      || slug === 'oliver-peoples-finley-vintage-review'
      || slug === 'tom-ford-luxury-eyewear-guide-2025') return locales
  return ['en']
}

/** Indexes link directly to an article's canonical published language. */
export function blogPostPath(locale: string, slug: string): string {
  const articleLocale = getBlogArticleLocales(slug).includes(locale as Locale) ? locale : 'en'
  return `/${articleLocale}/blog/${slug}`
}

/**
 * Get all published blog posts
 */
export async function getAllBlogPosts(locale = 'en'): Promise<BlogPost[]> {
  const advisorCopy = getAiGlassesAdvisorArticleCopy(locale)

  // Currently returns static articles, can be fetched from database in the future
  return staticBlogPosts
    .filter(post => post.isPublished)
    .map((post) => {
      if (post.slug === 'ai-face-analysis-for-glasses-guide') {
        return {
          ...post,
          title: advisorCopy.metaTitle,
          description: advisorCopy.metaDescription,
          category: advisorCopy.articleLabel,
          readTime: advisorCopy.readTime,
        }
      }
      const language = getValidLocale(locale)
      if (post.slug === 'prescription-glasses-virtual-tryon-guide' && language !== 'en') {
        const copy = getPrescriptionTryOnArticleCopy(language)
        return { ...post, title: copy.title, description: copy.description, category: copy.category, readTime: copy.readTime, coverAlt: copy.imageAlt }
      }
      const native = post.slug === 'find-perfect-glasses-online-guide'
        ? getNativeChoiceGuide(language)
        : post.slug === 'how-to-choose-glasses-for-your-face'
          ? getNativeFaceFrameGuide(language)
          : post.slug === 'prescription-glasses-online-shopping-guide-2025'
            ? getNativePrescriptionShoppingGuide(language)
            : post.slug === 'acetate-vs-plastic-eyeglass-frames-guide'
            ? getNativeAcetateGuide(language)
            : post.slug === 'browline-clubmaster-glasses-complete-guide'
              ? getNativeBrowlineGuide(language)
              : post.slug === 'oliver-peoples-finley-vintage-review'
                ? getNativeFinleyVintageGuide(language)
                : post.slug === 'tom-ford-luxury-eyewear-guide-2025'
                  ? getNativeTomFordFrameGuide(language)
                  : null
      return native
        ? { ...post, title: native.title, description: native.description, category: native.category, readTime: native.readTime, coverAlt: native.imageAlt }
        : post
    })
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
