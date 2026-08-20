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
        body: 'The final visual will use the current Store surface as product truth. Live merchant Stores are only presented as live when the merchant experience is actually published.',
      }
    }

    if (pageKey === 'examples' && index === 0) {
      return {
        eyebrow: 'Store product preview',
        title: 'A persistent Store experience.',
        body: 'Use the current Store product surface to evaluate the always-on shopper journey. Reference Experiences below demonstrate additional campaign and merchandising patterns without implying customer relationships.',
      }
    }

    if (pageKey === 'pricing' && index === 0) {
      return {
        ...section,
        eyebrow: 'What is included',
        title: 'One focused paid engagement, with enough scope to learn.',
        body: 'Start with your real eyewear catalog, one hosted Experience, defined usage capacity, and assisted setup and review.',
        cards: [
          { title: 'Catalog & Experience', description: '8–50 reviewed frames and one hosted Store or Campaign Experience.' },
          { title: 'Capacity', description: 'Up to 1,500 shoppers entering the guided AI decision journey and up to 3,500 Standard Try-On generations.' },
          { title: 'Assisted launch & review', description: 'Catalog review, Experience setup, launch support, and weekly review during the 30-day Pilot.' },
        ],
      }
    }

    if (pageKey === 'pricing' && index === 1) {
      return {
        ...section,
        eyebrow: 'After the Pilot',
        title: 'Review the results, then decide how to continue.',
        body: 'There is no automatic long-term commitment. At the end of the Pilot, we review usage, shopper behavior, campaign needs, integrations, and support requirements before discussing a continuation plan.',
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

  if (pageKey === 'overview') {
    return [
      mapped[0],
      mapped[1],
      {
        eyebrow: 'Merchant operating model',
        title: 'One workspace to operate Store, Campaigns, and the signals around them.',
        body: 'The merchant side should feel like one operating surface rather than a collection of disconnected tools. The final visual will use the current Merchant Workspace as the source of truth.',
      },
      mapped[2],
      mapped[3],
      mapped[4],
    ]
  }

  if (pageKey === 'integrations') {
    return [
      {
        ...mapped[0],
        steps: ['Catalog Review', 'Configure', 'Hosted Launch', 'Product Handoff', 'Intent Review'],
      },
      {
        eyebrow: 'Merchant workspace proof',
        title: 'A visible operating layer for setup and launch.',
        body: 'Use the current Merchant Workspace to show how merchant identity, Store, Campaigns, and setup status are managed without pretending the Pilot is fully automated.',
      },
      mapped[1],
      mapped[2],
    ]
  }

  if (pageKey === 'pilot') {
    return [
      mapped[0],
      {
        eyebrow: 'How the Pilot starts',
        title: 'Request → scope review → confirmation → launch & review.',
        steps: ['Request', 'Scope Review', 'Confirmation', 'Launch & Review'],
        body: 'We confirm the frame set, Store or Campaign format, launch assumptions, Pilot terms, and payment instructions before configuration begins.',
      },
      {
        eyebrow: 'Merchant workspace',
        title: 'A deliberate operating handoff, not an invisible black box.',
        body: 'The current Merchant Workspace provides the product-truth reference for setup status, Store, Campaigns, and the operating model behind the Pilot.',
      },
      mapped[1],
      mapped[2],
      {
        eyebrow: 'After 30 days',
        title: 'Review what happened, then decide whether to continue.',
        body: 'There is no automatic long-term commitment. Continuation is discussed separately based on actual usage, observed shopper behavior, campaign needs, integrations, and support requirements.',
      },
    ]
  }

  return mapped
}

function PricingHeroVisual() {
  return (
    <div className="mx-auto w-full max-w-md border-y border-slate-300 py-7 sm:border sm:bg-white sm:p-8 sm:shadow-[0_28px_80px_-52px_rgba(15,23,42,0.35)]">
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
  const storeDominant = pageKey === 'store'

  return (
    <section className={`relative overflow-hidden border-b ${dark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-[radial-gradient(circle_at_82%_8%,rgba(191,219,254,0.24),transparent_28%),linear-gradient(135deg,#ffffff_0%,#fbfdff_58%,#f6f8fb_100%)]'}`}>
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${textOnly ? 'py-16 sm:py-20 lg:py-24' : storeDominant ? 'py-16 sm:py-20 lg:py-24' : 'grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-16 lg:py-24'}`}>
        <div className={`${textOnly ? 'max-w-4xl' : storeDominant ? 'max-w-3xl' : 'max-w-2xl'}`}>
          <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${dark ? 'text-sky-300' : 'text-blue-700'}`}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />{page.eyebrow}
          </p>
          <h1 className={`mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-[4.35rem] lg:leading-[1.01] ${dark ? 'text-white' : 'text-slate-950'}`}>{page.title}</h1>
          <p className={`mt-6 max-w-2xl text-base leading-8 sm:text-lg ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{page.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink locale={locale} {...primaryCta} primary />
            {secondaryCta ? <CtaLink locale={locale} {...secondaryCta} /> : null}
          </div>
          {page.microcopy ? <p className={`mt-5 text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{page.microcopy}</p> : null}
        </div>

        {!textOnly ? (
          <div className={storeDominant ? 'mt-12 lg:mt-14 lg:ml-auto lg:w-[82%]' : 'relative'}>
            {pageKey === 'pricing' ? <PricingHeroVisual /> : slot ? <BusinessVisualPlaceholder {...slot} /> : null}
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
    <div className={`mt-9 grid gap-x-8 gap-y-8 ${cards.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
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

function supplementalSlot(pageKey: BusinessPageKey, sectionIndex: number): VisualSlot | null {
  if (pageKey === 'overview' && sectionIndex === 1) return { id: 'B2B-VIS-03', name: 'Real Store Experience', status: 'NEEDS STORE CAPTURE' }
  if (pageKey === 'overview' && sectionIndex === 2) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  if (pageKey === 'overview' && sectionIndex === 3) return { id: 'B2B-VIS-06', name: 'Commerce Intelligence', status: 'NEEDS INSIGHTS CAPTURE' }
  if (pageKey === 'platform' && sectionIndex === 2) return { id: 'B2B-VIS-03', name: 'Real Store Experience', status: 'NEEDS STORE CAPTURE' }
  if (pageKey === 'platform' && sectionIndex === 4) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  if (pageKey === 'campaigns' && sectionIndex === 2) return { id: 'B2B-VIS-04', name: 'Campaign Experience', status: 'NEEDS CAMPAIGN CAPTURE' }
  if (pageKey === 'examples' && sectionIndex === 0) return { id: 'B2B-VIS-03', name: 'Real Store Experience', status: 'NEEDS STORE CAPTURE', ratio: '4:3' }
  if (pageKey === 'examples' && sectionIndex === 1) return { id: 'B2B-VIS-07', name: 'Reference Experience Set', status: 'NEEDS REFERENCE CAPTURES', ratio: '4:3' }
  if (pageKey === 'integrations' && sectionIndex === 1) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  if (pageKey === 'pilot' && sectionIndex === 2) return { id: 'B2B-VIS-05', name: 'Merchant Workspace', status: 'NEEDS MERCHANT CAPTURE' }
  return null
}

function isContrastSection(pageKey: BusinessPageKey, index: number) {
  if (pageKey === 'overview' && index === 3) return true
  if (pageKey === 'intelligence' && index === 0) return true
  return false
}

function SectionBlock({ pageKey, section, index, locale }: { pageKey: BusinessPageKey; section: BusinessSection; index: number; locale: string }) {
  const slot = supplementalSlot(pageKey, index)
  const contrast = isContrastSection(pageKey, index)
  const split = Boolean(slot)

  return (
    <section className={contrast ? 'bg-slate-950 text-white' : index % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
      <div className={`mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 ${split ? 'grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14' : ''}`}>
        <div className={split ? '' : 'mx-auto max-w-5xl'}>
          {section.eyebrow ? <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${contrast ? 'text-sky-300' : 'text-blue-700'}`}>{section.eyebrow}</p> : null}
          <h2 className={`mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[2.7rem] lg:leading-[1.08] ${contrast ? 'text-white' : 'text-slate-950'}`}>{section.title}</h2>
          {section.body ? <p className={`mt-5 max-w-3xl text-base leading-7 ${contrast ? 'text-slate-300' : 'text-slate-600'}`}>{section.body}</p> : null}
          {section.steps ? <StepBand steps={section.steps} dark={contrast} /> : null}
          {section.cards ? <EditorialCards section={section} locale={locale} dark={contrast} /> : null}
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
