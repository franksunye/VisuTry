import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const metadata: Metadata = generateSEO({
  title: 'Blog - Glasses Try-On Guide & AI Technology Insights',
  description: 'Explore glasses try-on techniques, face shape matching guides, AI technology applications and professional insights. Find the perfect glasses style for you.',
  url: '/blog',
})

// Sample blog posts data
const blogPosts = [
  {
    id: 'rayban-glasses-virtual-tryon-guide',
    title: 'Ray-Ban Glasses Virtual Try-On Guide 2025',
    description: 'Complete guide to Ray-Ban glasses styles with virtual try-on. Explore iconic Wayfarer, Clubmaster, and Aviator frames.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-21',
    category: 'Brand Guide',
    readTime: '10 min read',
    image: '/Ray-Ban RB5154 Clubmaster - Browline Black Frame Eyeglasses.jpg',
  },
  {
    id: 'best-ai-virtual-glasses-tryon-tools-2025',
    title: 'Best AI Virtual Glasses Try-On Tools in 2025',
    description: 'Comprehensive review of the top AI-powered virtual glasses try-on tools. Compare features, accuracy, and user experience.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-20',
    category: 'Technology',
    readTime: '8 min read',
    image: '/og-image.jpg',
  },
  {
    id: 'how-to-choose-glasses-for-your-face',
    title: 'How to Choose the Right Glasses for Your Face Shape?',
    description: 'Detailed analysis of suitable glasses styles for different face shapes, including round, square, long faces, and more.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-15',
    category: 'Glasses Guide',
    readTime: '5 min read',
    image: '/og-image.jpg',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Page title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            VisuTry Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore glasses try-on techniques, face shape matching guides, AI technology applications and professional insights
          </p>
        </div>

        {/* Blog posts list */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Article image */}
              <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-lg font-medium">
                  {post.title.substring(0, 10)}...
                </span>
              </div>

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

        {/* Back to home link */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
