import { generateBlogArticleSEO } from '@/lib/blog-seo'
import type { Metadata } from 'next'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import Link from '@/components/layout/PublicLink'
import Image from 'next/image'
import { generateStructuredData, SITE_CONFIG } from '@/lib/seo'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { localizedPath } from '@/lib/localized-path'

export const dynamic = 'force-static'

const title = 'How to Choose Between Two Pairs of Glasses Online'
const description = 'Shortlist two frames, compare their outline on the same portrait, and use the seller’s measurements and terms to decide which pair to order.'
const pathname = '/blog/find-perfect-glasses-online-guide'
const cover = blogArt['find-perfect-glasses-online-guide']

type BlogPostPageProps = {
  params: { locale: Locale }
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  return {
    ...generateBlogArticleSEO({
      locale: params.locale,
      title,
      description,
      pathname,
      type: 'article',
      image: cover.src,
      imageAlt: cover.alt,
      imageWidth: cover.width,
      imageHeight: cover.height,
    }),
    keywords: 'find perfect glasses online, how to choose glasses online, buy glasses online, glasses shopping guide',
  }
}

const structuredData = generateStructuredData('article', {
  title,
  description,
  publishedAt: '2025-11-06T12:00:00Z',
  modifiedAt: '2026-11-16T00:00:00Z',
  author: 'VisuTry Team',
  image: `${SITE_CONFIG.url}${cover.src}`,
})

export default function BlogPostPage({ params }: BlogPostPageProps) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: localizedPath(params.locale, '/blog') },
                { name: title },
              ]}
            />
          </div>

          <article lang="en" dir="ltr" className="mx-auto max-w-3xl rounded-lg bg-white p-6 text-slate-800 shadow-sm sm:p-10">
            <header>
              <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-4 text-lg leading-7">{description}</p>
              <p className="mt-3 text-sm text-slate-600">VisuTry Team · Updated November 16, 2026 · 3 min read</p>
            </header>
            <div className="mt-8 space-y-4 leading-7 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline">
              <h2>Choose the difference you want to see</h2>
              <p>
                Start with a pair you already wear. What would you change first? If your black frames
                feel too prominent, compare them with a lighter color in a similar shape. If you want
                more of your cheeks to show, compare a shallow rectangle with a deeper frame in the same color.
                Changing one feature makes it easier to explain why you prefer one pair.
              </p>
              <h2>Put both styles on the same portrait</h2>
              <p>
                Use a front-facing portrait and the front-view product photo for each frame. Keep the
                portrait the same. Look at where the upper rim meets your brows and how much of your face
                is visible through the lenses. Save the product link, color and size with each preview.
              </p>
              <figure className="my-6">
                <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height}
                  sizes="(min-width: 768px) 688px, calc(100vw - 64px)" className="h-auto w-full rounded-lg" />
                <figcaption className="mt-2 text-sm text-slate-600">The same portrait with four styles. Compare the upper rim on the browline and aviator examples.</figcaption>
              </figure>
              <p><Link href={localizedPath(params.locale, '/try-on/glasses')}>Preview your two frame choices</Link>.</p>
              <h2>Choose the right virtual comparison method</h2>
              <p>
                For exact retail frames, generate separate Virtual Try-On previews with your own portrait and each product’s front-facing photo. For early style discovery, Frame Compare generates up to four <strong>built-in presets</strong> on one portrait; it does not fetch the exact store products from your screenshots. Neither method measures physical comfort.
              </p>
              <p>
                Use <Link href={localizedPath(params.locale, '/try-on/glasses')}>your own specific product photo</Link> or <Link href={localizedPath(params.locale, '/try-on/glasses/compare')}>compare preset frame directions</Link>, then check seller measurements.
              </p>
              <h2>Check the measurements that could rule a pair out</h2>
              <p>
                Two sizes of one model may use the same product photo. A preview alone cannot tell which
                bridge will feel comfortable or whether the temples are long enough. Compare the seller’s
                total width, bridge and temple measurements with a comfortable pair. Ask the seller for
                missing dimensions or try the frame in person if that difference affects your choice.
                See <Link href={localizedPath(params.locale, '/glasses-guide/how-wide-should-glasses-be-for-my-face')}>how to compare frame widths</Link>.
              </p>
              <h2>Compare the price of the pair you would actually order</h2>
              <p>
                Select your lens options at both shops before comparing totals. Check which parts you
                can return, the deadline, and whether you would receive money back or store credit.
                For prescription lenses, use the <Link href={localizedPath(params.locale, '/blog/prescription-glasses-online-shopping-guide-2025')}>order checklist</Link>
                {' '}to review the prescription, measurements and remake terms.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
