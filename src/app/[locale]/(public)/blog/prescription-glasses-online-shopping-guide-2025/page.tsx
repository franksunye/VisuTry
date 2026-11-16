import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/layout/PublicLink'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { generateI18nSEO, generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const slug = 'prescription-glasses-online-shopping-guide-2025'
const title = 'How to Buy Prescription Glasses Online'
const description = 'Check your prescription, compare frame measurements and lens options, and review the seller’s full price and return terms before placing an order.'
const publishedAt = '2025-10-28T19:00:00Z'
const publishedLabel = 'October 28, 2025'

const artwork = blogArt[slug]
const pathname = `/blog/${slug}`
const updatedAt = '2026-11-16T00:00:00Z'
type PageProps = { params: { locale: Locale } }

export function generateMetadata({ params }: PageProps): Metadata {
  return generateI18nSEO({
    locale: params.locale, pathname, title, description, type: 'article',
    image: artwork.src, imageAlt: artwork.alt, imageWidth: artwork.width, imageHeight: artwork.height,
  })
}

const article = generateStructuredData('article', {
  title, description, publishedAt, modifiedAt: updatedAt,
  author: 'VisuTry Team', image: `${SITE_CONFIG.url}${artwork.src}`,
})

export default function BlogPostPage({ params: { locale } }: PageProps) {
  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <Breadcrumbs items={[{ name: 'Blog', url: localizedPath(locale, '/blog') }, { name: title }]} />
        <article lang="en" className="mt-6">
          <header>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">{description}</p>
            <p className="mt-3 text-sm text-slate-600">
              VisuTry Team · Published <time dateTime={publishedAt}>{publishedLabel}</time> · Updated <time dateTime={updatedAt}>November 16, 2026</time>
            </p>
          </header>
          <figure className="my-7">
            <Image
              src={artwork.src} alt={artwork.alt} width={artwork.width} height={artwork.height}
              sizes="(min-width: 768px) 704px, calc(100vw - 40px)"
              className="h-auto w-full rounded-xl object-contain" priority
            />
          </figure>
          <div className="space-y-4 leading-7 text-slate-800 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_ul]:list-disc [&_ul]:ps-6">
            <h2>Gather the details for your order</h2>
            <p>
              Start with your current eyeglass prescription and a pair you find comfortable. Ask the seller
              which measurements they require for the lenses you want. If your order asks for a value
              you cannot identify, ask the prescriber or optician to explain it before you submit the order.
            </p>
            <p>
              In the United States, after an eye exam that includes a refraction, the prescriber must
              give you a copy of your eyeglass prescription immediately and at no extra charge.
              Pupillary distance (PD) may be listed separately. If the order asks for PD, ask for your
              measurement instead of entering an average. See the{' '}
              <a href="https://consumer.ftc.gov/articles/buying-prescription-glasses-or-contact-lenses-your-rights">FTC’s guidance on eyeglass prescriptions and PD</a>.
            </p>
            <h2>Compare a frame with a pair you own</h2>
            <p>
              Look inside the temple of your current pair for three measurements. A marking like 54 □ 16 140 gives the lens width (54 mm), bridge width (16 mm) and temple length (140 mm). On the
              product page, check those dimensions and the total frame width if supplied. Two frames can
              have the same lens width but different overall widths or bridge shapes. Consult the
              {' '}<Link href={localizedPath(locale, '/glasses-guide/how-wide-should-glasses-be-for-my-face')}>frame width guide</Link> when the numbers disagree.
            </p>
            <p>
              Save the seller’s model, size, color and product link. To compare appearance, use your own
              front-facing portrait and a front-view photo of that specific frame. A visual preview shows
              the silhouette. The seller or optician can help you check lens compatibility and physical fit.
            </p>
            <GrowthFunnelLink
              href={localizedPath(locale, '/try-on/glasses')} sourcePage={localizedPath(locale, pathname)}
              destination="glasses-try-on" ctaLocation="compare-before-ordering"
              queryCluster="buy-prescription-glasses-online" productPath="virtual_try_on" prefetch={false}
            >Preview a frame on your photo</GrowthFunnelLink>
            <h2>Compare the complete order price</h2>
            <p>
              When comparing two retailers, select the same lens type, coatings and frame size at both.
              For example, record the total for the frame with your chosen lenses and shipping. A frame-only
              price at one store and a finished-pair price at the other will give a misleading comparison.
            </p>
            <h2>Check the return and remake terms</h2>
            <p>
              A refund, store credit and a lens remake give you different options if a pair does not work
              out. Open the seller’s policy before placing your order. For example, check the terms from{' '}
              <a href="https://www.zennioptical.com/c/return">Zenni</a> or{' '}
              <a href="https://www.eyebuydirect.com/shipping-and-returns">Eyebuydirect</a> for the pair you are considering.
            </p>
            <ul>
              <li>Check whether custom prescription lenses, the frame and sale items have different return rules.</li>
              <li>Record when the return window starts, how a refund is issued and who pays return shipping.</li>
              <li>Ask who handles adjustments or a lens remake and what you would need to provide.</li>
            </ul>
            <p>
              Keep the order summary, measurements and the policy you relied on. For a closer look at
              two frames before choosing, follow the <Link href={localizedPath(locale, '/blog/prescription-glasses-virtual-tryon-guide')}>photo try-on walkthrough</Link>.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
