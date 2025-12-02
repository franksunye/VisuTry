import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { getAllBlogPosts } from '@/lib/blog'
import Image from 'next/image'

export const metadata: Metadata = generateSEO({
  title: 'Blog - Fashion & Style Tips | VisuTry',
  description: 'Discover the latest trends, style tips, and guides for glasses, outfits, shoes, and accessories. Learn how to find your perfect style with AI virtual try-on.',
  url: '/blog',
})

// Sample blog posts data

export default async function BlogPage() {
  const posts = await getAllBlogPosts()
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12">
        {/* Blog posts list */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {posts.map((post, index) => (
            <article
              key={post.slug}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`./${post.slug}`} className="block">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority={index < 3}
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
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Read more link */}
                <Link
                  href={`./${post.slug}`}
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
