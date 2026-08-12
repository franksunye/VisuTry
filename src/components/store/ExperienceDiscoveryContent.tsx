import Image from 'next/image'
import { ExternalLink, Glasses, Store } from 'lucide-react'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'
import {
  buildExperienceDiscoveryJsonLd,
  serializeJsonLd,
} from '@/lib/store-discovery-seo'

function formatPrice(price: number | null, currency: string | null): string | null {
  if (price === null || price === undefined) return null
  const code = (currency || 'usd').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(price / 100)
  } catch {
    return `${(price / 100).toFixed(2)} ${code}`
  }
}

function factLabel(value: string | null): string | null {
  return value?.trim() || null
}

function externalLinkProps(url: string) {
  return {
    href: url,
    target: '_blank' as const,
    rel: 'noopener noreferrer',
  }
}

export function ExperienceDiscoveryContent({
  discovery,
  locale,
  pathname,
}: {
  discovery: PublicExperienceDiscovery
  locale: string
  pathname: string
}) {
  const { merchant, experience, frames } = discovery
  const title = experience.type === 'STORE'
    ? `Shop the ${merchant.name} eyewear collection`
    : experience.headline?.trim() || experience.name
  const description = experience.description?.trim()
  const heroImage = experience.heroAssetUrl || frames.find((frame) => frame.imageUrl)?.imageUrl
  const jsonLd = buildExperienceDiscoveryJsonLd({ discovery, pathname })

  return (
    <main
      lang={locale}
      data-presentation-mode={experience.type === 'CAMPAIGN' ? 'EDITORIAL_FIRST' : 'PRODUCT_FIRST'}
      className="bg-[#f7f8fb] text-slate-950"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <Store className="h-4 w-4" aria-hidden="true" />
              {merchant.name}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            {description ? <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p> : null}
            {merchant.referenceData || experience.referenceData ? (
              <p className="mt-5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                Reference catalog · VisuTry Reference
              </p>
            ) : null}
            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-500">
              {experience.type === 'CAMPAIGN'
                ? `A focused eyewear edit from ${merchant.name}. Review the featured frames and follow the merchant links for product details.`
                : `Browse selected frames from ${merchant.name}, with product facts and a direct destination to the merchant.`}
            </p>
          </div>

          {heroImage ? (
            <div className="relative aspect-[1.25] overflow-hidden rounded-[2rem] bg-slate-100 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.5)]">
              <Image
                src={heroImage}
                alt={`${merchant.name} eyewear collection`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="featured-frames" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Featured collection</p>
            <h2 id="featured-frames" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Featured frames</h2>
          </div>
          <p className="text-sm text-slate-500">{frames.length} frame{frames.length === 1 ? '' : 's'}</p>
        </div>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {frames.map((frame) => {
            const price = formatPrice(frame.price, frame.currency)
            const facts = [
              ['Shape', factLabel(frame.shape)],
              ['Material', factLabel(frame.material)],
              ['Color', factLabel(frame.color)],
              ['Width', factLabel(frame.widthClass)],
            ].filter((fact): fact is [string, string] => Boolean(fact[1]))

            return (
              <li key={frame.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-30px_rgba(15,23,42,0.6)]">
                  <div className="relative aspect-[4/3] bg-slate-50">
                    {frame.imageUrl ? (
                      <Image
                        src={frame.imageUrl}
                        alt={`${frame.name} by ${merchant.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-5"
                      />
                    ) : (
                      <Glasses className="absolute inset-0 m-auto h-10 w-10 text-slate-300" aria-label={`${frame.name} image unavailable`} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-slate-950">{frame.name}</h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{frame.brand || merchant.name}</p>
                    {facts.length > 0 ? (
                      <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                        {facts.map(([label, value]) => <li key={label}><span className="font-semibold text-slate-800">{label}:</span> {value}</li>)}
                      </ul>
                    ) : null}
                    {price ? <p className="mt-4 text-sm font-semibold text-slate-950">{price}</p> : null}
                    {frame.productUrl ? (
                      <a
                        {...externalLinkProps(frame.productUrl)}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                      >
                        View product <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="fit-context" className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Fit context</p>
            <h2 id="fit-context" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Find frames that suit your face</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              VisuTry’s interactive shopping experience can help you compare the selected frames on your own photo when that experience is available. Reading this collection does not create a session or use AI.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">About this collection</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{experience.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {description || `Selected eyewear from ${merchant.name}, presented with the catalog details available for this collection.`}
            </p>
          </div>
        </div>
      </section>

      {merchant.websiteUrl ? (
        <section aria-labelledby="merchant-destination" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 id="merchant-destination" className="sr-only">Merchant destination</h2>
          <a
            {...externalLinkProps(merchant.websiteUrl)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Visit {merchant.name} <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>
      ) : null}
    </main>
  )
}
