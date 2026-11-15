import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { shoppableLookbookGuide } from '@/config/business-resources'

const path = `/en${shoppableLookbookGuide.path}`
const url = `https://www.visutry.com${path}`
const title = 'How to Make a Shoppable Eyewear Lookbook | VisuTry'
const { description } = shoppableLookbookGuide

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { type: 'article', title, description, url, siteName: 'VisuTry' },
  twitter: { card: 'summary', title, description },
}

const looks = [
  { name: 'VT Rowan', description: 'A round rim gives the collection a softer outline.', image: 'round-classic.jpg', path: '/en/demo/frames/round' },
  { name: 'VT Lane', description: 'A straight brow and rectangular lenses give the second look a sharper line.', image: 'rectangle-classic.jpg', path: '/en/demo/frames/rectangle' },
] as const

const linkStyle = 'font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900'

export default function ShoppableLookbook({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(path)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{shoppableLookbookGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Choose the frames in your launch, arrange them around a styling idea, and pair each look with the name, color and
            link for the exact frame pictured. A shopper who spots a pair they like can go directly to that item on your website.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">A two-frame lookbook you can open</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            These two VisuTry demo frames illustrate a simple collection story about silhouette. Open either frame to see
            how its caption connects a look to an individual product. The demo pages show frame details only.
          </p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {looks.map((look) => (
              <li key={look.path} className="overflow-hidden rounded-xl border border-slate-200">
                <Image src={`/assets/glasses-presets/${look.image}`} width={1024} height={682}
                  alt={`${look.name} seen from the front`} sizes="(min-width: 640px) 410px, 100vw" className="h-auto w-full" />
                <div className="border-t border-slate-100 p-4">
                  <h3 className="text-lg font-semibold">{look.name}</h3>
                  <p className="mt-1 text-slate-700">{look.description}</p>
                  <Link href={look.path} prefetch={false} className={`mt-3 inline-block ${linkStyle}`}>See {look.name} frame details</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">What goes beside each launch image?</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-slate-700">
            <li><strong>Match each look to one variant.</strong> Record its model, frame and lens colors, product link and image. When a photograph shows two people, label both pairs so shoppers know which link opens each look.</li>
            <li><strong>Give the collection a reason to browse.</strong> Lead with one hero frame. Use the next look to show a distinct silhouette, finish or color. A short caption can point out the change while the frame details stay beside the link.</li>
            <li><strong>Check the mobile shopping path.</strong> Follow every link on your phone. Compare the destination’s color selector to the launch image and check what shoppers will see if a color sells out.</li>
          </ol>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">How do I share just this collection?</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Use the same collection address in your launch email and social profile so either opens the featured edit.
            On an eligible VisuTry plan, a Campaign groups selected catalog frames under one address and can return shoppers
            to the brand’s product pages. Check the active Campaign allowance in <Link href="/en/business/pricing" prefetch={false} className={linkStyle}>merchant pricing</Link>.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            Open <Link href="/en/c/akila/statement-frames" prefetch={false} className={linkStyle}>AKILA · Statement Frames</Link> and
            look at Tracer and Pulse. Each has its own color description and product link. VisuTry assembled this reference
            experience from public catalog information. See <Link href="/en/business/campaigns" prefetch={false} className={linkStyle}>how to plan a collection Campaign</Link>.
          </p>
        </section>
      </article>
    </main>
  )
}
