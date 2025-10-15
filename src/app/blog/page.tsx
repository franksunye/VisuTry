import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const metadata: Metadata = generateSEO({
  title: '博客 - 眼镜试戴指南与AI技术分享',
  description: '探索眼镜试戴技巧、脸型搭配指南、AI技术应用等专业内容。帮助你找到最适合的眼镜款式。',
  url: '/blog',
})

// 示例博客文章数据
const blogPosts = [
  {
    id: 'how-to-choose-glasses-for-your-face',
    title: '如何根据脸型选择适合的眼镜？完整指南',
    description: '详细解析不同脸型适合的眼镜款式，包括圆脸、方脸、长脸等，帮你找到最佳搭配。',
    author: 'VisuTry团队',
    publishedAt: '2025-10-15',
    category: '选镜指南',
    readTime: '5分钟',
    image: '/blog/face-shape-guide.jpg',
  },
  {
    id: 'ai-glasses-tryon-technology',
    title: 'AI虚拟试戴技术原理解析',
    description: '深入了解AI虚拟试戴技术的工作原理，包括人脸识别、3D建模等核心技术。',
    author: 'VisuTry团队',
    publishedAt: '2025-10-14',
    category: '技术分享',
    readTime: '8分钟',
    image: '/blog/ai-technology.jpg',
  },
  {
    id: 'best-glasses-brands-2025',
    title: '2025年最受欢迎的眼镜品牌推荐',
    description: '盘点2025年最受欢迎的眼镜品牌，包括Ray-Ban、Gentle Monster等知名品牌。',
    author: 'VisuTry团队',
    publishedAt: '2025-10-13',
    category: '品牌推荐',
    readTime: '6分钟',
    image: '/blog/brands-2025.jpg',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            VisuTry 博客
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            探索眼镜试戴技巧、脸型搭配指南、AI技术应用等专业内容
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
