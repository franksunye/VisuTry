import type { Metadata } from 'next'
import Image from 'next/image'
import BlogTags from '@/components/BlogTags'
import Link from '@/components/layout/PublicLink'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { generateI18nSEO, generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const pathname = '/blog/tom-ford-luxury-eyewear-guide-2025'
const cover = blogArt['tom-ford-luxury-eyewear-guide-2025']
const title = 'Tom Ford Eyeglasses: How to Read a Frame Listing'
const description = 'Use the FT5304 square optical frame to compare model codes, dimensions, temple details and the price of a complete pair.'
const publishedAt = '2025-10-21T16:00:00Z'
const updatedAt = '2026-11-16T00:00:00Z'
const articleTags = ['Tom Ford', 'Luxury Eyewear', 'Designer Glasses', 'Premium Frames', 'Fashion']

type PageProps = { params: { locale: Locale } }

export function generateMetadata({ params }: PageProps): Metadata {
  return generateI18nSEO({
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
            Two square black frames can look alike head-on. A side view, a model code and three measurements will tell you whether two sellers are showing the same Tom Ford frame.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            VisuTry Team · Published <time dateTime={publishedAt}>October 21, 2025</time> · Updated <time dateTime={updatedAt}>November 16, 2026</time>
          </p>
        </header>
        <figure className="my-7">
          <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} priority
            sizes="(min-width: 768px) 704px, calc(100vw - 40px)" className="mx-auto h-auto max-h-80 w-full object-contain" />
          <figcaption className="mt-2 text-sm text-slate-600">VisuTry’s unbranded square frame illustrates a thick, dark outline. See the linked Tom Ford photographs for the FT5304.</figcaption>
        </figure>
        <div className="prose prose-slate max-w-none prose-a:text-blue-700">
          <h2>Start with one model and one color</h2>
          <p>
            The black FT5304 is a square optical frame. Tom Ford specifies a shiny black finish, a
            rose-gold-colored T at the temple, engraved stripes on the outer temples and a spring
            hinge. The side photograph is particularly useful here. The engraving and T detail are
            easier to see from that angle than in the front view. <a href="https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304-F001.html">Tom Ford FT5304 in black, with product photographs and specifications</a>.
          </p>
          <h2>Use 54–19–145 to compare listings</h2>
          <p>
            For this version Tom Ford lists 54–19–145. These are the lens width, bridge width and
            temple length in millimeters. Copy all three alongside the model and color. A second
            seller might use “square black glasses” for a different model, or put the size in a
            drop-down below the photographs.
          </p>
          <p>
            If your current pair is marked 52–19–145, the listed lens width is 2 mm wider on each side
            and the other two numbers match. The outline, rims and hinges still affect the overall
            width. Ask for the outside width and try the pair on if your usual frames press at the
            temples.
          </p>
          <h2>Decide which detail is worth paying for</h2>
          <p>
            If the side hardware is what caught your eye, include the side view when saving the
            listing. If you mainly like the bold square front, compare its outline with an unbranded
            square frame on the same portrait. A <Link href={localizedPath(locale, '/try-glasses-on-photo')}>photo
            try-on with your own frame image</Link> can help you decide which proportions you prefer.
          </p>
          <p>
            Compare like-for-like totals from the sellers you are considering. Include the selected
            lenses, delivery and any aftercare you would use. Ask who handles adjustments or replacement
            parts and what happens if you return the prescription lenses. Save the item reference and
            written terms with your quote.
          </p>
        </div>
        <footer className="mt-8 border-t pt-4"><BlogTags locale={locale} tags={articleTags} /></footer>
      </article>
    </main>
  )
}
