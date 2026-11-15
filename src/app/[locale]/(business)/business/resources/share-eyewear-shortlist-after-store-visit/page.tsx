import type { Metadata } from 'next'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { takeHomeShortlistGuide } from '@/config/business-resources'

const canonicalPath = `/en${takeHomeShortlistGuide.path}`
const canonical = `https://www.visutry.com${canonicalPath}`
const title = 'Take-Home Frame Shortlists for Opticians and Eyewear Stores | VisuTry'
const { description } = takeHomeShortlistGuide

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

export default function TakeHomeShortlistGuide({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(canonicalPath)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{takeHomeShortlistGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            When a shopper wants a second opinion, send them home with the specific frames they considered.
            Open their private Decision Result, invite them to scan the QR code with their own phone, and
            check that they recognize their choices before they leave the counter.
          </p>
        </header>

        <section className="mt-10 max-w-3xl">
          <h2 className={headingStyle}>What should go home with the shopper?</h2>
          <p className={paragraphStyle}>
            Include the model name and color the shopper can ask for, a product link for each candidate and a way to reach your shop.
            A customer choosing between two silhouettes might take home these two public demonstration listings:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-700">
            <li><Link href="/en/demo/frames/round" prefetch={false} className={linkStyle}>VT Rowan, round frame</Link> — the pair with a curved lower rim.</li>
            <li><Link href="/en/demo/frames/rectangle" prefetch={false} className={linkStyle}>VT Lane, rectangular frame</Link> — the pair with the straighter brow line.</li>
          </ul>
          <p className={paragraphStyle}>At your shop, check the actual color and size on the temple. Ask the shopper which model to pull first if they come back for a fitting.</p>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className={headingStyle}>Move the shopper’s own result to their phone</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-6 leading-7 text-slate-700">
            <li>In an eligible Store or Campaign journey, choose <strong>Open your private result</strong>. Review the recommended frames together. When the shopper has completed a comparison, the result also shows the frames they compared.</li>
            <li>Ask the shopper to scan the result QR with their phone. If they are already on their own device, they can use <strong>Copy link</strong>. Anyone with that private link can open the result until it expires, so let the shopper choose whom to share it with.</li>
            <li>On the phone, confirm the merchant name, the selected models and the expiry shown at the top. Follow a <strong>View product</strong> link if available. To keep a reference after the result expires, save the merchant’s public product URL or note the model and color.</li>
            <li>Once the shopper has the result, use <strong>New shopper</strong> on a shared Kiosk. Start the next visit only after the fresh store screen appears.</li>
          </ol>
        </section>

        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
          <h2 className={headingStyle}>What can the optician say at the counter?</h2>
          <blockquote className="mt-4 border-l-4 border-blue-200 pl-5 leading-7 text-slate-800">
            “Here are the frames we looked at. Scan this code and check you can see them on your phone.
            If you’d like another fitting, call us with the model and color so we can check it’s here.”
          </blockquote>
          <p className={paragraphStyle}>
            Decision Result and mobile continuation are available on eligible paid plans. The shopper controls the link handoff.
            A return fitting, stock hold or sale is confirmed separately by your shop.
            See <Link href="/en/business/pricing" prefetch={false} className={linkStyle}>plan and delivery details</Link> and
            the <Link href="/en/business/resources/ipad-frame-comparison-for-optical-stores" prefetch={false} className={linkStyle}>in-store iPad comparison workflow</Link>.
          </p>
        </section>
      </article>
    </main>
  )
}
