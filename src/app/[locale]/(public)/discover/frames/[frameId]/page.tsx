import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import Link from '@/components/layout/PublicLink'
import { getCanaryDiscoveryFrame, type CanaryDiscoveryFrame } from '@/modules/store/application/get-canary-discovery-frames'
import { buildMerchantExperienceHref } from '@/lib/commerce-handoff/merchant-experience-href'
import { shouldBypassMerchantImageOptimization } from '@/lib/is-loopback-image-url'

type CanaryFramePageProps = { params: { locale: string; frameId: string } }

/** Every request reuses the admitted source read models, never a separate stale page cache. */
export const dynamic = 'force-dynamic'

function description(frame: CanaryDiscoveryFrame): string {
  return `Explore ${frame.name}${frame.shape ? `, a ${frame.shape} frame` : ''}, in the VisuTry first-party discovery collection. This demonstration frame is not offered for sale; its image does not establish physical fit or comfort.`
}

function frameJsonLd(frame: CanaryDiscoveryFrame): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${frame.canonicalUrl}#product`,
    url: frame.canonicalUrl,
    name: frame.name,
    description: description(frame),
    ...(frame.imageUrl ? { image: [new URL(frame.imageUrl, frame.canonicalUrl).toString()] } : {}),
    ...(frame.shape ? { additionalProperty: [{ '@type': 'PropertyValue', name: 'Shape', value: frame.shape }] } : {}),
  }
}

export async function generateMetadata({ params }: CanaryFramePageProps): Promise<Metadata> {
  if (params.locale !== 'en') return { robots: { index: false, follow: false } }
  const frame = await getCanaryDiscoveryFrame(params.frameId)
  if (!frame) return { title: 'Frame not found | VisuTry', robots: { index: false, follow: false } }
  return {
    title: `${frame.name} | VisuTry Discovery Frame`,
    description: description(frame),
    alternates: { canonical: frame.canonicalUrl, languages: { en: frame.canonicalUrl, 'x-default': frame.canonicalUrl } },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      type: 'website', url: frame.canonicalUrl, title: `${frame.name} | VisuTry Discovery Frame`,
      description: description(frame),
      ...(frame.imageUrl ? { images: [{ url: new URL(frame.imageUrl, frame.canonicalUrl).toString(), alt: frame.name }] } : {}),
    },
  }
}

export default async function CanaryFramePage({ params }: CanaryFramePageProps) {
  if (params.locale !== 'en') notFound()
  setRequestLocale('en')
  const frame = await getCanaryDiscoveryFrame(params.frameId)
  if (!frame) notFound()

  const continuationHref = (path: string) => buildMerchantExperienceHref({
    path, surface: 'discover', campaign: 'canary-frame-detail',
  })

  return (
    <main lang="en" data-merchant-discovery-frame={frame.id} className="min-h-screen bg-[#f7f8fb] px-5 py-8 text-slate-950 sm:px-8 lg:px-10 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(frameJsonLd(frame)).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-5xl">
        <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.45)] sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-50">
            {frame.imageUrl ? (
              <Image src={frame.imageUrl} alt={`${frame.name} from ${frame.merchantName}`} fill priority sizes="(max-width: 1024px) 100vw, 52vw" className="object-contain p-8" unoptimized={shouldBypassMerchantImageOptimization(frame.imageUrl)} />
            ) : (
              <p className="flex h-full items-center justify-center p-8 text-sm text-slate-500">Frame image unavailable.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">VisuTry discovery collection</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{frame.name}</h1>
            <p className="mt-5 text-base leading-7 text-slate-600">{description(frame)}</p>
            {frame.shape ? <p className="mt-5 border-y border-slate-200 py-4 text-sm text-slate-700"><span className="font-semibold text-slate-950">Shape:</span> {frame.shape}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {frame.storePath ? <Link href={continuationHref(frame.storePath)} className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Explore the VisuTry Demo collection</Link> : null}
              {frame.campaignPath ? <Link href={continuationHref(frame.campaignPath)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:border-slate-500">Compare in Everyday Fit</Link> : null}
            </div>
            <p className="mt-5 text-xs leading-6 text-slate-500">A VisuTry-owned, non-sale demonstration frame. No measured fit, prescription suitability or physical comfort is promised.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
