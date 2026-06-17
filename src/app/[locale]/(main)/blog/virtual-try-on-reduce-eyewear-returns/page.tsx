import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, CheckCircle2, PackageCheck, ShoppingCart, UserCheck } from 'lucide-react'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { localizedPath } from '@/lib/localized-path'

const title = 'How Virtual Try-On Helps Online Eyewear Stores Reduce Returns'
const description = 'A practical guide for eyewear ecommerce teams on using virtual try-on to improve buyer confidence, set better expectations, and reduce avoidable frame-fit returns.'
const coverImage = '/blog-covers/virtual-try-on-reduce-returns.jpg'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as any,
    title,
    description,
    image: coverImage,
    pathname: '/blog/virtual-try-on-reduce-eyewear-returns',
    type: 'article',
  })
}

const structuredData = generateStructuredData('article', {
  title,
  description,
  publishedAt: '2026-05-27T10:00:00Z',
  modifiedAt: '2026-05-27T10:00:00Z',
  author: 'VisuTry Team',
  image: coverImage,
})

const benefits = [
  {
    icon: UserCheck,
    title: 'Better buyer confidence',
    body: 'A shopper who can preview frames on their own face has more context than a shopper judging only from product photos.',
  },
  {
    icon: ShoppingCart,
    title: 'Cleaner product expectations',
    body: 'Try-on helps customers understand frame shape, scale, and style before they commit to an order.',
  },
  {
    icon: PackageCheck,
    title: 'Fewer avoidable returns',
    body: 'Not every return is preventable, but style mismatch and uncertainty-driven orders are exactly where virtual try-on can help.',
  },
  {
    icon: BarChart3,
    title: 'More useful merchandising data',
    body: 'Try-on behavior can show which frames shoppers consider seriously, not just which products they click.',
  },
]

type BlogPostPageProps = {
  params: { locale: string }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: localizedPath(params.locale, '/blog') },
                { name: 'Virtual Try-On for Eyewear Returns' },
              ]}
            />
          </div>

          <article className="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="relative h-72 w-full overflow-hidden md:h-96">
              <Image
                src={coverImage}
                alt="Ecommerce dashboard showing virtual eyewear try-on and returns analytics"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="border-b p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>VisuTry Team</span>
                <span>Published May 27, 2026</span>
                <span>7 min read</span>
              </div>
              <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                How Virtual Try-On Helps Online Eyewear Stores Reduce Returns
              </h1>
              <p className="text-xl text-gray-600">
                Returns are not just a logistics problem. In eyewear ecommerce, many returns
                start earlier, when a buyer cannot tell whether a frame will actually suit them.
              </p>
            </div>

            <div className="prose prose-lg max-w-none p-8">
              <p>
                Online eyewear stores already invest in product photography, size charts, and
                frame measurements. Those assets matter, but they do not fully answer the
                buyer&apos;s core question: will this frame look right on me?
              </p>

              <p>
                Virtual try-on fills that gap. It gives shoppers a personal preview before
                checkout, which can reduce hesitation, improve order quality, and lower the
                number of avoidable returns caused by style mismatch.
              </p>

              <h2>What virtual try-on can and cannot fix</h2>
              <p>
                Virtual try-on is not a replacement for accurate prescriptions, lens options,
                shipping reliability, or customer service. It is strongest in the part of the
                purchase where shoppers are deciding whether a frame shape, size, and color
                feels right for their face.
              </p>

              <div className="not-prose grid gap-4">
                {benefits.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex gap-4 rounded-lg border border-gray-200 p-5">
                      <Icon className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h3>
                        <p className="text-gray-600">{item.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <h2>Where to place try-on in the shopping flow</h2>
              <ul>
                <li><strong>Product pages:</strong> let shoppers preview before comparing colors and sizes.</li>
                <li><strong>Collection pages:</strong> use try-on to narrow a large catalog into a shortlist.</li>
                <li><strong>Cart review:</strong> remind shoppers to preview before placing an order.</li>
                <li><strong>Post-purchase support:</strong> use try-on results to discuss style-fit questions before a return is started.</li>
              </ul>

              <h2>How smaller stores can start without a full 3D catalog</h2>
              <p>
                Many eyewear teams assume virtual try-on requires a large, fully modeled product
                catalog. That can be true for real-time AR. But photo-based AI try-on can be a
                lighter starting point because the store can test a small number of hero frames,
                seasonal bestsellers, or high-return styles first.
              </p>

              <p>
                VisuTry is built for this kind of lightweight adoption: upload a customer photo,
                upload or select a frame image, and generate a realistic preview. For stores, that
                means a faster path to testing whether try-on improves decision quality before
                committing to a heavier catalog build.
              </p>

              <div className="not-prose my-8 rounded-lg bg-green-600 p-6 text-white">
                <h3 className="mb-3 text-2xl font-bold">A simple rollout checklist</h3>
                <ul className="space-y-2">
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5" /> Start with high-traffic or high-return frame styles.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5" /> Add try-on near the primary product image, not hidden in a tab.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5" /> Track try-on usage alongside add-to-cart and return reasons.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5" /> Keep expectations honest: preview style and scale, not prescription accuracy.</li>
                </ul>
              </div>

              <h2>Bottom line</h2>
              <p>
                Virtual try-on reduces returns best when it is treated as a decision-quality tool,
                not just a visual gimmick. The goal is to help the buyer choose a frame they are
                less likely to regret after delivery.
              </p>

              <p>
                For the consumer side of this workflow, read our
                {' '}<Link href={localizedPath(params.locale, '/blog/prescription-glasses-virtual-tryon-guide')}>prescription glasses virtual try-on guide</Link>.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
