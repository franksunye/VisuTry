import { generateBlogArticleSEO } from '@/lib/blog-seo'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/layout/PublicLink'
import { FaceAnalysisFunnelCTA } from '@/components/blog/FaceAnalysisFunnelCTA'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const slug = 'how-to-choose-glasses-for-your-face'
const pathname = `/blog/${slug}`
const title = 'How to Choose Glasses for Your Face Shape'
const description = 'Choose two frames to compare. See how rim shape, depth and color change the look, then check the size and bridge fit before ordering.'
const publishedAt = '2025-10-15T10:00:00Z'
const updatedAt = '2026-11-16T00:00:00Z'
const art = blogArt[slug]

const frameQuestions = [
  {
    question: 'What if I fall between two face shapes?',
    answer: 'Pick one feature you want to emphasize. If you have a rounded jaw and a longer face, for example, compare a shallow rectangle with a deeper rectangle in a similar width and color. Look at where each lower rim sits on your cheek.',
  },
  {
    question: 'What matters if I like the look of both frames?',
    answer: 'Try both on in person if possible. Check whether the bridge slips, whether the sides press at your temples and whether the lower rims touch your cheeks when you smile. For an online order, check the seller’s adjustment and return terms.',
  },
]

const article = generateStructuredData('article', {
  title, description, publishedAt, modifiedAt: updatedAt,
  author: 'VisuTry Team', image: `${SITE_CONFIG.url}${art.src}`,
})
const faq = generateStructuredData('faqPage', { questions: frameQuestions })

type PageProps = { params: { locale: Locale } }

export function generateMetadata({ params: { locale } }: PageProps): Metadata {
  return generateBlogArticleSEO({
    locale, title, description, pathname, type: 'article',
    image: art.src, imageAlt: art.alt, imageWidth: art.width, imageHeight: art.height,
  })
}

export default function BlogPostPage({ params: { locale } }: PageProps) {
  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <Breadcrumbs items={[{ name: 'Blog', url: localizedPath(locale, '/blog') }, { name: title }]} />
        <article lang="en" dir="ltr" className="mt-6">
          <header>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Start with a pair you like. What would you change about the way it looks on you?
              A straighter top edge can draw attention to your brows. A thinner, lighter rim lets
              more of your face show. Choose a second frame that changes the detail you care about.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              VisuTry Team · Published <time dateTime={publishedAt}>October 15, 2025</time> · Updated <time dateTime={updatedAt}>November 16, 2026</time>
            </p>
          </header>

          <div className="prose prose-slate mt-8 max-w-none prose-a:text-blue-700">
            <h2>Choose two frames to try</h2>
            <p>
              Start with the outline you see in the mirror. These pairings give you two looks
              to compare at the counter or on a shortlist. Keep the widths similar so that an
              oversized sample does not decide the comparison for you.
            </p>
            <ul>
              <li><strong>Round cheeks or a rounded jaw.</strong> Try a softly rounded frame beside a rectangle with a level top rim. The first echoes the curve of your cheeks. The second adds a straighter line above them.</li>
              <li><strong>A square or angular jaw.</strong> Compare an oval rim with a square frame that has rounded corners. Look at how the corners line up with your jaw. You may like the repeated angles as much as the softer curve.</li>
              <li><strong>A longer or oblong outline.</strong> Try a shallow rectangle and a deeper one in a similar width. Look at how much cheek you see below each rim. You can change lens depth without choosing a wider frame.</li>
              <li><strong>A wider forehead and a narrower chin.</strong> Compare a fine metal rim with a darker browline. Pay attention to the upper corners. Which pair gives your brows the emphasis you want?</li>
            </ul>
            <p>
              For examples grouped by oval, diamond, triangle and other outlines, browse the{' '}
              <Link href={localizedPath(locale, '/glasses-for-face-shape')}>frame guide by face shape</Link>.
              If you have a round face and like round frames, the{' '}
              <Link href={localizedPath(locale, '/glasses-guide/do-round-glasses-suit-a-round-face')}>round-frame comparison</Link>{' '}
              shows how size and rim weight change that look.
            </p>

            <h2>Look at the upper rim first</h2>
            <figure>
              <Image
                src={art.src} alt={art.alt} width={art.width} height={art.height}
                sizes="(min-width: 768px) 704px, calc(100vw - 40px)"
                className="m-0 h-auto w-full rounded-xl"
              />
              <figcaption>
                On the left, the dark top edge is easy to follow across the brows. On the right,
                the pale, rounded rims nearly disappear at the sides. Both color and outline change
                in this example. To see which you prefer, try the same frame in two colors next.
              </figcaption>
            </figure>

            <h2>Check the measurements and the bridge</h2>
            <p>
              Use a comfortable pair as a reference. The three numbers inside a temple usually
              give the lens width, bridge width and temple length in millimetres. The first number
              describes one lens. For the full front width, look up the model or measure across an
              existing pair, then use the seller’s measurement diagram to compare like with like.
              The <Link href={localizedPath(locale, '/glasses-guide/how-wide-should-glasses-be-for-my-face')}>frame width guide</Link> shows which dimensions to compare.
            </p>
            <p>
              Choose the bridge by how it sits on your nose. If a frame slides down or leaves a
              pressure point, an optician can check the bridge or nose pads. A face-shape label
              or a try-on photo cannot tell you how that contact feels.
            </p>

            <h2>Common questions</h2>
            {frameQuestions.map(({ question, answer }) => (
              <div key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </div>
            ))}

            <FaceAnalysisFunnelCTA
              locale={locale}
              sourcePage={localizedPath(locale, pathname)}
              tone="light"
              title="See the frames on your own face"
              body="If you want a starting shape, use the free detector. If you already have two frame photos, take one front-facing portrait and preview each frame on it."
            />
            <p>
              For a personalized report, the{' '}
              <Link href={localizedPath(locale, '/blog/ai-face-analysis-for-glasses-guide')}>photo-based glasses guide</Link>{' '}
              explains what the free detector shows and what you can unlock in Face Analysis.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
