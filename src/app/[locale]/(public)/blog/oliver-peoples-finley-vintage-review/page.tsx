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
import { FaceAnalysisFunnelCTA } from '@/components/blog/FaceAnalysisFunnelCTA'

export const dynamic = 'force-static'

const pathname = '/blog/oliver-peoples-finley-vintage-review'
const cover = blogArt['oliver-peoples-finley-vintage-review']
const title = 'Oliver Peoples Finley Vintage: A Buying Guide to the OV5397U'
const description = 'Check the Finley Vintage model, color and measurements, compare its shape on your photo, and decide which fit questions to take to an optician.'
const publishedAt = '2025-10-21T15:00:00Z'
const updatedAt = '2026-11-16T00:00:00Z'
const articleTags = ['Oliver Peoples', 'Luxury Eyewear', 'Product Review', 'Designer Glasses', 'Premium Frames']

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
            A tortoiseshell finish can look almost solid brown from across a room and highly patterned up close. Start with the exact Finley Vintage color and size you like. The manufacturer’s product photographs are the reference for this guide.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            VisuTry Team · Published <time dateTime={publishedAt}>October 21, 2025</time> · Updated <time dateTime={updatedAt}>November 16, 2026</time>
          </p>
        </header>
        <figure className="my-7">
          <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} priority
            sizes="(min-width: 768px) 704px, calc(100vw - 40px)" className="mx-auto h-auto max-h-80 w-full object-contain" />
          <figcaption className="mt-2 text-sm text-slate-600">Unbranded VisuTry style example showing a mottled tortoiseshell finish. The official Finley photographs are linked below.</figcaption>
        </figure>
        <div className="prose prose-slate max-w-none prose-a:text-blue-700">
          <h2>Which Finley Vintage are you looking at?</h2>
          <p>
            Oliver Peoples identifies the optical frame as <strong>OV5397U</strong>. The linked finish is
            Semi-Matte Koa Tortoise (1799), an acetate frame made in Japan. The product details specify
            49 mm lenses, a 20 mm bridge and 145 mm temples for the 49–20 option. The brand also shows
            a wearer in a 52–20 size. Record the size selected on your own listing before comparing
            prices or interpreting a photograph. <a href="https://www.oliverpeoples.com/en-us/products/0ov5397u-1799">Official Finley Vintage photos, dimensions and details</a>.
          </p>
          <h2>What changes between the two sizes?</h2>
          <p>
            In a 52–20 pair, each lens is 3 mm wider than on a 49–20 pair. Both listings use the same
            nominal bridge measurement. Total frame width also depends on the rims and hinges. If it is
            missing from the listing, ask the seller for the hinge-to-hinge or outside width and check
            which measurement they mean.
          </p>
          <p>
            Compare the numbers inside a pair you already wear comfortably. At a fitting, look straight
            ahead, turn your head and smile. Notice whether the bridge slips or the lower rim touches
            your cheeks. These checks tell you more about physical fit than a face-shape label can.
          </p>
          <FaceAnalysisFunnelCTA
            locale={locale} tone="light" sourcePage={pathname} ctaLocation="oliver_peoples_intro"
            title="Compare the Finley silhouette on your face"
            body="For a visual comparison, use the front view of the exact color you saved. A free face-shape check is also available if you want a starting point."
          />
          <h2>Check the finish in more than one view</h2>
          <p>
            At the front, compare the contrast between the light and dark areas of the acetate. At the
            side, the manufacturer’s close-ups show a patterned metal core inside the temple. Save the
            front and side images together if this detail matters to you. A straight-on photo preview
            can help with the overall outline but shows little of the temple.
          </p>
          <h2>What would make this pair worth buying?</h2>
          <p>
            Ask for the total with the lenses you plan to order, any adjustment service and the return
            terms for a finished prescription pair. If you are deciding between this frame and a lighter
            colored alternative, compare both on one portrait first, then try the preferred size in
            person. A wear test is what establishes comfort over a working day.
          </p>
          <FaceAnalysisFunnelCTA
            locale={locale} sourcePage={pathname} ctaLocation="oliver_peoples_final_verdict"
            title="Compare your two shortlisted frames"
            body="Use a front-facing portrait and a product photo of each frame. For a useful comparison, keep your portrait and pose the same."
          />
        </div>
        <footer className="mt-8 border-t pt-4"><BlogTags locale={locale} tags={articleTags} /></footer>
      </article>
    </main>
  )
}
