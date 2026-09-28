import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { businessHref, businessPages, type BusinessPageKey, type BusinessSection } from '@/config/business-site'
import { BusinessVisualPlaceholder } from './BusinessVisualPlaceholder'
import { BusinessPilotLeadForm } from './BusinessPilotLeadForm'
import { BusinessPricingPage } from './BusinessPricingPage'

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

function CtaLink({ locale, href, label, primary = false, inverse = false }: { locale: string; href: string; label: string; primary?: boolean; inverse?: boolean }) {
  const target = businessHref(locale, href)
  const external = target.startsWith('mailto:') || target.startsWith('http')
  const className = primary
    ? inverse
      ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100'
      : 'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800'
    : inverse
      ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10'
      : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50'

  if (external) return <a href={target} className={className}>{label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
  return <Link href={target} prefetch={false} className={className}>{label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
}

function Hero({ locale, pageKey }: { locale: string; pageKey: BusinessPageKey }) {
  const page = businessPages[pageKey]
  const primaryCta = page.primaryCta
  const secondaryCta = page.secondaryCta
  const slot = visualSlots[pageKey]
  const textOnly = pageKey === 'pricing' || pageKey === 'examples' || pageKey === 'integrations' || pageKey === 'pilot'
  const dark = pageKey === 'intelligence'
  const storeDominant = pageKey === 'store'
  const audienceLine = pageKey === 'overview'
    ? 'Built for eyewear brands, commerce teams, and agency partners.'
    : pageKey === 'campaigns'
      ? 'For brand, media, commerce, and agency teams.'
      : null

  return (
    <section className={`relative overflow-hidden border-b ${dark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-[radial-gradient(circle_at_82%_8%,rgba(191,219,254,0.24),transparent_28%),linear-gradient(135deg,#ffffff_0%,#fbfdff_58%,#f6f8fb_100%)]'}`}>
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${textOnly ? 'py-16 sm:py-20 lg:py-24' : storeDominant ? 'py-16 sm:py-20 lg:py-24' : 'grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-16 lg:py-24'}`}>
        <div className={`${textOnly ? 'max-w-4xl' : storeDominant ? 'max-w-3xl' : 'max-w-2xl'}`}>
          <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${dark ? 'text-sky-300' : 'text-blue-700'}`}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />{page.eyebrow}
          </p>
          <h1 className={`mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-[4.35rem] lg:leading-[1.01] ${dark ? 'text-white' : 'text-slate-950'}`}>{page.title}</h1>
          <p className={`mt-6 max-w-2xl text-base leading-8 sm:text-lg ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{page.description}</p>
          {audienceLine ? <p className={`mt-5 text-xs font-semibold uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{audienceLine}</p> : null}
          {pageKey === 'campaigns' ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Search · Social · Email · QR → Campaign Experience</p> : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink locale={locale} {...primaryCta} primary inverse={dark} />
            {secondaryCta ? <CtaLink locale={locale} {...secondaryCta} inverse={dark} /> : null}
          </div>
          {pageKey === 'pricing' ? <p className="mt-5 text-xs font-semibold text-slate-500">No surprise usage billing.</p> : null}
          {page.microcopy ? <p className={`mt-5 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{page.microcopy}</p> : null}
        </div>

        {!textOnly ? (
          <div className={storeDominant ? 'mt-12 lg:mt-14 lg:ml-auto lg:w-[82%]' : 'relative'}>
            {slot ? <BusinessVisualPlaceholder {...slot} priority /> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function StepBand({ steps, dark = false }: { steps: string[]; dark?: boolean }) {
  return (
    <div className={`mt-9 overflow-hidden border-y ${dark ? 'border-white/15' : 'border-slate-300'}`}>
      <div className={`grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-none lg:auto-cols-fr lg:grid-flow-col ${dark ? 'divide-white/15' : 'divide-slate-200'}`}>
        {steps.map((step, index) => (
          <div key={step} className="min-w-0 py-5 pr-5 md:px-5 lg:px-6">
            <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-sky-300' : 'text-blue-700'}`}>0{index + 1}</span>
            <p className={`mt-3 text-sm font-semibold leading-5 ${dark ? 'text-white' : 'text-slate-900'}`}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EditorialCards({ section, locale, dark = false }: { section: BusinessSection; locale: string; dark?: boolean }) {
  const cards = section.cards ?? []
  if (!cards.length) return null
  return (
    <div className={`mt-9 grid gap-x-8 gap-y-8 ${cards.length <= 2 ? 'md:grid-cols-2' : cards.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {cards.map((card, index) => {
        const href = card.href ? businessHref(locale, card.href) : null
        return (
          <article key={card.title} className={`border-t pt-5 ${dark ? 'border-white/20' : 'border-slate-300'}`}>
            <div className="flex items-start justify-between gap-4">
              <h3 className={`text-xl font-semibold tracking-[-0.02em] ${dark ? 'text-white' : 'text-slate-950'}`}>{card.title}</h3>
              <span className={`text-xs font-semibold ${dark ? 'text-slate-600' : 'text-slate-300'}`}>0{index + 1}</span>
            </div>
            <p className={`mt-3 text-sm leading-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{card.description}</p>
            {href && card.label ? (
              <Link href={href} prefetch={false} className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${dark ? 'text-sky-300 hover:text-sky-200' : 'text-blue-700 hover:text-blue-900'}`}>
                {card.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

type SectionPresentation = {
  visual?: VisualSlot
  visualSide?: 'left' | 'right'
  contrast?: boolean
}

function sectionPresentation(pageKey: BusinessPageKey, section: BusinessSection): SectionPresentation {
  if (pageKey === 'overview' && section.eyebrow === 'Product surfaces') {
    return {
      visual: { id: 'B2B-VIS-03', name: 'Store Experience', status: 'NEEDS STORE CAPTURE' },
      visualSide: 'right',
    }
  }

  if (pageKey === 'overview' && section.eyebrow === 'Merchant operating model') {
    return {
      visual: { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' },
      visualSide: 'left',
    }
  }

  if (pageKey === 'overview' && section.eyebrow === 'Commerce Intelligence') {
    return {
      visual: { id: 'B2B-VIS-06', name: 'Commerce Intelligence', status: 'NEEDS INSIGHTS CAPTURE' },
      visualSide: 'right',
      contrast: true,
    }
  }

  if (pageKey === 'platform' && section.eyebrow === 'Merchant Workspace') {
    return {
      visual: { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' },
      visualSide: 'right',
    }
  }

  if (pageKey === 'store' && section.eyebrow === 'Shopper experience') {
    return {
      visual: { id: 'B2B-VIS-03', name: 'Store Shopper Journey', status: 'NEEDS STORE CAPTURE', ratio: '4:3' },
      visualSide: 'left',
    }
  }

  if (pageKey === 'intelligence' && section.eyebrow === 'Evidence boundary') {
    return { contrast: true }
  }

  if (pageKey === 'examples' && section.eyebrow === 'Store product preview') {
    return {
      visual: { id: 'B2B-VIS-03', name: 'Store Experience', status: 'NEEDS STORE CAPTURE', ratio: '4:3' },
      visualSide: 'right',
    }
  }

  if (pageKey === 'integrations' && section.eyebrow === 'Merchant workspace proof') {
    return {
      visual: { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' },
      visualSide: 'right',
    }
  }

  if (pageKey === 'pilot' && section.eyebrow === 'Merchant workspace') {
    return {
      visual: { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' },
      visualSide: 'right',
    }
  }

  return {}
}

function SectionBlock({ pageKey, section, index, locale }: { pageKey: BusinessPageKey; section: BusinessSection; index: number; locale: string }) {
  const presentation = sectionPresentation(pageKey, section)
  const slot = presentation.visual
  const contrast = Boolean(presentation.contrast)
  const split = Boolean(slot)
  const visualLeft = split && presentation.visualSide === 'left'
  const compact = !split && !contrast && !section.cards && !section.steps

  return (
    <section
      className={contrast ? 'bg-slate-950 text-white' : index % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}
      data-business-section={section.eyebrow ?? section.title}
    >
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${compact ? 'py-12 sm:py-16' : 'py-14 sm:py-20'} ${split ? 'grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14' : ''}`}>
        <div className={`${split ? '' : 'mx-auto max-w-5xl'} ${visualLeft ? 'lg:order-2' : ''}`}>
          {section.eyebrow ? <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${contrast ? 'text-sky-300' : 'text-blue-700'}`}>{section.eyebrow}</p> : null}
          <h2 className={`mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[2.7rem] lg:leading-[1.08] ${contrast ? 'text-white' : 'text-slate-950'}`}>{section.title}</h2>
          {section.body ? <p className={`mt-5 max-w-3xl text-base leading-7 ${contrast ? 'text-slate-300' : 'text-slate-600'}`}>{section.body}</p> : null}
          {section.steps ? <StepBand steps={section.steps} dark={contrast} /> : null}
          {section.cards ? <EditorialCards section={section} locale={locale} dark={contrast} /> : null}
          {section.note ? <p className={`mt-6 max-w-3xl border-l-2 pl-4 text-xs leading-5 ${contrast ? 'border-sky-400 text-slate-400' : 'border-slate-300 text-slate-500'}`}>{section.note}</p> : null}
        </div>
        {slot ? (
          <div className={visualLeft ? 'lg:order-1' : ''}>
            <BusinessVisualPlaceholder {...slot} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function PilotCta({ locale }: { locale: string }) {
  return (
    <section className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Founding Merchant Pilot</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Start with a focused 30-day test.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Use your real frames, one hosted Experience, and observable shopper intent before making a larger commitment.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={businessHref(locale, '/business/pilot')} prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">Start 30-Day Pilot<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href={businessHref(locale, '/business/pricing')} prefetch={false} className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">View Pricing</Link>
        </div>
      </div>
    </section>
  )
}

export function BusinessMarketingPage({ locale, pageKey }: BusinessMarketingPageProps) {
  const page = businessPages[pageKey]

  if (locale !== 'en') redirect(`/en${page.slug}`)

  if (pageKey === 'pricing') {
    return (
      <main className="bg-[#f8fafc] text-slate-950">
        <Hero locale={locale} pageKey={pageKey} />
        <BusinessPricingPage locale={locale} />
      </main>
    )
  }

  const sections = page.sections
  const showPilotCta = pageKey !== 'pilot'

  return (
    <main className="bg-[#f8fafc] text-slate-950">
      <Hero locale={locale} pageKey={pageKey} />

      {pageKey === 'pilot' ? <BusinessPilotLeadForm locale={locale} /> : null}

      {pageKey === 'examples' ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <BusinessVisualPlaceholder id="B2B-VIS-07" name="Reference Experience Set" ratio="4:3" status="NEEDS REFERENCE CAPTURES" className="mx-auto max-w-5xl" />
          </div>
        </section>
      ) : null}

      {sections.map((section, index) => <SectionBlock key={`${pageKey}-${index}`} pageKey={pageKey} section={section} index={index} locale={locale} />)}

      {showPilotCta ? <PilotCta locale={locale} /> : null}
    </main>
  )
}
