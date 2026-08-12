import Image from 'next/image'
import { ExternalLink, Glasses, Sparkles, Store } from 'lucide-react'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'
import {
  buildExperienceDiscoveryJsonLd,
  serializeJsonLd,
} from '@/lib/store-discovery-seo'
import { buildStoreOutboundUrl, type StoreOutboundLinkType } from '@/lib/store-outbound-links'

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

function externalLinkProps(
  url: string,
  experienceType: 'STORE' | 'CAMPAIGN',
  experienceSlug: string,
  linkType: StoreOutboundLinkType,
) {
  return {
    href: buildStoreOutboundUrl(url, { experienceType, experienceSlug, linkType }),
    target: '_blank' as const,
    rel: 'noopener noreferrer',
  }
}

function ExperienceHeroVisual({
  experience,
  merchantName,
  heroImage,
  mode,
}: {
  experience: PublicExperienceDiscovery['experience']
  merchantName: string
  heroImage: string | null | undefined
  mode: 'EDITORIAL_FIRST' | 'PRODUCT_FIRST'
}) {
  const heroTitle = experience.type === 'CAMPAIGN'
    ? experience.name
    : `Shop the ${merchantName} eyewear collection`
  const heroDescription = experience.description?.trim() || `Selected eyewear from ${merchantName}.`
  const heroBackground = mode === 'EDITORIAL_FIRST'
    ? 'bg-[linear-gradient(145deg,#f6eadf,#f7f1e8)]'
    : 'bg-[linear-gradient(145deg,#edf3fb,#faf7f2)]'

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] ${heroBackground} ${mode === 'EDITORIAL_FIRST' ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}
    >
      {heroImage ? (
        <Image
          src={heroImage}
          alt={`${merchantName} eyewear collection`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-slate-950/10" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/18 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8">
        <p className="font-serif text-2xl font-semibold sm:text-3xl">{heroTitle}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/85">{heroDescription}</p>
      </div>
    </div>
  )
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
  const isCampaign = experience.type === 'CAMPAIGN'
  const presentationMode = isCampaign ? 'EDITORIAL_FIRST' : 'PRODUCT_FIRST'
  const jsonLd = buildExperienceDiscoveryJsonLd({ discovery, pathname })

  return (
    <main
      lang={locale}
      data-presentation-mode={presentationMode}
      className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-slate-950"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_78%_18%,rgba(191,219,254,0.42),transparent_33%),radial-gradient(circle_at_16%_8%,rgba(254,243,199,0.42),transparent_30%)]" />
      <div className="relative mx-auto max-w-[1440px] px-5 pb-10 pt-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-5 rounded-3xl border border-white/80 bg-white/75 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {merchant.logoUrl ? (
                <Image src={merchant.logoUrl} alt="" fill sizes="48px" className="object-contain p-1.5" />
              ) : (
                <Store className="h-6 w-6 text-blue-700" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="font-serif text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{merchant.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                {isCampaign ? experience.name : 'Optical collection'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-medium text-slate-400 sm:text-sm">
            {merchant.referenceData || experience.referenceData ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800">
                Reference Pilot · Simulation
              </span>
            ) : null}
            <span className="hidden sm:inline">Powered by</span>
            <span className="font-semibold text-blue-600">VisuTry</span>
            <Sparkles className="h-4 w-4 text-blue-500" aria-hidden="true" />
          </div>
        </header>

        <section className={`mt-8 rounded-[2.25rem] border border-white bg-white/90 p-5 shadow-[0_35px_100px_rgba(30,64,175,0.12)] sm:p-8 ${isCampaign ? 'lg:p-10' : ''}`}>
          <div className={`grid items-center gap-8 ${isCampaign ? 'lg:grid-cols-[0.88fr_1.12fr]' : 'lg:grid-cols-[0.78fr_1.22fr]'}`}>
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${isCampaign ? 'border-amber-200 bg-amber-50/90 text-amber-800' : 'border-blue-100 bg-white text-blue-700'}`}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {isCampaign ? 'Campaign experience' : 'Store collection'}
              </div>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">{title}</h1>
              {description ? <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p> : null}
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
                {isCampaign
                  ? `A focused eyewear edit from ${merchant.name}. Review the featured frames and follow the merchant links for product details.`
                  : `Browse selected frames from ${merchant.name}, with product facts and a direct destination to the merchant.`}
              </p>
              <a href="#interactive-shopping" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">
                Explore selected frames <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isCampaign ? 'text-amber-700' : 'text-blue-600'}`}>Featured collection</p>
                  <p className="mt-1 text-sm text-slate-500">{experience.name}</p>
                </div>
                {merchant.referenceData || experience.referenceData ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Reference catalog · VisuTry Reference
                  </span>
                ) : null}
              </div>
              <ExperienceHeroVisual
                experience={experience}
                merchantName={merchant.name}
                heroImage={heroImage}
                mode={presentationMode}
              />
            </div>
          </div>

          <section className="mt-8 border-t border-slate-200/80 pt-7" aria-labelledby="featured-frames">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Featured frames</p>
                <h2 id="featured-frames" className="mt-1 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{isCampaign ? 'Featured frames' : 'Explore the collection'}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Product facts and merchant links remain available for shoppers, search engines, and agents.</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{frames.length} frame{frames.length === 1 ? '' : 's'}</span>
            </div>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                            {...externalLinkProps(frame.productUrl, experience.type, experience.slug, 'product')}
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
        </section>

        <section aria-labelledby="fit-context" className="mt-8 rounded-[2rem] border border-slate-200/80 bg-white/90 px-5 py-10 shadow-sm sm:px-8 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-2">
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
          <section aria-labelledby="merchant-destination" className="px-1 py-10 sm:px-2">
          <h2 id="merchant-destination" className="sr-only">Merchant destination</h2>
          <a
            {...externalLinkProps(merchant.websiteUrl, experience.type, experience.slug, 'merchant')}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Visit {merchant.name} <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          </section>
        ) : null}
      </div>
    </main>
  )
}
