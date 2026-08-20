import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Check, ExternalLink, Sparkles } from 'lucide-react'
import { businessHref, businessPages, type BusinessPageKey } from '@/config/business-site'

interface BusinessMarketingPageProps {
  locale: string
  pageKey: BusinessPageKey
}

function CtaLink({ locale, href, label, primary = false }: { locale: string; href: string; label: string; primary?: boolean }) {
  const target = businessHref(locale, href)
  const external = target.startsWith('mailto:') || target.startsWith('http')
  const className = primary
    ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800'
    : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50'

  if (external) {
    return <a href={target} className={className}>{label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
  }
  return <Link href={target} prefetch={false} className={className}>{label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
}

export function BusinessMarketingPage({ locale, pageKey }: BusinessMarketingPageProps) {
  const page = businessPages[pageKey]

  if (locale !== 'en') {
    redirect(`/en${page.slug}`)
  }

  return (
    <main className="bg-[#f8fafc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_78%_12%,rgba(191,219,254,0.42),transparent_31%),linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#f5f7fb_100%)]">
        <div className={`mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 ${page.heroImage ? 'lg:grid-cols-[0.9fr_1.1fr] lg:items-center' : ''}`}>
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {page.eyebrow}
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[1.04]">
              {page.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{page.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink locale={locale} {...page.primaryCta} primary />
              {page.secondaryCta ? <CtaLink locale={locale} {...page.secondaryCta} /> : null}
            </div>
            {page.microcopy ? <p className="mt-5 text-xs leading-5 text-slate-500">{page.microcopy}</p> : null}
          </div>

          {page.heroImage ? (
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-blue-100/40 blur-3xl" />
              <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.38)]">
                <img src={page.heroImage.src} alt={page.heroImage.alt} className="aspect-[4/3] h-full w-full object-cover" loading="eager" fetchPriority="high" />
              </div>
            </div>
          ) : (
            <div className="hidden lg:block" aria-hidden="true">
              <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">VisuTry Business</p>
                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold">Merchant Catalog</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-950 p-4 text-sm font-semibold text-white">Store</div>
                    <div className="rounded-2xl bg-blue-600 p-4 text-sm font-semibold text-white">Campaigns</div>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900">Recommendation · Try-On · Compare</div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold">Commerce Intelligence</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {page.sections.map((section, index) => (
        <section key={`${pageKey}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
          <div className={`mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-20 ${section.visual ? 'grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center' : ''}`}>
            <div className={section.visual ? '' : 'mx-auto max-w-4xl'}>
              {section.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{section.eyebrow}</p> : null}
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-4xl">{section.title}</h2>
              {section.body ? <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{section.body}</p> : null}

              {section.steps ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.steps.map((step, stepIndex) => (
                    <div key={step} className="flex min-h-24 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.5)]">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-bold text-white">{stepIndex + 1}</span>
                      <span className="pt-0.5 text-sm font-semibold leading-5 text-slate-800">{step}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {section.cards ? (
                <div className={`mt-8 grid gap-4 ${section.cards.length === 1 ? 'max-w-2xl' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {section.cards.map((card) => {
                    const href = card.href ? businessHref(locale, card.href) : null
                    return (
                      <article key={card.title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.5)] transition hover:border-slate-300 hover:shadow-[0_22px_54px_-38px_rgba(15,23,42,0.6)]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Check className="h-4 w-4" aria-hidden="true" /></div>
                        <h3 className="mt-4 text-lg font-semibold tracking-[-0.015em] text-slate-950">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                        {href && card.label ? (
                          <Link href={href} prefetch={false} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition group-hover:text-blue-900">
                            {card.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              ) : null}

              {section.note ? <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">{section.note}</p> : null}
            </div>

            {section.visual ? (
              <figure className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_-44px_rgba(15,23,42,0.45)]">
                <img src={section.visual.src} alt={section.visual.alt} className="h-auto w-full" loading="lazy" />
                {section.visual.caption ? <figcaption className="border-t border-slate-100 px-5 py-4 text-xs leading-5 text-slate-500">{section.visual.caption}</figcaption> : null}
              </figure>
            ) : null}
          </div>
        </section>
      ))}

      <section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Founding Merchant Pilot</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em]">Start with a focused 30-day test.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Use your real frames, one hosted Experience, and observed shopper intent before making a larger commitment.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={businessHref(locale, '/business/pilot')} prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Start a Pilot<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href={businessHref(locale, '/business/pricing')} prefetch={false} className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">View Pricing</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
