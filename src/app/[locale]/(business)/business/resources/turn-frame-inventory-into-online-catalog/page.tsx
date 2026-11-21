import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { framePhotoGuide, inventoryCatalogGuide } from '@/config/business-resources'

const canonicalPath = `/en${inventoryCatalogGuide.path}`
const canonical = `https://www.visutry.com${canonicalPath}`
const title = 'Build an Online Frame Catalog From an Inventory CSV | VisuTry'
const description = inventoryCatalogGuide.description

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, siteName: 'VisuTry' },
  twitter: { card: 'summary', title, description },
}

const frames = [
  { name: 'VT Rowan', sku: 'VT-DEMO-001', slug: 'round', image: 'round-classic.jpg' },
  { name: 'VT Lane', sku: 'VT-DEMO-002', slug: 'rectangle', image: 'rectangle-classic.jpg' },
] as const

const linkStyle = 'font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900'
const sectionTitle = 'text-2xl font-semibold tracking-tight'

export default function FrameInventoryGuide({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(canonicalPath)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{inventoryCatalogGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Export a small set of frames from your spreadsheet as a CSV. Give each row a frame name, a stable SKU and
            a link to a clear product photo. Add a product page so shoppers can follow a frame back to your shop.
            In VisuTry, you can inspect the rows before importing them and check the frames in your private Store preview.
          </p>
        </header>

        <section className="mt-10">
          <h2 className={sectionTitle}>Start with a two-frame CSV</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Open the file in your spreadsheet editor. The first row describes VT Rowan and the second describes VT Lane.
            Follow each product link below to compare the spreadsheet row with its photo and frame details.
            Both are VisuTry demonstration frames, so their price cells are empty.
          </p>
          <a href="/downloads/merchant/frame-inventory-example.csv" download className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800">
            Download the example CSV
          </a>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {frames.map((frame) => (
              <figure key={frame.sku} className="overflow-hidden rounded-xl border border-slate-200">
                <Image src={`/assets/glasses-presets/${frame.image}`} alt={`Product photo for ${frame.name}, a ${frame.slug} frame`} width={1024} height={682} sizes="(min-width: 640px) 380px, 100vw" className="h-auto w-full" />
                <figcaption className="px-4 py-3">
                  <Link href={`/en/demo/frames/${frame.slug}`} prefetch={false} className={linkStyle}>{frame.name} frame details</Link>
                  <span className="ml-2 inline-block text-sm text-slate-600">{frame.sku}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 leading-7 text-slate-700">
            See both in the wider <Link href="/en/store/visutry-demo-optical" prefetch={false} className={linkStyle}>VisuTry Demo Optical collection</Link>.
          </p>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className={sectionTitle}>Which fields should I export?</h2>
          <dl className="mt-4 space-y-4 leading-7 text-slate-700">
            <div><dt className="font-semibold text-slate-950">SKU and name</dt><dd>Use the SKU from your inventory system and the model name your staff recognize. If you list colors separately, use a distinct SKU, photo and product URL for each variant. The importer checks for repeated SKUs and product URLs.</dd></div>
            <div><dt className="font-semibold text-slate-950">Image URL and product URL</dt><dd>Put the direct photo address in <code>imageUrl</code> and the shopper-facing item page in <code>productUrl</code>. Test both in a signed-out window. For the photo, use the exact colorway, show the whole frame against a plain background and keep the rims, bridge and temples visible.</dd></div>
            <div><dt className="font-semibold text-slate-950">Shape, brand and price</dt><dd>A shape such as round or rectangle helps prepare the frame for recommendations. Include the brand and current price where you have them. Keep the CSV header row when you replace the examples with your own frames.</dd></div>
          </dl>
          <p className="mt-4 leading-7 text-slate-700">
            Before you upload, <Link href={`/en${framePhotoGuide.path}`} prefetch={false} className={linkStyle}>check a sample frame photo against the photography guide</Link>.
          </p>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className={sectionTitle}>How do I check the catalog before shoppers see it?</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-slate-700">
            <li>Open Catalog in your merchant workspace, choose <strong>Upload CSV</strong>, select your file and choose <strong>Inspect and preview</strong>.</li>
            <li>Check which rows are ready. Correct missing images, duplicate identifiers or mismatched product links in the spreadsheet and inspect the file again. Choose <strong>Approve and import</strong> when the proposed rows are correct.</li>
            <li>Open your private Store preview. Compare a photo to the frame on your shelf and follow its link to the correct product on your website. Publish the Store when your collection is ready to share.</li>
          </ol>
          <p className="mt-4 leading-7 text-slate-700">
            Read the <Link href="/en/business/store" prefetch={false} className={linkStyle}>eyewear retailer Store setup</Link> for the shopper journey.
            The <Link href="/en/business/pricing" prefetch={false} className={linkStyle}>merchant plans</Link> list catalog limits and eligibility for generative photo try-on.
          </p>
        </section>
      </article>
    </main>
  )
}
