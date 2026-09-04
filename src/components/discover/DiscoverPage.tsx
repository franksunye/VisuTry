import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Compass, Glasses, Store } from 'lucide-react'
import type { DiscoverContent } from '@/modules/store/application/get-discover-content'

export function DiscoverPage({ content }: { content: DiscoverContent }) {
  const { copy, featured, merchants } = content
  const heroImages = featured.slice(0, 3)

  return (
    <main className="overflow-hidden bg-[#f7f8fb] text-slate-950">
      <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_78%_20%,rgba(186,230,253,0.6),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#ffffff_58%,#f4f7fb_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.2rem] lg:leading-[1.02]">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">
                <Glasses className="h-4 w-4 text-blue-600" aria-hidden="true" />
                Fit-led edits
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">
                <Store className="h-4 w-4 text-blue-600" aria-hidden="true" />
                Real Store journeys
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -inset-8 rounded-[3rem] bg-blue-200/35 blur-3xl" aria-hidden="true" />
            <div className="relative grid grid-cols-[1.1fr_0.9fr] gap-3 sm:gap-4">
              {heroImages[0] && (
                <div className="relative row-span-2 aspect-[0.82] overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.55)]">
                  <Image
                    src={heroImages[0].heroAssetUrl}
                    alt={`${heroImages[0].experienceName} eyewear edit`}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 52vw, 36vw"
                  />
                  <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 p-3 backdrop-blur sm:inset-x-4 sm:bottom-4 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{heroImages[0].intentLabel}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{heroImages[0].merchantName}</p>
                  </div>
                </div>
              )}
              {heroImages.slice(1, 3).map((item) => (
                <div key={`${item.merchantSlug}-${item.experienceSlug}`} className="relative aspect-[1.15] overflow-hidden rounded-[1.5rem] bg-slate-200 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.55)]">
                  <Image
                    src={item.heroAssetUrl}
                    alt={`${item.experienceName} eyewear edit`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 38vw, 25vw"
                  />
                  <div className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 px-2.5 py-2 backdrop-blur sm:inset-x-3 sm:bottom-3 sm:px-3">
                    <p className="truncate text-xs font-semibold text-slate-950">{item.experienceName}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-600">{item.merchantName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Featured Experiences</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{copy.featuredTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{copy.featuredDescription}</p>
          </div>
          <p className="text-sm text-slate-500">{featured.length} focused edits</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((item, index) => (
            <Link
              key={`${item.merchantSlug}-${item.experienceSlug}`}
              href={item.href}
              className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-30px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_45px_-28px_rgba(37,99,235,0.32)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${index === 0 ? 'md:col-span-2 xl:col-span-2' : ''}`}
            >
              <div className={`relative overflow-hidden bg-slate-100 ${index === 0 ? 'aspect-[2.1] sm:aspect-[2.35]' : 'aspect-[1.45]'}`}>
                <Image
                  src={item.heroAssetUrl}
                  alt={`${item.experienceName} from ${item.merchantName}`}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes={index === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 1200px) 50vw, 33vw'}
                />
                <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700 shadow-sm backdrop-blur">
                    {item.intentLabel}
                  </span>
                  {item.referenceData && (
                    <span className="rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      {copy.referenceLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.merchantName}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{item.headline}</h3>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-blue-600 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>{item.catalogCount} {copy.frames}</span>
                  <span className="font-semibold text-blue-700">{copy.exploreEdit}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-500">
          {copy.referenceDisclosure}
        </p>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Secondary discovery</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{copy.merchantsTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{copy.merchantsDescription}</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((merchant) => (
              <Link
                key={merchant.slug}
                href={merchant.href}
                className="group flex min-h-36 flex-col justify-between rounded-2xl border border-slate-200 bg-[#fafbfc] p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: merchant.accentColor || '#334155' }}
                      aria-hidden="true"
                    >
                      {merchant.name.slice(0, 1)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-950">{merchant.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{merchant.storeName}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                  <span className={merchant.referenceData ? 'text-slate-500' : 'font-semibold text-emerald-700'}>
                    {merchant.referenceData ? copy.referenceLabel : copy.liveLabel}
                  </span>
                  <span className="font-semibold text-blue-700">{copy.openStore}</span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href={content.canary.href}
            className="group mt-5 flex max-w-2xl items-center justify-between gap-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">First-party demo</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">{content.canary.name}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{content.canary.description}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-blue-600 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}
