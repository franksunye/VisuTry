import { generateBlogArticleSEO } from '@/lib/blog-seo'
import type { Metadata } from 'next'
import Image from 'next/image'
import BlogTags from '@/components/BlogTags'
import Link from '@/components/layout/PublicLink'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const pathname = '/blog/celebrity-glasses-style-guide-2025'
const cover = blogArt['celebrity-glasses-style-guide-2025']
const title = 'Celebrity Glasses: How to Identify a Frame From a Photo'
const description = 'Read the shape, rim and temple details in a reference photo, check a documented collaboration, and compare a similar look on your own face.'
const publishedAt = '2025-10-21T14:00:00Z'
const updatedAt = '2026-11-16T00:00:00Z'
const articleTags = ['Celebrity Style', 'Fashion Trends', 'Style Inspiration', 'Eyewear Fashion', 'Virtual Try-On']

type PageProps = { params: { locale: Locale } }

export function generateMetadata({ params }: PageProps): Metadata {
  return generateBlogArticleSEO({
    locale: params.locale, pathname, title, description, type: 'article',
    image: cover.src, imageWidth: cover.width, imageHeight: cover.height, imageAlt: cover.alt,
  })
}

const article = generateStructuredData('article', {
  title, description, publishedAt, modifiedAt: updatedAt,
  author: 'VisuTry Team', image: `${SITE_CONFIG.url}${cover.src}`,
})

export default function BlogPostPage({ params: { locale } }: PageProps) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <Breadcrumbs items={[{ name: 'Blog', url: localizedPath(locale, '/blog') }, { name: title }]} />
      <article lang="en" dir="ltr" className="mt-6">
        <header>
          <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            When a pair of glasses catches your eye in a campaign or street-style photograph, save the original image and its credit. Then decide whether you want the exact product or just a similar shape. They require different evidence.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            VisuTry Team · Published <time dateTime={publishedAt}>October 21, 2025</time> · Updated <time dateTime={updatedAt}>November 16, 2026</time>
          </p>
        </header>
        <figure className="my-7">
          <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} priority
            sizes="(min-width: 768px) 704px, calc(100vw - 40px)" className="mx-auto h-auto max-h-80 w-full object-contain" />
          <figcaption className="mt-2 text-sm text-slate-600">VisuTry’s black cat-eye style example shows corners that rise toward the temples.</figcaption>
        </figure>
        <div className="prose prose-slate max-w-none prose-a:text-blue-700">
          <h2>Read three details in the photograph</h2>
          <ol>
            <li><strong>Front outline.</strong> Trace the top edge from bridge to temple. An upswept corner
              suggests a cat-eye direction. A straight upper edge and deep lenses create a different look
              even in the same black finish.</li>
            <li><strong>Rim and bridge.</strong> Look for a thick upper rim and thin lower edge, an uninterrupted
              acetate rim, a metal bridge, or visible nose pads. These features can narrow the search when
              a brand name is missing.</li>
            <li><strong>Side details.</strong> A second view can reveal a temple ornament or hinge hidden by
              hair in the original photo. Keep “unknown” beside any detail you cannot see. Indoor light
              and tinted lenses can change how frame color appears.</li>
          </ol>
          <h2>What would confirm an exact model?</h2>
          <p>
            A wardrobe credit that names the model or a brand campaign linking to a product gives you
            something you can verify. For example, Gentle Monster credits JENNIE on its Jentle Salon
            collection page, describes the charm designs, and lists individual models including Wispy
            01. A collection credit identifies the collaboration. To identify the specific item in a
            separate photograph, match it to a named model and its visible details.
            <a href="https://www.gentlemonster.com/us/en/category/collections/jentle-salon"> Gentle Monster’s Jentle Salon collection and model list</a>.
          </p>
          <h2>Recreate one feature you actually like</h2>
          <p>
            Suppose the attractive feature is a lifted outer corner. Shortlist two cat-eye frames with a
            similar rise: one with a dark solid rim, one in a lighter finish. Save a front product view
            of each from the seller. Keep the portrait, expression and crop constant while you
            <Link href={localizedPath(locale, '/try-glasses-on-photo')}> compare the frames on your photo</Link>.
            Now the difference you see comes mainly from the frames.
          </p>
          <p>
            When the reference shows a darker top line rather than a lifted corner, try the
            <Link href={localizedPath(locale, '/blog/browline-clubmaster-glasses-complete-guide')}> browline frame guide</Link>.
            Before ordering either look, check the listed measurements and return terms. Similar-looking
            pairs can sit quite differently on the bridge.
          </p>
        </div>
        <footer className="mt-8 border-t pt-4"><BlogTags locale={locale} tags={articleTags} /></footer>
      </article>
    </main>
  )
}
