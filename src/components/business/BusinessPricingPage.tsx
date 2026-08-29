import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { businessHref } from '@/config/business-site'
import {
  FOUNDING_PILOT_OFFER,
  getMerchantPlanDefinition,
  type MerchantPlanCode,
} from '@/modules/merchant/domain/merchant-commercial-plans'

const comparisonPlanCodes = ['FREE', 'LAUNCH', 'GROWTH', 'SCALE', 'ENTERPRISE'] as const
type ComparisonPlanCode = (typeof comparisonPlanCodes)[number]

function planPath(planCode: MerchantPlanCode) {
  if (planCode === 'FREE') return '/merchant'
  return `/business/pilot?plan=${planCode.toLowerCase()}`
}

function planCta(planCode: MerchantPlanCode) {
  if (planCode === 'FREE') return 'Start Free'
  if (planCode === 'ENTERPRISE') return 'Contact Sales'
  if (planCode === 'FOUNDING_PILOT') return 'Start 30-Day Pilot'
  return `Choose ${getMerchantPlanDefinition(planCode).name}`
}

function formatLimit(value: number | null, unit: string, custom = 'Custom') {
  if (value === null) return custom
  return `${value.toLocaleString('en-US')} ${unit}`
}

function featureText(planCode: ComparisonPlanCode) {
  const plan = getMerchantPlanDefinition(planCode)
  return [
    plan.stores === 1 ? '1 canonical Store' : 'Custom Store setup',
    plan.catalogItems === null ? 'Custom catalog allowance' : `Up to ${formatLimit(plan.catalogItems, 'items')}`,
    plan.activeCampaigns === null ? 'Custom Campaign allowance' : plan.activeCampaigns === 0 ? 'No active Campaigns' : `${plan.activeCampaigns} active Campaign${plan.activeCampaigns === 1 ? '' : 's'}`,
    plan.aiCommerceSessions === null ? planCode === 'FREE' ? 'Not included' : 'Custom usage allowance' : formatLimit(plan.aiCommerceSessions, 'AI Commerce Sessions'),
    plan.recommendation ? 'Included' : '—',
    plan.generativeTryOn ? 'Included' : 'Not included',
    plan.compare ? 'Included' : '—',
    plan.analytics === 'advanced' ? 'Advanced' : plan.analytics === 'basic' ? 'Basic' : '—',
    planCode === 'ENTERPRISE' ? 'Custom' : '—',
    planCode === 'ENTERPRISE' ? 'Custom' : '—',
  ]
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
      <Check className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

function PlanCard({ locale, planCode }: { locale: string; planCode: ComparisonPlanCode }) {
  const plan = getMerchantPlanDefinition(planCode)
  const emphasized = planCode === 'GROWTH'
  const recommended = planCode === 'LAUNCH' ? 'Recommended entry' : planCode === 'GROWTH' ? 'Best for growing brands' : null

  return (
    <article
      data-plan-code={planCode}
      className={`relative flex h-full flex-col rounded-2xl border p-6 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.45)] ${emphasized ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 bg-white'}`}
    >
      {recommended ? <p className="absolute -top-3 left-5 rounded-full bg-blue-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{recommended}</p> : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{plan.name}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{plan.priceLabel}</h3>
        </div>
        {planCode === 'ENTERPRISE' ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Custom</span> : null}
      </div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">
        {planCode === 'FREE' ? 'A useful starting point for a live Store and basic recommendation.' : planCode === 'LAUNCH' ? 'A practical first paid tier for a focused merchant launch.' : planCode === 'GROWTH' ? 'More room for growing catalogs, campaigns, and shopper journeys.' : planCode === 'SCALE' ? 'Higher-volume capacity for established eyewear commerce programs.' : 'For brands, agencies, and larger commerce programs that need custom scale or integrations.'}
      </p>
      <ul className="mt-6 space-y-2.5">
        <CheckItem>{plan.stores === 1 ? '1 Store' : 'Custom Store setup'}</CheckItem>
        <CheckItem>{plan.catalogItems === null ? 'Custom catalog allowance' : `Up to ${formatLimit(plan.catalogItems, 'catalog items')}`}</CheckItem>
        <CheckItem>{plan.activeCampaigns === null ? 'Custom Campaign allowance' : plan.activeCampaigns === 0 ? 'No active Campaigns' : `${plan.activeCampaigns} active Campaign${plan.activeCampaigns === 1 ? '' : 's'}`}</CheckItem>
        <CheckItem>{plan.aiCommerceSessions === null ? planCode === 'FREE' ? 'Normal Store traffic is not usage-metered' : 'Custom AI Commerce Session allowance' : `Up to ${formatLimit(plan.aiCommerceSessions, 'AI Commerce Sessions')}`}</CheckItem>
        <CheckItem>{plan.recommendation ? 'Basic Recommendation' : 'Recommendation not included'}</CheckItem>
        <CheckItem>{plan.generativeTryOn ? 'Generative Try-On' : 'Generative Try-On not included'}</CheckItem>
        <CheckItem>{plan.compare ? 'Compare' : 'Compare not included'}</CheckItem>
        <CheckItem>{plan.analytics === 'advanced' ? 'Advanced merchant analytics' : plan.analytics === 'basic' ? 'Basic merchant analytics' : 'Custom analytics'}</CheckItem>
      </ul>
      <div className="mt-auto pt-7">
        <Link
          href={businessHref(locale, planPath(planCode))}
          prefetch={false}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${emphasized ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
        >
          {planCta(planCode)}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {planCode === 'ENTERPRISE' ? <p className="mt-3 text-center text-xs leading-5 text-slate-500">Custom catalog, usage, API / integrations, and SLA are scoped with Sales.</p> : null}
      </div>
    </article>
  )
}

function ComparisonTable() {
  const rows = [
    'Monthly price',
    'Store',
    'Catalog items',
    'Active Campaigns',
    'AI Commerce Sessions',
    'Basic Recommendation',
    'Generative Try-On',
    'Compare',
    'Analytics',
    'API / integrations',
    'Support / SLA',
  ]
  const valuesByPlan = comparisonPlanCodes.map((code) => [getMerchantPlanDefinition(code).priceLabel, ...featureText(code)])

  return (
    <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)]">
      <table aria-label="Merchant plan comparison" className="min-w-[900px] w-full border-collapse text-left text-sm">
        <caption className="sr-only">Merchant plan comparison</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th scope="col" className="sticky left-0 z-10 w-48 bg-slate-50 px-4 py-4 font-semibold text-slate-700">Capability</th>
            {comparisonPlanCodes.map((code) => <th key={code} scope="col" className="px-4 py-4 font-semibold text-slate-950">{getMerchantPlanDefinition(code).name}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row} className="border-b border-slate-100 last:border-0">
              <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3.5 font-medium text-slate-700">{row}</th>
              {comparisonPlanCodes.map((code, planIndex) => <td key={code} className="px-4 py-3.5 text-slate-600">{valuesByPlan[planIndex][rowIndex]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PilotSection({ locale }: { locale: string }) {
  const pilot = getMerchantPlanDefinition('FOUNDING_PILOT')
  return (
    <section id="pilot" className="border-y border-violet-200 bg-violet-50/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Founding Merchant Pilot</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">A low-risk 30-day validation.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">For brands that want to test a real frame set, a hosted Store or Campaign, and observable shopper intent before choosing a longer-term plan.</p>
          <p className="mt-7 text-5xl font-semibold tracking-[-0.05em] text-slate-950">{pilot.priceLabel}</p>
          <Link href={businessHref(locale, planPath('FOUNDING_PILOT'))} prefetch={false} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">{planCta('FOUNDING_PILOT')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <p className="mt-4 text-xs font-semibold text-violet-900">$149 once · no automatic renewal · no silent conversion</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Included capacity</p><p className="mt-2 text-lg font-semibold text-slate-950">Up to {FOUNDING_PILOT_OFFER.aiAssistedShoppers.toLocaleString('en-US')} AI-assisted shoppers</p><p className="mt-1 text-sm text-slate-600">One AI Commerce Session represents one shopper journey, not each model call.</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Standard Try-On</p><p className="mt-2 text-lg font-semibold text-slate-950">Up to {FOUNDING_PILOT_OFFER.standardTryOnGenerations.toLocaleString('en-US')} generations</p><p className="mt-1 text-sm text-slate-600">A bounded capacity for the validation period.</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Catalog scope</p><p className="mt-2 text-lg font-semibold text-slate-950">{FOUNDING_PILOT_OFFER.catalogFrames.min}–{FOUNDING_PILOT_OFFER.catalogFrames.max} reviewed frames</p><p className="mt-1 text-sm text-slate-600">Start focused, then review what shoppers actually explore.</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Working model</p><p className="mt-2 text-lg font-semibold text-slate-950">{pilot.setupLabel ?? FOUNDING_PILOT_OFFER.setup}</p><p className="mt-1 text-sm text-slate-600">{FOUNDING_PILOT_OFFER.included.join(' · ')} are included in the hosted experience.</p></div>
          </div>
          <div className="mt-7 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">At day 30, the merchant chooses Free, Launch, Growth, or Scale. The Store and catalog are retained; the Pilot does not renew automatically.</div>
        </div>
      </div>
    </section>
  )
}

function UsageSection() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">How usage works</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Clear capacity, without shutting down the Store.</h2><p className="mt-5 text-base leading-7 text-slate-300">AI Commerce Sessions measure a shopper who starts an AI-assisted journey in one Store or Campaign. Recommendation, multiple Try-Ons, Compare, and Intent in that journey count as one session. Ordinary browsing does not.</p></div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold text-white">Normal browsing stays open</p><p className="mt-3 text-sm leading-6 text-slate-300">Store visits, catalog browsing, product links, inquiries, and analytics do not consume paid AI Commerce Sessions.</p></article>
          <article className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold text-white">At the limit</p><p className="mt-3 text-sm leading-6 text-slate-300">The Store and catalog remain live. Basic Recommendation may remain available according to plan policy; generative Try-On pauses until capacity is restored.</p></article>
          <article className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold text-white">No surprise billing</p><p className="mt-3 text-sm leading-6 text-slate-300">There are no automatic overage charges and no rollover. Upgrade or wait for the next billing period.</p></article>
        </div>
        <div className="mt-8 flex items-start gap-3 border-t border-white/15 pt-6 text-sm leading-6 text-slate-300"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" /><span>One Merchant / Brand has one canonical Store. Campaigns are focused marketing activations that use the same catalog; they are not additional Stores.</span></div>
      </div>
    </section>
  )
}

function FaqSection() {
  const faq = [
    ['What counts as an AI Commerce Session?', 'One shopper starts an AI-assisted shopping journey in one Store or Campaign. Recommendation, multiple Try-Ons, Compare, and Intent in that journey count as one session. Plain browsing does not.'],
    ['What happens if I reach my session limit?', 'Your Store, catalog, product browsing, product links, inquiries, and analytics remain available. Generative Try-On pauses until capacity is restored.'],
    ['Does the Founding Pilot renew automatically?', 'No. It is a one-time $149, 30-day offer with no automatic renewal or silent conversion to a monthly plan.'],
    ['Can I keep my Store if I cancel?', 'Yes. The Store and catalog are retained. Paid AI features change according to the commercial state and plan.'],
    ['Can I upgrade later?', 'Yes. Start with Free or the Founding Pilot, then choose Launch, Growth, or Scale based on the capacity you need.'],
    ['Do I need a technical integration to start?', 'No for the hosted Store path. Start with a reviewed catalog and your existing product or inquiry destinations.'],
    ['How many Stores do I get?', 'One canonical Store per Merchant / Brand in the current model.'],
  ] as const

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Questions before you start</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Commercial details, in plain language.</h2>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {faq.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-slate-950 [&::-webkit-details-marker]:hidden"><span>{question}</span><span className="text-xl font-normal text-slate-400 transition group-open:rotate-45">+</span></summary><p className="max-w-3xl pr-8 pt-3 text-sm leading-6 text-slate-600">{answer}</p></details>)}
        </div>
      </div>
    </section>
  )
}

export function BusinessPricingPage({ locale }: { locale: string }) {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Merchant plans</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Choose the capacity that matches your next stage.</h2><p className="mt-5 text-base leading-7 text-slate-600">Every plan supports one canonical Store per Merchant / Brand. Choose a focused Pilot, start Free, or move into recurring capacity as your catalog and shopper journeys grow.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{comparisonPlanCodes.map((code) => <PlanCard key={code} locale={locale} planCode={code} />)}</div>
        </div>
      </section>

      <PilotSection locale={locale} />

      <section className="bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Compare plans</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">The same commercial model, side by side.</h2><p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">Use the comparison to choose capacity. API, integrations, and SLA are custom Enterprise scope; the current Merchant model does not imply multi-Store agency support.</p><ComparisonTable /></div>
      </section>

      <UsageSection />
      <FaqSection />

      <section className="border-t border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Ready when you are</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Start with the smallest useful next step.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Bring a real frame set, a clear shopper question, and the traffic source you already have.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link href={businessHref(locale, '/business/pilot')} prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">Start a Pilot<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href={businessHref(locale, '/business/pilot?plan=enterprise')} prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">Contact Sales<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div>
      </section>
    </>
  )
}
