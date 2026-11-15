import type { Metadata } from 'next'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ipadComparisonGuide } from '@/config/business-resources'

const canonicalPath = `/en${ipadComparisonGuide.path}`
const canonical = `https://www.visutry.com${canonicalPath}`
const title = 'An iPad Frame Comparison Workflow for Optical Stores | VisuTry'
const { description } = ipadComparisonGuide

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, siteName: 'VisuTry' },
  twitter: { card: 'summary', title, description },
}

const linkStyle = 'font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900'
const headingStyle = 'text-2xl font-semibold tracking-tight'
const paragraphStyle = 'mt-3 leading-7 text-slate-700'

export default function KioskComparisonGuide({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(canonicalPath)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{ipadComparisonGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            At the dispensing table, put two physical frames beside the iPad and open the same two models in your store’s catalog.
            With photo try-on enabled, show both previews on the same portrait. Let the shopper choose which pair to put on again,
            then check the bridge, temples and lens position with the actual frame.
          </p>
          <Link href="/en/business/resources#product-demo" prefetch={false} className={`mt-4 inline-block ${linkStyle}`}>Watch the in-store product demo</Link>
        </header>

        <section className="mt-10 max-w-3xl">
          <h2 className={headingStyle}>Set up the shared iPad before the first appointment</h2>
          <p className={paragraphStyle}>
            Open your store’s configured Kiosk experience in the browser. Match each frame on the counter to its catalog photo, color
            and model number. Choose a place with even light and seat the shopper where they can see the tablet without leaning forward.
          </p>
          <p className={paragraphStyle}>
            For a staff rehearsal, use the round <Link href="/en/demo/frames/round" prefetch={false} className={linkStyle}>VT Rowan</Link> and the
            rectangular <Link href="/en/demo/frames/rectangle" prefetch={false} className={linkStyle}>VT Lane</Link> as a reference pair.
            Rowan’s rounded lower rim and Lane’s straight upper line give the shopper a visible difference to discuss.
            Use your own stocked models for the appointment.
          </p>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className={headingStyle}>Run one side-by-side comparison</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-6 leading-7 text-slate-700">
            <li><strong>Ask what the shopper wants to compare.</strong> A question such as “Which brow line do you prefer?” works with two styles in the same color. To compare colors, use two variants of the same model.</li>
            <li><strong>Keep the portrait consistent.</strong> With the shopper’s permission, use their front-facing photo in the enabled try-on flow. Select both frames, generate the two previews and open <strong>Compare 2 results</strong> when both images are ready.</li>
            <li><strong>Return to the frame tray.</strong> Ask the shopper what made one preview stand out. Put that model back on and check physical comfort and fit. If they want more time, open the private result and let them scan it onto their phone.</li>
            <li><strong>Hand over a clean screen.</strong> On the Kiosk result, choose <strong>New shopper</strong>. Confirm the fresh store screen is visible before another person uses the iPad. If the reset needs a retry, keep the tablet with staff until it clears.</li>
          </ol>
        </section>

        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
          <h2 className={headingStyle}>Which setup supports the counter workflow?</h2>
          <p className={paragraphStyle}>
            The shared-device Kiosk profile is included with Scale and available as an arranged add-on for Launch or Growth.
            Two generated previews require capacity for two images in that shopper’s session. Check the store’s per-shopper limit
            and remaining allowance when preparing the iPad.
          </p>
          <p className={paragraphStyle}>
            See <Link href="/en/business/pricing" prefetch={false} className={linkStyle}>merchant plans and Kiosk availability</Link> or
            follow the <Link href="/en/business/resources/share-eyewear-shortlist-after-store-visit" prefetch={false} className={linkStyle}>take-home shortlist handoff</Link>.
          </p>
        </section>
      </article>
    </main>
  )
}
