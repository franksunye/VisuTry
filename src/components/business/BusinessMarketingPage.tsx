import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Check, ExternalLink, Sparkles } from 'lucide-react'
import { businessHref, businessPages, type BusinessPageKey, type BusinessSection } from '@/config/business-site'

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

function hardenedCta(pageKey: BusinessPageKey, cta: { label: string; href: string } | undefined) {
  if (!cta) return undefined
  if (pageKey === 'overview' && cta.href === '/store/luna-optical') {
    return { label: 'Explore Store', href: '/business/store' }
  }
  if (pageKey === 'store' && cta.href === '/store/luna-optical') {
    return { label: 'See Product Examples', href: '/business/examples' }
  }
  return cta
}

function hardenedSections(pageKey: BusinessPageKey, sections: BusinessSection[]): BusinessSection[] {
  const mapped = sections.map((section, index) => {
    if (pageKey === 'store' && section.eyebrow === 'Live product proof') {
      return {
        eyebrow: 'Store product preview',
        title: 'See how the hosted Store experience is designed to work.',
        body: 'This product preview shows the persistent Store format and shopper decision journey. Live merchant Stores are published only when the merchant experience is ready.',
        visual: {
          src: '/images/store/store-shopper-experience.png',
          alt: 'Product preview of the VisuTry hosted Store shopper experience',
          caption: 'Product preview — not presented as a live customer deployment.',
        },
      }
    }

    if (pageKey === 'examples' && index === 0) {
      return {
        eyebrow: 'Store product preview',
        title: 'A persistent Store experience.',
        body: 'Use the Store product preview to evaluate the always-on shopper journey. The reference portfolio below demonstrates additional campaign and merchandising patterns without implying customer relationships.',
        visual: {
          src: '/images/store/store-shopper-experience.png',
          alt: 'Product preview of a persistent VisuTry Store experience',
          caption: 'Product preview. Reference Experiences below are simulations based on public catalog information.',
        },
      }
    }

    if (pageKey === 'pricing' && index === 0) {
      return {
        ...section,
        eyebrow: 'Founding Pilot offer',
        body: 'Start with one focused 30-day Pilot using your real eyewear catalog. The offer is designed to validate the shopper workflow and merchant operating fit before a larger commitment.',
        cards: section.cards?.map((card) => {
          if (card.title === 'Up to 1,500 AI-assisted shoppers') {
            return { ...card, description: 'Up to 1,500 shoppers who enter the guided AI decision journey; ordinary page views are not counted as AI-assisted shoppers.' }
          }
          return card
        }),
      }
    }

    if (pageKey === 'pricing' && index === 1) {
      return {
        ...section,
        eyebrow: 'After the Pilot',
        title: 'Review the results, then decide how to continue.',
        body: 'There is no automatic long-term commitment. At the end of the Pilot, we review usage, shopper behavior, campaign needs, integrations, and support requirements with you before discussing a continuation plan.',
        note: 'No surprise Pilot overage charge. No conversion or revenue guarantee. Any continuation plan is agreed separately.',
      }
    }

    if (pageKey === 'platform' && section.eyebrow === 'Catalog foundation') {
      return {
        ...section,
        body: 'Start with your own reviewed frame data. VisuTry does not replace your catalog or commerce system; it uses the product information needed to power guided Store and Campaign experiences.',
      }
    }

    if (pageKey === 'platform' && section.eyebrow === 'Experience model') {
      return {
        ...section,
        cards: section.cards?.map((card) => card.title === 'Intelligence'
          ? { ...card, title: 'Commerce Intelligence', label: 'Explore Commerce Intelligence' }
          : card),
      }
    }

    if (pageKey === 'intelligence' && section.eyebrow === 'Evidence boundary') {
      return {
        ...section,
        body: 'The current Commerce Intelligence layer focuses on observable engagement and purchase-intent behavior. Revenue attribution requires commerce or order-data integration, and incremental revenue claims require credible experiment design.',
      }
    }

    return section
  })

  if (pageKey === 'pilot') {
    return [
      ...mapped,
      {
        eyebrow: 'How the Pilot starts',
        title: 'A clear manual handoff before setup begins.',
        cards: [
          { title: '1. Request', description: 'Email VisuTry with your business, catalog, traffic source, and the decision problem you want to test.' },
          { title: '2. Scope review', description: 'We confirm the frame set, Store or Campaign format, launch assumptions, and whether the Pilot is a good fit.' },
          { title: '3. Confirmation', description: 'Once scope is agreed, we confirm the Pilot terms and payment instructions before configuration starts.' },
          { title: '4. Launch & review', description: 'VisuTry configures the hosted Experience, launches the agreed route, and reviews observed shopper behavior with you during the 30-day Pilot.' },
        ],
        note: 'After the Pilot, there is no automatic long-term commitment. Continuation is discussed separately based on actual usage and business needs.',
      },
    ]
  }

  return mapped
}

function HeroVisual({ pageKey }: { pageKey: BusinessPageKey }) {
  if (pageKey === 'platform') {
    return (
      <div className="hidden lg:block" aria-hidden="true">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white/95 p-7 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Platform architecture</p>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold">Merchant Catalog</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-950 p-4 text-sm font-semibold text-white">Store</div>
              <div className="rounded-2xl bg-blue-600 p-4 text-sm font-semibold text-white">Campaigns</div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900">Recommendation · Try-On · Compare</div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold">
              <span>Product / Inquiry Handoff</span><span className="text-slate-400">→</span>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-800">Commerce Intelligence</div>
          </div>
        </div>
      </div>
    )
  }

  if (pageKey === 'campaigns') {
    return (
      <div className="hidden lg:block" aria-hidden="true">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white/95 p-7 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Campaign journey</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-semibold">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Search / Social</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Email / QR</div>
          </div>
          <div className="mx-auto my-3 h-7 w-px bg-slate-300" />
          <div className="rounded-2xl bg-blue-600 p-5 text-sm font-semibold text-white">Focused Campaign Experience</div>
          <div className="mx-auto my-3 h-7 w-px bg-slate-300" />
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-white p-3">Recommend</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">Try-On</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">Compare</div>
          </div>
          <div className="mt-3 rounded-2xl bg-slate-950 p-4 text-sm font-semibold text-white">Product intent → Merchant commerce</div>
        </div>
      </div>
    )
  }

  if (pageKey === 'pricing') {
    return (
      <div className="hidden lg:block" aria-hidden="true">
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white/95 p-7 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Founding Merchant Pilot</p>
          <div className="mt-5 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-0.04em]">$149</span><span className="pb-1 text-sm text-slate-500">/ 30 days</span></div>
          <div className="mt-6 space-y-3 text-sm text-slate-700">
            {['8–50 reviewed frames', '1 hosted Store or Campaign', 'Recommendation · Try-On · Compare', 'Assisted setup + weekly review'].map((item) => (
              <div key={item} className="flex items-center gap-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Check className="h-3 w-3" /></span><span>{item}</span></div>
            ))}
          </div>
          <p className="mt-6 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">A focused paid test before any larger commitment.</p>
        </div>
      </div>
    )
  }

  return (
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
  )
}

export function BusinessMarketingPage({ locale, pageKey }: BusinessMarketingPageProps) {
  const page = businessPages[pageKey]
  const primaryCta = hardenedCta(pageKey, page.primaryCta)!
  const secondaryCta = hardenedCta(pageKey, page.secondaryCta)
  const sections = hardenedSections(pageKey, page.sections)

  if (locale !== 'en') {
    redirect(`/en${page.slug}`)
  }

  return (
    <main className="bg-[#f8fafc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_78%_12%,rgba(191,219,254,0.42),transparent_31%),linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#f5f7fb_100%)]">
        <div className={`mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 ${page.heroImage ? 'lg:grid-cols-[0.9fr_1.1fr] lg:items-center' : 'lg:grid-cols-[1.05fr_0.95fr] lg:items-center'}`}>
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
              <CtaLink locale={locale} {...primaryCta} primary />
              {secondaryCta ? <CtaLink locale={locale} {...secondaryCta} /> : null}
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
          ) : <HeroVisual pageKey={pageKey} />}
        </div>
      </section>

      {sections.map((section, index) => (
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
