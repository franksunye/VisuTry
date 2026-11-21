import { getNativeBlogHubText } from '@/config/native-blog-hub'
import { getValidLocale } from '@/i18n'
import { GeoTaskFacts } from '@/components/seo/GeoTaskFacts'
import { Metadata } from 'next'
import { SITE_CONFIG, generateI18nSEO } from '@/lib/seo'
import Link from '@/components/layout/PublicLink'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { blogPostPath, blogShareImage, getAllBlogPosts } from '@/lib/blog'
import Image from 'next/image'

const blogDescription = 'Practical guides for face shape, frame selection, eyewear sizing, virtual glasses try-on, frame comparison, and confident online eyewear decisions.'

type Props = {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const content = getNativeBlogHubText(getValidLocale(params.locale))
  return generateI18nSEO({
    locale: params.locale as any,
    title: content.metaTitle,
    description: content.description,
    image: blogShareImage,
    imageAlt: 'VisuTry glasses logo',
    pathname: '/blog',
  })
}

export const dynamic = 'force-static'

export default async function BlogPage({ params }: Props) {
  const posts = await getAllBlogPosts(params.locale)
  const hub = getNativeBlogHubText(getValidLocale(params.locale))
  const localePrefix = `/${params.locale}`
  const getDisplayDate = (post: Awaited<ReturnType<typeof getAllBlogPosts>>[number]) =>
    new Date(post.modifiedAt || post.publishedAt).toLocaleDateString(params.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: hub.title,
    description: hub.description,
    url: `${SITE_CONFIG.url}${localePrefix}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: `${SITE_CONFIG.url}${blogPostPath(params.locale, post.slug)}`,
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
    name: hub.title,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: post.title,
      url: `${SITE_CONFIG.url}${blogPostPath(params.locale, post.slug)}`,
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
              {hub.title}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {hub.description}
            </p>
          </div>

          {params.locale === 'en' && (
            <section className="mx-auto mb-10 max-w-5xl" aria-label="Choosing an eyewear buying guide">
              <GeoTaskFacts task="blog" />
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <Link href="/en/blog/prescription-glasses-virtual-tryon-guide" prefetch={false} className="rounded-lg border border-slate-200 bg-white p-4 text-blue-700 hover:border-blue-300">Specific store image → custom Try-On guide</Link>
                <Link href="/en/blog/find-perfect-glasses-online-guide" prefetch={false} className="rounded-lg border border-slate-200 bg-white p-4 text-blue-700 hover:border-blue-300">Two finalists → compare before buying</Link>
                <Link href="/en/glasses-guide/how-wide-should-glasses-be-for-my-face" prefetch={false} className="rounded-lg border border-slate-200 bg-white p-4 text-blue-700 hover:border-blue-300">Frame markings → browser size comparator</Link>
              </div>
            </section>
          )}

          {params.locale !== 'en' && (
            <section className="mx-auto mb-10 max-w-5xl space-y-4" aria-label={hub.title}>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Link href={blogPostPath(params.locale, 'prescription-glasses-virtual-tryon-guide')}
                  prefetch={false} className="rounded-lg border border-slate-200 bg-white p-4 font-semibold text-blue-700 hover:border-blue-300">{hub.exact}</Link>
                <Link href={blogPostPath(params.locale, 'find-perfect-glasses-online-guide')}
                  prefetch={false} className="rounded-lg border border-slate-200 bg-white p-4 font-semibold text-blue-700 hover:border-blue-300">{hub.choice}</Link>
                <Link href={`/${params.locale}/glasses-guide/how-wide-should-glasses-be-for-my-face`}
                  prefetch={false} className="rounded-lg border border-slate-200 bg-white p-4 font-semibold text-blue-700 hover:border-blue-300">{hub.width}</Link>
                <Link href={`/${params.locale}/face-shape-detector`}
                  prefetch={false} className="rounded-lg border border-slate-200 bg-white p-4 font-semibold text-blue-700 hover:border-blue-300">{hub.detector}</Link>
              </div>
            </section>
          )}

          {/* Blog posts list */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {posts.map((post, index) => {
              const articleHref = blogPostPath(params.locale, post.slug)
              const isEnglishFallback = params.locale !== 'en' && articleHref.startsWith('/en/')

              return (
                <article
                  key={post.slug}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={articleHref} prefetch={false} aria-label={post.title} className="block">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.coverAlt ?? post.title}
                        fill
                        sizes="(min-width: 1152px) 363px, (min-width: 1024px) 31vw, (min-width: 768px) 46vw, 95vw"
                        className={post.coverAlt ? 'object-contain' : 'object-cover'}
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

                    {isEnglishFallback && <span className="mb-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{hub.onlyEnglish}</span>}

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
                      <div className="flex items-center gap-x-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 me-1" />
                          {post.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 me-1" />
                          {getDisplayDate(post)}
                        </div>
                      </div>
                    </div>

                    {/* Read more link */}
                    <Link
                      href={articleHref}
                      prefetch={false}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {hub.readMore}
                      <ArrowRight className="w-4 h-4 ms-1" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </main>
      </div>
    </>
  )
}
