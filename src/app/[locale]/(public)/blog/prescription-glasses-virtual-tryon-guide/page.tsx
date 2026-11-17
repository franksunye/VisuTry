import { generateBlogArticleSEO } from '@/lib/blog-seo'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/layout/PublicLink'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const slug = 'prescription-glasses-virtual-tryon-guide'
const title = 'How to Try On Prescription Glasses From a Photo'
const description = 'Compare two frame styles using your portrait and a product image, then check the measurements and lens options with the seller.'
const publishedAt = '2025-11-04T10:00:00Z'
const publishedLabel = 'November 4, 2025'

const artwork = blogArt[slug]
const pathname = `/blog/${slug}`
const updatedAt = '2026-11-16T00:00:00Z'
type PageProps = { params: { locale: Locale } }

export function generateMetadata({ params }: PageProps): Metadata {
  return generateBlogArticleSEO({
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
        <article lang="en" dir="ltr" className="mt-6">
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
          <figcaption className="mt-2 text-sm text-slate-600">VisuTry example showing the portrait, frame photo and resulting appearance preview.</figcaption>
          </figure>
          <div className="space-y-4 leading-7 text-slate-800 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_ul]:list-disc [&_ul]:ps-6">
            <h2>Start with the two photos</h2>
            <p>
              Have a frame in mind from an online store? Save its product link and find the front view in the
              color you are considering. Keep both rims and hinges in the crop. A side view or a screenshot
              of a model wearing the frame can hide the outline you want to compare.
            </p>
            <p>
              Take one straight-on portrait in even light, with your face uncovered and your current glasses
              off. In VisuTry, upload the portrait and add the product photo as a custom frame. Use the same
              portrait for a second frame so a change in your pose does not decide the comparison.
            </p>
            <GrowthFunnelLink
              href={localizedPath(locale, '/try-on/glasses')} sourcePage={localizedPath(locale, pathname)}
              destination="glasses-try-on" ctaLocation="photo-comparison"
              queryCluster="prescription-glasses-virtual-try-on" productPath="virtual_try_on" prefetch={false}
            >Try a frame on your photo</GrowthFunnelLink>
            <h2>Compare the shape, then the color</h2>
            <p>
              If you are choosing between a deep square frame and a narrow oval, look first at how much of
              your cheeks each outline covers and how the top edge follows your brows. When comparing two
              colors of the same model, keep the shape and size fixed. Check the seller’s photos under
              different lighting before choosing a finish.
            </p>
            <h2>What your visual preview actually demonstrates</h2>
            <p>
              A saved AI preview compares the appearance of a particular frame image under the same portrait and lighting. Record the seller’s model name, color and printed lens/bridge/temple numbers alongside the image: VisuTry does not verify those seller details or measure exact fit from a photograph.
            </p>
            <p>
              If you want to explore frame silhouettes rather than a store’s exact model, <Link href={localizedPath(locale, '/try-on/glasses/compare')}>Frame Compare</Link> uses built-in preset looks. That is a separate workflow from the exact-image Try-On above.
            </p>
            <h2>Check the physical frame before ordering</h2>
            <p>
              A photo preview can help you shortlist a look. It cannot measure bridge pressure, temple
              length or lens position. Find the exact model and size on the seller’s listing, compare the
              measurements with a comfortable pair, and ask the seller or your optician about your
              prescription and lens options. If two sizes share the same product image, the preview alone
              gives you no way to choose between them.
            </p>
            <p>
              For the next step, use the <Link href={localizedPath(locale, '/blog/prescription-glasses-online-shopping-guide-2025')}>prescription glasses order checklist</Link> or
              check <Link href={localizedPath(locale, '/glasses-guide/how-wide-should-glasses-be-for-my-face')}>how to compare frame widths</Link>.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
