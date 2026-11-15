import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { eyewearFaceShapeGuide } from '@/config/business-resources'

const canonicalPath = `/en${eyewearFaceShapeGuide.path}`
const canonical = `https://www.visutry.com${canonicalPath}`
const title = 'Showing Eyewear on Different Face Shapes With AI | VisuTry'
const description = eyewearFaceShapeGuide.description

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, siteName: 'VisuTry' },
  twitter: { card: 'summary', title, description },
}

const linkStyle = 'font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900'

export default function FaceShapeGuide({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(canonicalPath)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{eyewearFaceShapeGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Pick one frame and keep its color and size fixed. For product photos, photograph models wearing that pair with the
            same framing and lighting. For shoppers who want to see it on their own face, offer photo try-on from your catalog.
            A shopper chooses a frame, supplies a portrait and sees a visual preview before returning to your product page.
          </p>
        </header>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight">What changes when two people try the same frame?</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Start with the Rectangle preset in the top left of each results panel below. Look at where its outer corners sit
            relative to each person’s cheekbones and how closely its top rim follows the brows. Then look at Browline on
            the same face to see what a heavier upper rim changes.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <figure>
              <Image src="/assets/marketing/compare-slide-woman.png" alt="First demo portrait with Rectangle, Browline, Wayfarer and Geometric frame previews." width={1024} height={660} sizes="(min-width: 768px) 460px, 100vw" className="h-auto w-full rounded-xl border border-slate-200" />
              <figcaption className="mt-2 text-sm text-slate-600">First portrait. Compare the rectangle’s upper rim with the browline frame beside it.</figcaption>
            </figure>
            <figure>
              <Image src="/assets/marketing/compare-slide-man.png" alt="Second demo portrait with the same four frame presets in the same order." width={1024} height={659} sizes="(min-width: 768px) 460px, 100vw" className="h-auto w-full rounded-xl border border-slate-200" />
              <figcaption className="mt-2 text-sm text-slate-600">Second portrait. Follow the same rectangle out to the temples.</figcaption>
            </figure>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            These are VisuTry product demonstrations with frame presets. Use the previews to discuss appearance.
            Check the manufacturer’s frame measurements and use an in-person fitting for bridge comfort or temple pressure.
          </p>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">How do I offer try-on with frames my shop carries?</h2>
          <ol className="mt-5 list-decimal space-y-4 pl-6 leading-7 text-slate-700">
            <li><strong>Choose one exact variant.</strong> Use its front-facing product photo, name, color and product link. Keep a separate photo for each colorway so the image matches the item the shopper can buy.</li>
            <li><strong>Check the private Store preview.</strong> Add the frame to your catalog, check the image and follow its link back to the correct product. Free setup includes the private preview and basic recommendations. Generative photo try-on requires an eligible paid plan.</li>
            <li><strong>Give shoppers the Store link.</strong> Once your Store is published with photo try-on enabled, a shopper can select the frame and try it with their own clear, front-facing photo. Even within one face-shape category, head angle and the position of the brows change how the rim looks.</li>
          </ol>
          <p className="mt-4 leading-7 text-slate-700">
            See the <Link href="/en/business/store" prefetch={false} className={linkStyle}>hosted Store setup</Link> and
            the <Link href="/en/business/pricing" prefetch={false} className={linkStyle}>merchant plans and photo try-on allowances</Link>.
          </p>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">What if I need model images for a product listing?</h2>
          <p className="mt-3 leading-7 text-slate-700">
            A listing needs a consistent set of images you can publish. Plan a shoot with people who have agreed to that use,
            or use a dedicated product photography service and review the images against the real frame. Check the lens outline,
            bridge, hinges and color in each image. A shopper’s try-on photo belongs in their own shopping journey.
          </p>
          <p className="mt-4 leading-7 text-slate-700">
            To see how an eyewear collection can link each frame back to its product details, browse
            the <Link href="/en/c/lowercase-nyc/find-your-frame" prefetch={false} className={linkStyle}>Lowercase NYC reference experience</Link>.
            VisuTry assembled this example from public catalog information.
          </p>
        </section>
      </article>
    </main>
  )
}
