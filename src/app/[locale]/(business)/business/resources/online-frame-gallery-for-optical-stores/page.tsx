import type { Metadata } from 'next'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ipadComparisonGuide, preVisitFrameGalleryGuide } from '@/config/business-resources'

const canonicalPath = `/en${preVisitFrameGalleryGuide.path}`
const canonical = `https://www.visutry.com${canonicalPath}`
const title = 'Online Frame Gallery for Optical Stores: Pre-Visit Guide | VisuTry'
const { description } = preVisitFrameGalleryGuide

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, siteName: 'VisuTry' },
  twitter: { card: 'summary', title, description },
}

const linkStyle = 'font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900'

export default function PreVisitFrameGalleryGuide({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(canonicalPath)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{preVisitFrameGalleryGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Give patients a link to a gallery of frames your optical shop carries. Each frame needs a recognizable photo,
            a model name your team can look up and a link to its details. Put the gallery in your appointment confirmation
            and invite patients to bring the names of two frames they would like to try in person.
          </p>
        </header>

        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold tracking-tight">See what a patient can browse</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Open the gallery on your phone and choose <strong>Explore the collection</strong>. Find a frame such as
            Akila Petal, then choose <strong>View product</strong> to open the retailer’s listing. A patient can bring
            that link or the model name to an appointment. Browsing this example requires no account or portrait.
          </p>
          <Link href="/en/store/framed-ewe" prefetch={false} className={`mt-4 inline-block ${linkStyle}`}>
            Browse the Framed EWE example gallery
          </Link>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            VisuTry built this demonstration from public catalog information. Confirm current stock directly with the shop.
          </p>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">How to prepare a gallery for a particular store</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-6 leading-7 text-slate-700">
            <li><strong>Choose frames the staff can find.</strong> Start with one location and a manageable selection from its display boards. Match each photo to the model and color on the temple or inventory label. Two colorways with similar names need distinguishable pictures.</li>
            <li><strong>Walk the path on a patient’s phone.</strong> In your private Store preview, read each model name and follow its product link. Check that the listing opens on the intended frame and that its size and color options are clear. Use the public Store address in patient messages after publishing is enabled for your plan.</li>
            <li><strong>Give the team a way to act on a choice.</strong> Ask the patient to bring the product link or call with the model and color. Staff can check that pair at the appointment location and offer to set it aside. Review the gallery when display stock or product links change.</li>
          </ol>
          <p className="mt-4 leading-7 text-slate-700">
            The <Link href="/en/business/store" prefetch={false} className={linkStyle}>hosted Store setup</Link> explains catalog
            preparation and previews. See <Link href="/en/business/pricing" prefetch={false} className={linkStyle}>merchant plan details</Link> for
            publishing and optional photo try-on.
          </p>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">What should the appointment message say?</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Put the published gallery link next to the appointment details you already send. This short invitation also works
            on a practice website. Replace the bracketed text with your shop’s details.
          </p>
          <blockquote className="mt-4 border-l-4 border-blue-200 pl-5 leading-7 text-slate-800">
            Before your visit to [location], browse our frames at [gallery link]. Bring the names or links of two pairs
            you like. If you want to try a specific color, call [store number] so we can check whether it’s here.
          </blockquote>
          <p className="mt-4 leading-7 text-slate-700">
            At the visit, ask which detail caught the patient’s eye. A preference for a particular color or rim shape gives
            the optician a starting pair and a reason to choose a second one. Use the physical frames to check bridge comfort,
            temple length and how the pair sits. If the patient is choosing between two pairs, you can
            {' '}<Link href={`/en${ipadComparisonGuide.path}`} prefetch={false} className={linkStyle}>compare frames together on a store iPad</Link>.
          </p>
        </section>
      </article>
    </main>
  )
}
