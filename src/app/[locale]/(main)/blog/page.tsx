import { Metadata } from 'next'
import { SITE_CONFIG, generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { getAllBlogPosts } from '@/lib/blog'
import Image from 'next/image'

const blogDescription = 'Discover the latest trends, style tips, and guides for glasses, outfits, shoes, and accessories. Learn how to find your perfect style with AI virtual try-on.'

export const metadata: Metadata = generateSEO({
  title: 'Blog - Fashion & Style Tips',
  description: blogDescription,
  url: '/blog',
})

// 1 hour ISR for blog listings
export const revalidate = 3600

export default async function BlogPage() {
  const posts = await getAllBlogPosts()
  const getDisplayDate = (post: Awaited<ReturnType<typeof getAllBlogPosts>>[number]) =>
    new Date(post.modifiedAt || post.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'VisuTry Blog',
    description: blogDescription,
    url: `${SITE_CONFIG.url}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: `${SITE_CONFIG.url}/blog/${post.slug}`,
      image: `${SITE_CONFIG.url}${post.coverImage}`,
      datePublished: post.publishedAt,
      dateModified: post.modifiedAt || post.publishedAt,
      author: {
        '@type': 'Organization',
        name: post.author,
      },
    })),
  }
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'VisuTry blog articles',
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: post.title,
      url: `${SITE_CONFIG.url}/blog/${post.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          <div className="mx-auto mb-10 max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-normal text-gray-900">
              Virtual Try-On Blog
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Practical eyewear shopping guides, frame comparisons, and AI virtual try-on tips from VisuTry.
            </p>
          </div>

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
                        {getDisplayDate(post)}
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
    </>
  )
}
