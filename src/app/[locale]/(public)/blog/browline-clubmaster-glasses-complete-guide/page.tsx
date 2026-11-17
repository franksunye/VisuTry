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

const pathname = '/blog/browline-clubmaster-glasses-complete-guide'
const cover = blogArt['browline-clubmaster-glasses-complete-guide']
const title = 'Browline vs. Clubmaster: How to Tell the Frames Apart'
const description = 'Learn what makes a browline frame, compare Ray-Ban Clubmaster Optics RB5154 with Clubmaster Classic RB3016 sunglasses, and check the size you need.'
const publishedAt = '2025-10-21T18:00:00Z'
const updatedAt = '2026-11-16T00:00:00Z'
const articleTags = ['Browline Glasses', 'Clubmaster', 'Retro Style', 'Vintage Eyewear', 'Fashion Trends']

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
            Browline describes a design with a pronounced upper rim that follows the eyebrows and a lighter lower rim. Clubmaster is Ray-Ban’s name for a family of frames. If a listing says only “browline,” the name tells you about the shape but does not identify a Ray-Ban model.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            VisuTry Team · Published <time dateTime={publishedAt}>October 21, 2025</time> · Updated <time dateTime={updatedAt}>November 16, 2026</time>
          </p>
        </header>
        <figure className="my-7">
          <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} priority
            sizes="(min-width: 768px) 704px, calc(100vw - 40px)" className="mx-auto h-auto max-h-80 w-full object-contain" />
          <figcaption className="mt-2 text-sm text-slate-600">An unbranded VisuTry browline example. The thick black upper rim stands out against the narrow lower rim.</figcaption>
        </figure>
        <div className="prose prose-slate max-w-none prose-a:text-blue-700">
          <h2>Compare an optical Clubmaster and a sunglass Clubmaster</h2>
          <dl>
            <dt><strong>Clubmaster Optics RB5154</strong></dt>
            <dd>Ray-Ban’s polished black-on-silver example is an optical frame. The 2000 colorway
              shown in size 51–21 has a 51 mm lens width, a 21 mm bridge and 145 mm temples.
              The manufacturer lists adjustable nose pads.
              <a href="https://www.ray-ban.com/usa/eyeglasses/RX5154%20UNISEX%20clubmaster%20optics-black/8053672195736"> Ray-Ban RB5154 product details</a>.</dd>
            <dt><strong>Clubmaster Classic RB3016</strong></dt>
            <dd>Ray-Ban’s black-on-gold example is a sunglass frame with green lenses. A dark lens
              changes how much contrast you see between the upper and lower rims. Save the model and
              colorway along with the size when comparing retailer images.
              <a href="https://www.ray-ban.com/usa/sunglasses/RB3016clubmasterclassic-blackongold/805289304449"> Ray-Ban RB3016 product details</a>.</dd>
          </dl>
          <h2>Check how the upper rim sits</h2>
          <p>
            Start with a front view in which the wearer is looking straight at the camera. Notice
            whether the frame follows the brow, covers it or leaves a visible gap. Decide which effect
            you like. A thicker black brow draws a stronger horizontal line. A thinner or translucent
            brow lets more of your natural eyebrow remain visible.
          </p>
          <p>
            If the top looks right but the frame slips, a different bridge or an adjustment may matter
            more than changing the lens shape. Compare the width and bridge measurements with a pair
            you wear comfortably, then check the actual pair with an optician. Head angle and distance
            from the camera can move the upper rim noticeably in a photo.
          </p>
          <h2>Make a two-frame shortlist</h2>
          <p>
            Choose one frame with a strong upper rim and one lighter browline. For an exact model,
            use a front product photo in the color you are considering and the same portrait for both.
            <Link href={localizedPath(locale, '/try-glasses-on-photo')}> Preview your browline frames</Link>.
            If you want a less pronounced brow, compare the result with one of the outlines in the
            <Link href={localizedPath(locale, '/blog/rayban-glasses-virtual-tryon-guide')}> Ray-Ban style guide</Link>.
          </p>
        </div>
        <footer className="mt-8 border-t pt-4"><BlogTags locale={locale} tags={articleTags} /></footer>
      </article>
    </main>
  )
}
