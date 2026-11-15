import type { Metadata } from 'next'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { buyerSoftwareGuide } from '@/config/business-resources'

const canonicalPath = `/en${buyerSoftwareGuide.path}`
const canonical = `https://www.visutry.com${canonicalPath}`
const title = 'How to Choose Virtual Try-On Software for an Eyewear Store | VisuTry'
const description = buyerSoftwareGuide.description

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, siteName: 'VisuTry' },
  twitter: { card: 'summary', title, description },
}

const linkStyle = 'font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900'
const headingStyle = 'text-2xl font-semibold tracking-tight'

export default function BuyerSoftwareGuide({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(canonicalPath)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{buyerSoftwareGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            What does your shopper want to see? If they want to compare two colors of the same pair on their face,
            try a photo preview. If they want to turn their head and see the temples, test live augmented reality (AR).
            Then choose where they will do it, on a hosted catalog you can share or inside an existing product page.
          </p>
        </header>

        <section className="mt-12 max-w-3xl">
          <h2 className={headingStyle}>Photo or live AR? Check the view your shopper needs</h2>
          <p className="mt-3 leading-7 text-slate-700">
            <strong>Photo try-on.</strong> The shopper supplies a portrait and receives a still preview. Use the
            same portrait with two frame colors to compare the rims against the same face and lighting. Check the
            time to the first usable image and what happens if the first photo is too dark.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            <strong>Live AR.</strong> The shopper opens the camera and sees the virtual frame move with their head.
            Turn from straight ahead to a three-quarter view. Watch whether the bridge slips or the temples disappear.
            Decline camera access once and check what the shopper can do next.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            For either preview, keep the real frame and its measurements on hand. A shopper judging bridge comfort
            or temple pressure still needs a physical fitting.
          </p>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className={headingStyle}>Hosted or embedded? Follow one frame through your store</h2>
          <p className="mt-3 leading-7 text-slate-700">
            <strong>Hosted catalog.</strong> Shoppers open a separate link from your website, an appointment email
            or a showroom QR code. Choose this route when staff need a shareable collection. Try a frame and follow
            the return link all the way to the matching color on your own product page.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            <strong>Embedded try-on.</strong> A widget or app opens on your existing storefront. Choose this route
            when keeping the shopper on the product page matters. Ask the provider to demonstrate it on your theme,
            switch the variant, then add that exact color to the cart. Ask who keeps the frame assets in sync.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            Ask separately about photo and live support for the placement you want. For example, Fittingbox documents
            both modes in its website integration. Banuba documents live glasses try-on and offers a Shopify app
            and a web widget. Vendor documentation checked <time dateTime="2026-11-15">November 15, 2026</time>.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li><a href="https://fittingbox.com/en/resources/help-center/introduction" className={linkStyle}>Fittingbox Virtual Try-On Advanced integration guide</a></li>
            <li><a href="https://www.banuba.com/glasses-virtual-try-on" className={linkStyle}>Banuba glasses try-on and storefront options</a></li>
          </ul>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className={headingStyle}>How to compare two providers with the same frames</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-6 leading-7 text-slate-700">
            <li><strong>Bring the same two frames to each demo.</strong> Choose two different shapes and bring a second color of the first frame. Give each provider the same product photos, SKU, measurements and product URL for each variant. Ask which assets they can use and what an extra photo shoot or 3D model would cost.</li>
            <li><strong>Run the same shopping task.</strong> On the same phone, ask a colleague to open a frame, try both colors and find the product they would buy. Use the same portrait for photo tests and the same lighting for live tests. Record time to the first preview, failed attempts and the SKU they reach.</li>
            <li><strong>Check the ongoing work.</strong> Replace one frame photo and retire one color. Have a staff member repeat the update and record how long the storefront takes to reflect it. Ask how shopper photos are retained and deleted.</li>
            <li><strong>Request a quote for the same month.</strong> Give both providers your frame count, expected shopper sessions and images per shopper. Ask for setup, digitization, recurring fees and the result of hitting a limit. Save the two quotes beside your test results.</li>
          </ol>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className={headingStyle}>What can I test with VisuTry?</h2>
          <p className="mt-3 leading-7 text-slate-700">
            VisuTry offers a hosted Store with a free private preview. Add a frame photo and product link, check the
            catalog and try basic recommendations. An eligible paid plan enables shoppers to upload a portrait for
            photo try-on. One shopper who completes two frame images in a single AI-assisted visit uses one session
            and two images. Check both allowances against your test month.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            <Link href="/en/business/store" prefetch={false} className={linkStyle}>See how to set up a hosted Store</Link>
            {' or '}
            <Link href="/en/business/pricing" prefetch={false} className={linkStyle}>compare VisuTry plans and photo try-on allowances</Link>.
          </p>
        </section>
      </article>
    </main>
  )
}
