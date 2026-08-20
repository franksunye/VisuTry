import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Check, ExternalLink, Sparkles } from 'lucide-react'
import { businessHref, businessPages, type BusinessPageKey, type BusinessSection } from '@/config/business-site'
import { BusinessVisualPlaceholder } from './BusinessVisualPlaceholder'

interface BusinessMarketingPageProps {
  locale: string
  pageKey: BusinessPageKey
}

type VisualSlot = {
  id: string
  name: string
  ratio?: '16:10' | '4:3' | '4:5'
  status: 'DIRECT' | 'NEEDS STORE CAPTURE' | 'NEEDS CAMPAIGN CAPTURE' | 'NEEDS MERCHANT CAPTURE' | 'NEEDS INSIGHTS CAPTURE' | 'NEEDS REFERENCE CAPTURES'
}

const visualSlots: Partial<Record<BusinessPageKey, VisualSlot>> = {
  overview: { id: 'B2B-VIS-01', name: 'Business Hero Master Visual', status: 'DIRECT' },
  platform: { id: 'B2B-VIS-02', name: 'Platform / Catalog-to-Experience', status: 'DIRECT' },
  store: { id: 'B2B-VIS-03', name: 'Real Store Experience', status: 'NEEDS STORE CAPTURE' },
  campaigns: { id: 'B2B-VIS-04', name: 'Campaign Experience', status: 'NEEDS CAMPAIGN CAPTURE' },
  intelligence: { id: 'B2B-VIS-06', name: 'Commerce Intelligence', status: 'NEEDS INSIGHTS CAPTURE' },
}

function CtaLink({ locale, href, label, primary = false }: { locale: string; href: string; label: string; primary?: boolean }) {
  const target = businessHref(locale, href)
  const external = target.startsWith('mailto:') || target.startsWith('http')
  const className = primary
    ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800'
    : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50'

  if (external) return <a href={target} className={className}>{label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
  return <Link href={target} prefetch={false} className={className}>{label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
}

function hardenedCta(pageKey: BusinessPageKey, cta: { label: string; href: string } | undefined) {
  if (!cta) return undefined
  if (pageKey === 'overview' && cta.href === '/store/luna-optical') return { label: 'Explore Store', href: '/business/store' }
  if (pageKey === 'store' && cta.href === '/store/luna-optical') return { label: 'See Product Examples', href: '/business/examples' }
  return cta
}

function hardenedSections(pageKey: BusinessPageKey, sections: BusinessSection[]): BusinessSection[] {
  const mapped = sections.map((section, index) => {
    if (pageKey === 'store' && section.eyebrow === 'Live product proof') {
      return {
        eyebrow: 'Store product preview',
        title: 'See how the hosted Store experience is designed to work.',
        body: 'This product preview shows the persistent Store format and shopper decision journey. Live merchant Stores are published only when the merchant experience is ready.',
      }
    }

    if (pageKey === 'examples' && index === 0) {
      return {
        eyebrow: 'Store product preview',
        title: 'A persistent Store experience.',
        body: 'Use the Store product preview to evaluate the always-on shopper journey. The reference portfolio below demonstrates additional campaign and merchandising patterns without implying customer relationships.',
      }
    }

    if (pageKey === 'pricing' && index === 0) {
      return {
        ...section,
        eyebrow: 'Founding Pilot offer',
        body: 'Start with one focused 30-day Pilot using your real eyewear catalog. The offer is designed to validate the shopper workflow and merchant operating fit before a larger commitment.',
        cards: section.cards?.map((card) => card.title === 'Up to 1,500 AI-assisted shoppers'
          ? { ...card, description: 'Up to 1,500 shoppers who enter the guided AI decision journey; ordinary page views are not counted as AI-assisted shoppers.' }
          : card),
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
      return { ...section, body: 'Start with your own reviewed frame data. VisuTry does not replace your catalog or commerce system; it uses the product information needed to power guided Store and Campaign experiences.' }
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
      return { ...section, body: 'The current Commerce Intelligence layer focuses on observable engagement and purchase-intent behavior. Revenue attribution requires commerce or order-data integration, and incremental revenue claims require credible experiment design.' }
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

function PricingHeroVisual() {
  return (
    <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_28px_80px_-46px_rgba(15,23,42,0.35)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Founding Merchant Pilot</p>
      <div className="mt-5 flex items-end gap-2"><span className="text-6xl font-semibold tracking-[-0.06em]">$149</span><span className="pb-2 text-sm text-slate-500">/ 30 days</span></div>
      <div className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-700">
        {['8–50 reviewed frames', '1 hosted Store or Campaign', 'Recommendation · Try-On · Compare', 'Assisted setup + weekly review'].map((item) => (
          <div key={item} className="flex items-center gap-3 py-2"><Check className="h-4 w-4 text-blue-700" /><span>{item}</span></div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">A focused paid engagement before any larger commitment.</p>
    </div>
  )
}

function Hero({ locale, pageKey }: { locale: string; pageKey: BusinessPageKey }) {
  const page = businessPages[pageKey]
  const primaryCta = hardenedCta(pageKey, page.primaryCta)!
  const secondaryCta = hardenedCta(pageKey, page.secondaryCta)
  const slot = visualSlots[pageKey]
  const textOnly = pageKey === 'examples' || pageKey === 'integrations' || pageKey === 'pilot'
  const dark = pageKey === 'intelligence'

  return (
    <section className={`relative overflow-hidden border-b ${dark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-[radial-gradient(circle_at_78%_12%,rgba(191,219,254,0.32),transparent_31%),linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#f5f7fb_100%)]'}`}>
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${textOnly ? 'py-16 sm:py-20 lg:py-24' : 'grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14 lg:py-24'}`}>
        <div className={textOnly ? 'max-w-4xl' : 'max-w-2xl'}>
          <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${dark ? 'border-white/15 bg-white/5 text-sky-300' : 'border-blue-100 bg-white/85 text-blue-700 shadow-sm'}`}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />{page.eyebrow}
          </p>
          <h1 className={`mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-[4.2rem] lg:leading-[1.02] ${dark ? 'text-white' : 'text-slate-950'}`}>{page.title}</h1>
          <p className={`mt-6 max-w-2xl text-base leading-8 sm:text-lg ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{page.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink locale={locale} {...primaryCta} primary />
            {secondaryCta ? <CtaLink locale={locale} {...secondaryCta} /> : null}
          </div>
          {page.microcopy ? <p className={`mt-5 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{page.microcopy}</p> : null}
        </div>

        {!textOnly ? (
          <div className="relative">
            {pageKey === 'pricing' ? <PricingHeroVisual /> : slot ? <BusinessVisualPlaceholder {...slot} /> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function StepBand({ steps }: { steps: string[] }) {
  return (
    <div className="mt-9 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
      <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-none lg:auto-cols-fr lg:grid-flow-col">
        {steps.map((step, index) => (
          <div key={step} className="min-w-0 p-5 lg:p-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">0{index + 1}</span>
            <p className="mt-3 text-sm font-semibold leading-5 text-slate-900">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EditorialCards({ section, locale }: { section: BusinessSection; locale: string }) {
  const cards = section.cards ?? []
  if (!cards.length) return null
  return (
    <div className={`mt-9 grid gap-x-8 gap-y-8 ${cards.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {cards.map((card, index) => {
        const href = card.href ? businessHref(locale, card.href) : null
        return (
          <article key={card.title} className="border-t border-slate-300 pt-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">{card.title}</h3>
              <span className="text-xs font-semibold text-slate-300">0{index + 1}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            {href && card.label ? (
              <Link href={href} prefetch={false} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
                {card.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

function supplementalSlot(pageKey: BusinessPageKey, sectionIndex: number): VisualSlot | null {
  if (pageKey === 'overview' && sectionIndex === 1) return { id: 'B2B-VIS-03', name: 'Real Store Experience', status: 'NEEDS STORE CAPTURE' }
  if (pageKey === 'overview' && sectionIndex === 2) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  if (pageKey === 'platform' && sectionIndex === 2) return { id: 'B2B-VIS-03', name: 'Real Store Experience', status: 'NEEDS STORE CAPTURE' }
  if (pageKey === 'platform' && sectionIndex === 4) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  if (pageKey === 'campaigns' && sectionIndex === 2) return { id: 'B2B-VIS-04', name: 'Campaign Experience', status: 'NEEDS CAMPAIGN CAPTURE' }
  if (pageKey === 'examples' && sectionIndex === 0) return { id: 'B2B-VIS-03', name: 'Real Store Experience', status: 'NEEDS STORE CAPTURE', ratio: '4:3' }
  if (pageKey === 'examples' && sectionIndex === 1) return { id: 'B2B-VIS-07', name: 'Reference Experience Set', status: 'NEEDS REFERENCE CAPTURES', ratio: '4:3' }
  if (pageKey === 'integrations' && sectionIndex === 1) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  if (pageKey === 'pilot' && sectionIndex === 2) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  return null
}

function SectionBlock({ pageKey, section, index, locale }: { pageKey: BusinessPageKey; section: BusinessSection; index: number; locale: string }) {
  const slot = supplementalSlot(pageKey, index)
  const contrast = pageKey === 'overview' && index === 2
  const split = Boolean(slot)

  return (
    <section className={contrast ? 'bg-slate-950 text-white' : index % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
      <div className={`mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 ${split ? 'grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center' : ''}`}>
        <div className={split ? '' : 'mx-auto max-w-5xl'}>
          {section.eyebrow ? <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${contrast ? 'text-sky-300' : 'text-blue-700'}`}>{section.eyebrow}</p> : null}
          <h2 className={`mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl ${contrast ? 'text-white' : 'text-slate-950'}`}>{section.title}</h2>
          {section.body ? <p className={`mt-5 max-w-3xl text-base leading-7 ${contrast ? 'text-slate-300' : 'text-slate-600'}`}>{section.body}</p> : null}
          {section.steps ? <StepBand steps={section.steps} /> : null}
          {section.cards ? <EditorialCards section={section} locale={locale} /> : null}
          {section.note ? <p className={`mt-6 max-w-3xl border-l-2 pl-4 text-xs leading-5 ${contrast ? 'border-sky-400 text-slate-400' : 'border-slate-300 text-slate-500'}`}>{section.note}</p> : null}
        </div>
        {slot ? <BusinessVisualPlaceholder {...slot} /> : null}
      </div>
    </section>
  )
}

export function BusinessMarketingPage({ locale, pageKey }: BusinessMarketingPageProps) {
  const page = businessPages[pageKey]
  const sections = hardenedSections(pageKey, page.sections)

  if (locale !== 'en') redirect(`/en${page.slug}`)

  return (
    <main className="bg-[#f8fafc] text-slate-950">
      <Hero locale={locale} pageKey={pageKey} />

      {pageKey === 'examples' ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <BusinessVisualPlaceholder id="B2B-VIS-07" name="Reference Experience Set" ratio="4:3" status="NEEDS REFERENCE CAPTURES" className="mx-auto max-w-5xl" />
          </div>
        </section>
      ) : null}

      {sections.map((section, index) => <SectionBlock key={`${pageKey}-${index}`} pageKey={pageKey} section={section} index={index} locale={locale} />)}

      <section className="border-t border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Founding Merchant Pilot</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Start with a focused 30-day test.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Use your real frames, one hosted Experience, and observed shopper intent before making a larger commitment.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={businessHref(locale, '/business/pilot')} prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">Start a Pilot<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href={businessHref(locale, '/business/pricing')} prefetch={false} className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">View Pricing</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
