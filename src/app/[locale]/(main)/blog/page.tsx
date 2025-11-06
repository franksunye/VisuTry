import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const metadata: Metadata = generateSEO({
  title: 'Blog - Eyewear Tips & Trends | VisuTry',
  description: 'Discover the latest eyewear trends, style tips, and guides to finding the perfect glasses for your face shape.',
  url: '/blog',
})

// Sample blog posts data
const blogPosts = [
  {
    id: 'prescription-glasses-virtual-tryon-guide',
    title: 'Prescription Glasses Virtual Try-On Guide - Find Your Perfect Fit Online',
    description: 'Complete guide to using virtual try-on tools for prescription glasses. Learn how to find the perfect fit online without visiting a store.',
    author: 'VisuTry Team',
    publishedAt: '2025-11-06',
    category: 'Virtual Try-On',
    readTime: '6 min read',
    image: '/blog-covers/virtual-tryon-guide.jpg',
  },
  {
    id: 'best-glasses-for-face-shapes-guide',
    title: 'Best Glasses for Different Face Shapes - Complete Guide 2025',
    description: 'Comprehensive guide to finding the best glasses for your face shape. Learn which frame styles work best for round, square, oval, heart, and oblong faces.',
    author: 'VisuTry Team',
    publishedAt: '2025-11-06',
    category: 'Style Guide',
    readTime: '8 min read',
    image: '/blog-covers/face-shapes-guide.jpg',
  },
  {
    id: 'find-perfect-glasses-online-guide',
    title: 'How to Find Your Perfect Glasses Online - Step-by-Step Guide',
    description: 'Complete step-by-step guide to finding and buying the perfect glasses online. Learn how to choose frames, use virtual try-on, and make confident purchases.',
    author: 'VisuTry Team',
    publishedAt: '2025-11-06',
    category: 'Shopping Guide',
    readTime: '7 min read',
    image: '/blog-covers/find-perfect-glasses.jpg',
  },
  {
    id: 'prescription-glasses-online-shopping-guide-2025',
    title: 'How to Buy Prescription Glasses Online 2025',
    description: 'Learn how to safely buy prescription glasses online. Get tips on measuring PD, reading prescriptions, and avoiding mistakes.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Shopping Guide',
    readTime: '10 min read',
    image: '/blog-covers/prescription-online-shopping.jpg',
  },
  {
    id: 'browline-clubmaster-glasses-complete-guide',
    title: 'Browline/Clubmaster Glasses Complete Guide 2025',
    description: 'Discover the history, style, and modern appeal of browline/Clubmaster glasses and why this retro style is back.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Style Guide',
    readTime: '8 min read',
    image: '/blog-covers/browline-clubmaster.jpg',
  },
  {
    id: 'acetate-vs-plastic-eyeglass-frames-guide',
    title: 'Acetate vs Plastic Eyeglass Frames - Complete Comparison',
    description: 'Discover the key differences between acetate and plastic frames. Learn about durability, comfort, and which is best.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Materials Guide',
    readTime: '7 min read',
    image: '/blog-covers/acetate-vs-plastic.jpg',
  },
  {
    id: 'tom-ford-luxury-eyewear-guide-2025',
    title: 'Tom Ford Luxury Eyewear Guide 2025',
    description: 'Explore Tom Ford luxury eyeglasses collection. Discover iconic styles and premium craftsmanship.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Luxury Brands',
    readTime: '7 min read',
    image: '/blog-covers/tom-ford-luxury.jpg',
  },
  {
    id: 'oliver-peoples-finley-vintage-review',
    title: 'Oliver Peoples Finley Vintage Review 2025',
    description: 'In-depth review of the iconic Oliver Peoples Finley Vintage eyeglasses. Worth the investment?',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Product Review',
    readTime: '8 min read',
    image: '/blog-covers/oliver-peoples-review.jpg',
  },
  {
    id: 'celebrity-glasses-style-guide-2025',
    title: 'Celebrity Glasses Style Guide 2025',
    description: 'Discover how celebrities like Cindy Crawford and Joan Smalls rock their eyewear. Get the iconic look.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Celebrity Style',
    readTime: '9 min read',
    image: '/blog-covers/celebrity-style.jpg',
  },
  {
    id: 'rayban-glasses-virtual-tryon-guide',
    title: 'Ray-Ban Glasses Virtual Try-On Guide 2025',
    description: 'Complete guide to Ray-Ban glasses styles with virtual try-on. Explore iconic Wayfarer, Clubmaster, and Aviator frames.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Brand Guide',
    readTime: '10 min read',
    image: '/blog-covers/rayban-guide.jpg',
  },
  {
    id: 'best-ai-virtual-glasses-tryon-tools-2025',
    title: 'Best AI Virtual Glasses Try-On Tools in 2025',
    description: 'Comprehensive review of the top AI-powered virtual glasses try-on tools. Compare features, accuracy, and user experience.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-20',
    category: 'Technology',
    readTime: '8 min read',
    image: '/blog-covers/ai-virtual-tryon.jpg',
  },
  {
    id: 'how-to-choose-glasses-for-your-face',
    title: 'How to Choose the Right Glasses for Your Face Shape?',
    description: 'Detailed analysis of suitable glasses styles for different face shapes, including round, square, long faces, and more.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-15',
    category: 'Glasses Guide',
    readTime: '5 min read',
    image: '/blog-covers/face-shape-guide.jpg',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12">
        {/* Blog posts list */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {blogPosts.map((post, index) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Article image */}
              <Link href={`/blog/${post.id}`} className="block">
                <div className="relative h-48 bg-gray-100 overflow-hidden group">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                    loading={index < 3 ? undefined : 'lazy'}
                  />
                </div>
              </Link>

              {/* Article content */}
              <div className="p-6">
                {/* Category tag */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                </div>

                {/* Article title */}
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h2>

                {/* Article description */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.description}
                </p>

                {/* Article metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {post.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {post.publishedAt}
                    </div>
                  </div>
                </div>

                {/* Read more link */}
                <Link
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read Full Article
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
