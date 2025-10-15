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
    id: 'how-to-choose-glasses-for-your-face',
    title: 'How to Choose the Right Glasses for Your Face Shape? Complete Guide',
    description: 'Detailed analysis of suitable glasses styles for different face shapes, including round, square, long faces, and more. Find your perfect match.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-15',
    category: 'Glasses Guide',
    readTime: '5 min read',
    image: '/blog/face-shape-guide.jpg',
  },
  {
    id: 'ai-glasses-tryon-technology',
    title: 'AI Virtual Try-On Technology Explained',
    description: 'Deep dive into how AI virtual try-on technology works, including facial recognition, 3D modeling and other core technologies.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-14',
    category: 'Technology',
    readTime: '8 min read',
    image: '/blog/ai-technology.jpg',
  },
  {
    id: 'best-glasses-brands-2025',
    title: 'Most Popular Glasses Brands in 2025',
    description: 'Discover the most popular glasses brands in 2025, including Ray-Ban, Gentle Monster and other renowned brands.',
    author: 'VisuTry Team',
    publishedAt: '2025-10-13',
    category: 'Brand Reviews',
    readTime: '6 min read',
    image: '/blog/brands-2025.jpg',
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

        {/* 博客文章列表 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* 文章图片 */}
              <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-lg font-medium">
                  {post.title.substring(0, 10)}...
                </span>
              </div>

              {/* 文章内容 */}
              <div className="p-6">
                {/* 分类标签 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                </div>

                {/* 文章标题 */}
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h2>

                {/* 文章描述 */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.description}
                </p>

                {/* 文章元信息 */}
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

                {/* 阅读更多链接 */}
                <Link
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  阅读全文
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* 返回首页链接 */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
