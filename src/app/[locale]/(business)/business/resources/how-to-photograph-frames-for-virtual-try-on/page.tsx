import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { framePhotoGuide } from '@/config/business-resources'

const path = `/en${framePhotoGuide.path}`
const url = `https://www.visutry.com${path}`
const title = 'How to Photograph Eyeglass Frames for Virtual Try-On | VisuTry'
const { description } = framePhotoGuide

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { type: 'article', title, description, url, siteName: 'VisuTry' },
  twitter: { card: 'summary', title, description },
}

const linkStyle = 'font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900'
const samplePhoto = '/assets/glasses-presets/rectangle-classic.jpg'

export default function FramePhotos({ params }: { params: { locale: string } }) {
  if (params.locale !== 'en') permanentRedirect(path)
  setRequestLocale(params.locale)

  return (
    <main className="bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <Link href="/en/business/resources" prefetch={false} className={linkStyle}>Business resources</Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{framePhotoGuide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            For photo-based eyewear try-on, choose a clear, straight-on picture of the exact frame and color you sell.
            Keep both outer corners, the full lens outlines and the bridge in view. This is the retailer’s product image.
            The shopper supplies their own portrait when they start photo try-on.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">Can you see both hinges?</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Compare these two views of the same VT Lane product image. Look for the small silver detail at each outer corner.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-xl border border-slate-200">
              <Image src={samplePhoto} width={1024} height={682} alt="Full VT Lane frame with both silver corner details visible."
                sizes="(min-width: 640px) 410px, 100vw" className="h-auto w-full" />
              <figcaption className="border-t border-slate-100 p-4 leading-6 text-slate-700">
                <strong className="block text-slate-950">Keep the full frame.</strong> Both hinges sit inside the image, and you can follow the lower rim from the bridge to either corner.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-hidden">
                <Image src={samplePhoto} width={1024} height={682} alt="Enlarged crop of VT Lane cutting off the two outer hinges."
                  sizes="(min-width: 640px) 410px, 100vw" className="h-auto w-full scale-150" />
              </div>
              <figcaption className="border-t border-slate-100 p-4 leading-6 text-slate-700">
                <strong className="block text-slate-950">Retake a clipped frame.</strong> The bridge remains visible in this crop, but the hinge details are gone. Step back or use the uncropped original.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">How should I set up the shot?</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-slate-700">
            <li><strong>Level the camera with the bridge.</strong> Set the frame on a stable surface. Center the bridge and keep the camera square to the front. If one lens looks narrower in the picture than on the physical frame, recheck the angle.</li>
            <li><strong>Separate the rim from the background.</strong> Use a plain, matte surface. For clear acetate, try a light gray background that gives the outline definition. Move or soften the light if a bright reflection hides the bridge or lens edge.</li>
            <li><strong>Keep the photographed colorway with its SKU.</strong> Record the product code while the pair is still on the table. Check frame color, lens tint, bridge details and finish against the sample before you shoot the next variant.</li>
          </ol>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">How do I check the photo in my catalog?</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Open the direct image link in a signed-out browser and compare it with the frame on your product page. In the
            private Store preview, repeat the check at phone size. Someone unfamiliar with the shot should be able to pick
            the correct frame and color from your counter.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            The <Link href="/en/business/resources/turn-frame-inventory-into-online-catalog" prefetch={false} className={linkStyle}>sample inventory CSV</Link> includes
            this exact photo and its matching <Link href="/en/demo/frames/rectangle" prefetch={false} className={linkStyle}>VT Lane frame details</Link>.
            If you also need a live AR model, ask your provider for its capture specification before photographing the whole collection.
          </p>
        </section>
      </article>
    </main>
  )
}
