import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/layout/PublicLink'
import { FaceAnalysisFunnelCTA } from '@/components/blog/FaceAnalysisFunnelCTA'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { generateI18nSEO, generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const pathname = '/blog/best-ai-virtual-glasses-tryon-tools-2025'
const title = 'Virtual Glasses Try-On Tools Compared: Warby Parker, Zenni and VisuTry'
const description = 'Compare three virtual glasses try-on tools. See which accepts a frame screenshot, which offers a live camera preview, and what to check before ordering.'
const publishedAt = '2025-10-14T10:00:00Z'
const modifiedAt = '2026-11-16T00:00:00Z'
const cover = blogArt['best-ai-virtual-glasses-tryon-tools-2025']
type PageProps = { params: { locale: Locale } }

const questions = [
  {
    question: 'Which tool can use a screenshot of glasses from another store?',
    answer: 'VisuTry accepts a frame image or retailer screenshot along with a portrait. Crop the screenshot to show the whole front of one frame and keep the original listing handy for the model, color and size.',
  },
  {
    question: 'Can I try on Zenni frames without a live camera?',
    answer: 'Yes. Zenni’s help guide lists an uploaded portrait as an alternative to its live camera. You still choose the frame from Zenni’s catalog.',
  },
  {
    question: 'How do I tell if the glasses will actually fit?',
    answer: 'Compare the listed frame width, bridge and temple length with a pair you wear comfortably. A preview can show a silhouette. It cannot tell you how the bridge will feel or whether the temples will press. An optician can check the fit and lens positioning.',
  },
]

export function generateMetadata({ params }: PageProps): Metadata {
  return generateI18nSEO({
    locale: params.locale, pathname, title, description, type: 'article',
    image: cover.src, imageAlt: cover.alt, imageWidth: cover.width, imageHeight: cover.height,
  })
}

const articleSchema = generateStructuredData('article', {
  title, description, publishedAt, modifiedAt,
  author: 'VisuTry Team', image: `${SITE_CONFIG.url}${cover.src}`,
})
const faqSchema = generateStructuredData('faqPage', { questions })

export default function BlogPostPage({ params: { locale } }: PageProps) {
  const photoGuide = localizedPath(locale, '/try-glasses-on-photo')
  const textLink = 'font-medium text-blue-700 underline underline-offset-2'
  const sectionHeading = 'text-2xl font-semibold leading-tight text-slate-950'

  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Breadcrumbs items={[
          { name: 'Blog', url: localizedPath(locale, '/blog') },
          { name: 'Virtual glasses try-on tools' },
        ]} />
        <article lang="en" dir="ltr" className="mt-6 space-y-8 leading-7 text-slate-800">
          <header>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
            <p className="mt-4 text-lg leading-8">
              If the frame is already in your shopping cart, start with the retailer’s try-on button.
              If you found two pairs at different stores, a tool that accepts frame photos lets you
              compare both on the same portrait. Here is how to choose between the three.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              VisuTry Team · Published <time dateTime={publishedAt}>October 14, 2025</time> · Updated{' '}
              <time dateTime={modifiedAt}>November 16, 2026</time>
            </p>
          </header>
          <figure>
            <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} priority
              sizes="(min-width: 896px) 832px, calc(100vw - 40px)" className="h-auto w-full rounded-xl" />
            <figcaption className="mt-2 text-sm text-slate-600">Editorial illustration of a virtual glasses preview.</figcaption>
          </figure>
          <section className="space-y-4">
            <h2 className={sectionHeading}>Where does the frame come from?</h2>
            <table className="w-full table-fixed border-collapse text-start text-sm leading-6 sm:text-base">
              <caption className="pb-3 text-start text-slate-600">U.S. website workflows checked November 16, 2026.</caption>
              <thead>
                <tr className="border-y bg-slate-50">
                  <th scope="col" className="w-1/4 px-2 py-3 text-start">Tool</th>
                  <th scope="col" className="w-1/3 px-2 py-3 text-start">Frame source</th>
                  <th scope="col" className="px-2 py-3 text-start">How you preview it</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b">
                  <th scope="row" className="px-2 py-3 text-start">Warby Parker</th>
                  <td className="px-2 py-3">A Warby Parker listing</td>
                  <td className="px-2 py-3">Open the virtual mirror from the frame page on a phone, tablet or computer.</td>
                </tr>
                <tr className="border-b">
                  <th scope="row" className="px-2 py-3 text-start">Zenni</th>
                  <td className="px-2 py-3">A Zenni listing</td>
                  <td className="px-2 py-3">Use the live camera, or upload a portrait to see the same catalog frame.</td>
                </tr>
                <tr className="border-b">
                  <th scope="row" className="px-2 py-3 text-start">VisuTry</th>
                  <td className="px-2 py-3">Your frame photo or retailer screenshot</td>
                  <td className="px-2 py-3">Add a front-facing portrait and generate a still image. Reuse the portrait for your next frame.</td>
                </tr>
              </tbody>
            </table>
            <p>
              We checked the providers’ published instructions and the public starting points below. The comparison
              covers inputs, frame selection and device options. Zenni describes its live camera mode as augmented reality (AR). VisuTry uses photo-based AI to generate a still preview. Image quality and fit accuracy were not measured.
            </p>
          </section>
          <section className="space-y-4">
            <h2 className={sectionHeading}>Try a frame from a retailer’s catalog</h2>
            <p>
              <strong>Warby Parker.</strong> On the{' '}
              <a className={textLink} href="https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal">Percey in Chestnut Crystal</a>{' '}
              listing, look for “Try on virtually” beside the frame photos. Keep the width you selected in mind when
              you return to the product page. Warby Parker’s{' '}
              <a className={textLink} href="https://www.warbyparker.com/ways-to-try">Ways to Try guide</a>{' '}
              explains the browser option and the additional saved-favorites feature in its app.
            </p>
            <p>
              <strong>Zenni.</strong> The{' '}
              <a className={textLink} href="https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621">black rectangle frame #4413621</a>{' '}
              has a “Try On” button. If your desktop has no webcam, a saved face photo is an option.
              Zenni’s <a className={textLink} href="https://www.zennioptical.com/help/frames-fitting/virtual-try-on">Virtual Try-On guide</a>{' '}
              describes both inputs and how to enable camera access.
            </p>
          </section>
          <section className="space-y-4">
            <h2 className={sectionHeading}>Compare frames from two different shops</h2>
            <p>
              Suppose you have one black rectangular pair and one translucent cat-eye pair bookmarked.
              Save a clear front view of each, then use the same evenly lit portrait for both previews.
              Check where the top rims sit relative to your brows and how far each corner extends toward
              your temples. Keep the product tabs open to check the actual measurements afterward.
            </p>
            <p>
              Follow VisuTry’s <Link className={textLink} href={photoGuide}>photo and frame upload guide</Link>.
              If you are still deciding which shapes to shortlist, start with the{' '}
              <Link className={textLink} href={localizedPath(locale, '/blog/how-to-choose-glasses-for-your-face')}>glasses and face shape guide</Link>. For individualized frame suggestions, VisuTry also offers a{' '}
              <Link className={textLink} href={localizedPath(locale, '/face-analysis')}>credit-based AI glasses advisor</Link>.
            </p>
            <FaceAnalysisFunnelCTA locale={locale} tone="light" title="Try your shortlisted frames"
              body="Bring a portrait and a front view of the frame you want to preview. If you are still choosing a shape, start with the free detector." />
          </section>
          <section className="space-y-4">
            <h2 className={sectionHeading}>Before you place an order</h2>
            <p>
              Zoom in on the original listing for details a preview can smooth over, such as the bridge profile,
              hinge design and translucent edges. Check that the seller offers the color and size you previewed.
              For prescription lenses, use the{' '}
              <Link className={textLink} href={localizedPath(locale, '/blog/prescription-glasses-online-shopping-guide-2025')}>ordering checklist</Link>{' '}
              to compare the finished price and return terms.
            </p>
            {locale === 'en' && (
              <p>Evaluating try-on for a shop? See how a retailer can{' '}
                <Link className={textLink} href="/en/business/store">offer previews of its own frames</Link>.
              </p>
            )}
          </section>
          <section className="space-y-5">
            <h2 className={sectionHeading}>Common questions</h2>
            {questions.map(({ question, answer }) => (
              <div key={question}>
                <h3 className="text-lg font-semibold text-slate-950">{question}</h3>
                <p className="mt-1">{answer}</p>
              </div>
            ))}
          </section>
          <FaceAnalysisFunnelCTA locale={locale} />
        </article>
      </div>
    </main>
  )
}
