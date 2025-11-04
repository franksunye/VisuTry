import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { ArrowLeft, Tag as TagIcon, Calendar, User, ArrowRight } from 'lucide-react'
import { getAllBlogPosts } from '@/lib/blog'

type Props = {
  params: { tag: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag)
  return generateSEO({
    title: `${tag} - Blog Articles`,
    description: `Browse all articles tagged with ${tag}. Discover insights, guides, and tips about ${tag}.`,
    url: `/blog/tag/${params.tag}`,
  })
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent(params.tag)
  const allPosts = await getAllBlogPosts()
  
  // Filter posts by tag
  const filteredPosts = allPosts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12">
        {/* Back button */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>

        {/* Page header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
            <TagIcon className="w-5 h-5 mr-2" />
            <span className="font-semibold">{tag}</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Articles tagged with &quot;{tag}&quot;
          </h1>
          <p className="text-xl text-gray-600">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'} found
          </p>
        </div>

        {/* Articles list */}
        {filteredPosts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {filteredPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Article image placeholder */}
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
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Read more link */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read Full Article
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No articles found with this tag.</p>
            <Link
              href="/blog"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse all articles →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

