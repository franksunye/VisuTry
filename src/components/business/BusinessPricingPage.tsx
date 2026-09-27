import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { businessHref } from '@/config/business-site'
import {
  FOUNDING_PILOT_OFFER,
  getMerchantPlanDefinition,
  type MerchantPlanCode,
} from '@/modules/merchant/domain/merchant-commercial-plans'
import { merchantPurchasePath, type MerchantPurchaseIntent } from '@/modules/merchant/domain/merchant-purchase-intent'
import { PricingTooltip } from './PricingTooltip'

const primaryPlanCodes = ['LAUNCH', 'GROWTH', 'SCALE'] as const
const comparisonPlanCodes = ['FREE', 'LAUNCH', 'GROWTH', 'SCALE', 'ENTERPRISE'] as const
type PrimaryPlanCode = (typeof primaryPlanCodes)[number]
type ComparisonPlanCode = (typeof comparisonPlanCodes)[number]

function planPath(planCode: MerchantPlanCode) {
  if (planCode === 'ENTERPRISE') return '/business/pilot?plan=enterprise'
  return merchantPurchasePath(planCode as MerchantPurchaseIntent)
}

function planCta(planCode: MerchantPlanCode) {
  if (planCode === 'FREE') return 'Start Free'
  if (planCode === 'ENTERPRISE') return 'Contact Sales'
  if (planCode === 'FOUNDING_PILOT') return 'Start 30-Day Pilot'
  return `Choose ${getMerchantPlanDefinition(planCode).name}`
}

function formatNumber(value: number | null) {
  return value === null ? 'Custom' : value.toLocaleString('en-US')
}

function planPositioning(planCode: PrimaryPlanCode) {
  if (planCode === 'LAUNCH') return 'For brands starting to turn Store traffic into AI-assisted shopping.'
  if (planCode === 'GROWTH') return 'For growing brands with more catalog depth and shopper journeys.'
  return 'For higher-volume commerce programs and active campaign portfolios.'
}

function PrimaryPlanCard({ locale, planCode }: { locale: string; planCode: PrimaryPlanCode }) {
  const plan = getMerchantPlanDefinition(planCode)
  const emphasized = planCode === 'GROWTH'

  return (
    <article
      data-plan-code={planCode}
      data-primary-plan="true"
      className={`relative flex h-full flex-col rounded-2xl border p-6 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.45)] ${emphasized ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 bg-white'}`}
    >
      {emphasized ? <p className="absolute -top-3 left-5 rounded-full bg-blue-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">Recommended</p> : null}
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{plan.name}</p>
      <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{plan.priceLabel}</h3>
      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">{planPositioning(planCode)}</p>
      <dl className="mt-7 grid gap-4 border-y border-slate-200 py-5">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">AI Commerce Sessions</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">{formatNumber(plan.aiCommerceSessions)}</dd>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Catalog items</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-950">{formatNumber(plan.catalogItems)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Active Campaigns</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-950">{formatNumber(plan.activeCampaigns)}</dd>
          </div>
        </div>
      </dl>
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Check className="h-4 w-4 text-blue-700" aria-hidden="true" />
        Generative Try-On included
      </p>
      <div className="mt-auto pt-7">
        <Link
          href={businessHref(locale, planPath(planCode))}
          prefetch={false}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${emphasized ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
        >
          {planCta(planCode)}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function FreeEntry({ locale }: { locale: string }) {
  const plan = getMerchantPlanDefinition('FREE')

  return (
    <section data-plan-code="FREE" data-free-entry="true" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Start free</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{plan.priceLabel}</h2>
            <p className="text-sm text-slate-600">{plan.stores} Store · {plan.catalogItems} products · Basic Recommendation</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">No credit card required</p>
          <Link href={businessHref(locale, planPath('FREE'))} prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
            {planCta('FREE')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function analyticsLabel(planCode: ComparisonPlanCode) {
  if (planCode === 'ENTERPRISE') return 'Custom'
  const plan = getMerchantPlanDefinition(planCode)
  if (plan.analytics === 'advanced') return 'Advanced'
  return plan.sourceAttribution ? 'Standard' : 'Basic'
}

function comparisonRows() {
  const plans = comparisonPlanCodes.map((code) => getMerchantPlanDefinition(code))
  return [
    { label: 'Price', values: plans.map((plan) => plan.priceLabel) },
    { label: 'Store', tooltip: 'Each Merchant or Brand has one canonical Store in the current model.', values: comparisonPlanCodes.map((code) => code === 'ENTERPRISE' ? '1 / Brand' : '1') },
    { label: 'Catalog items', values: plans.map((plan) => formatNumber(plan.catalogItems)) },
    { label: 'Active Campaigns', tooltip: 'Only published and active Campaigns count toward your plan limit. Draft Campaigns do not.', values: plans.map((plan) => formatNumber(plan.activeCampaigns)) },
    { label: 'AI Commerce Sessions', tooltip: 'One shopper using Recommendation, Try-On, or Compare within the same session counts as 1 AI Commerce Session. Plain browsing does not count.', values: plans.map((plan) => plan.code === 'FREE' ? 'Not applicable' : formatNumber(plan.aiCommerceSessions)) },
    { label: 'AI Recommendation', values: plans.map((plan) => plan.recommendation ? plan.code === 'FREE' ? 'Basic' : '✓ Included' : '—') },
    { label: 'Generative Try-On', tooltip: 'If included AI Commerce Session capacity is exhausted, your Store stays live while generative Try-On pauses until capacity is restored.', values: plans.map((plan) => plan.generativeTryOn ? '✓ Included' : '—') },
    { label: 'Frame Compare', values: plans.map((plan) => plan.compare ? '✓ Included' : '—') },
    { label: 'Decision Result & secure continuation', tooltip: 'Paid plans can carry a shopper’s decision result to their phone through a secure continuation link or QR code.', values: comparisonPlanCodes.map((code) => code === 'FREE' ? '—' : '✓ Included') },
    { label: 'Merchant Handoff', tooltip: 'Free Stores can link to products. Paid plans can use configured handoff actions such as store visit, appointment, inquiry, or supported merchant destinations.', values: comparisonPlanCodes.map((code) => code === 'FREE' ? 'Basic product links' : '✓ Included') },
    { label: 'Kiosk-ready delivery', tooltip: 'A shared-device delivery profile with reset and secure phone continuation. Launch and Growth can arrange an add-on; Scale includes the profile. Hardware and custom installation are separately scoped.', values: comparisonPlanCodes.map((code) => code === 'FREE' ? '—' : code === 'LAUNCH' || code === 'GROWTH' ? 'Add-on' : code === 'SCALE' ? 'Included' : 'Custom') },
    { label: 'Commerce analytics & attribution', tooltip: 'Free includes basic Store analytics; Launch adds source attribution. Growth and Scale include advanced commerce analytics. Enterprise scope is tailored.', values: comparisonPlanCodes.map(analyticsLabel) },
    { label: 'Custom integration scope', tooltip: 'Enterprise can scope specific integration work with VisuTry. This does not imply a generally available public API, webhook, CRM, or booking-provider product.', values: comparisonPlanCodes.map((code) => code === 'ENTERPRISE' ? 'Scoped' : '—') },
    { label: 'Support / SLA', values: comparisonPlanCodes.map((code) => code === 'ENTERPRISE' ? 'Custom SLA' : code === 'GROWTH' || code === 'SCALE' ? 'Priority' : code === 'LAUNCH' ? 'Standard' : 'Self-service') },
  ]
}

function ComparisonTable() {
  const rows = comparisonRows()

  return (
    <div className="mt-10 w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)]">
      <table aria-label="Merchant plan comparison" className="min-w-[980px] w-full border-collapse text-left text-sm">
        <caption className="sr-only">Merchant plan comparison</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th scope="col" className="sticky left-0 z-10 w-52 bg-slate-50 px-4 py-4 font-semibold text-slate-700">Capability</th>
            {comparisonPlanCodes.map((code) => <th key={code} scope="col" data-comparison-plan={code} className={`px-4 py-4 font-semibold ${code === 'GROWTH' ? 'bg-blue-50 text-blue-950' : 'text-slate-950'}`}>{getMerchantPlanDefinition(code).name}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0">
              <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3.5 font-medium text-slate-700">
                <span className="inline-flex items-center">{row.label}{row.tooltip ? <PricingTooltip label={row.label} description={row.tooltip} /> : null}</span>
              </th>
              {row.values.map((value, index) => <td key={comparisonPlanCodes[index]} className={`px-4 py-3.5 ${comparisonPlanCodes[index] === 'GROWTH' ? 'bg-blue-50/50 text-blue-950' : 'text-slate-600'}`}>{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MerchantExperienceCapabilities() {
  const capabilities = [
    ['Guided Decision Journey', 'Use a bounded shopper journey to move from understanding and recommendation through Try-On and Compare.'],
    ['Decision Result & continuation', 'Carry the shopper’s useful result beyond the session, including secure QR / phone continuation from a shared device.'],
    ['Merchant Handoff', 'Return intent to the merchant through configured Visit Store, appointment, WhatsApp, email, product, or safe-link actions.'],
    ['Kiosk-ready delivery', 'Deliver the same Store or Campaign through the Kiosk profile with shared-device reset and privacy safeguards.'],
  ] as const

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Merchant Experience capabilities</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">The product is more than Recommendation, Try-On, and Compare.</h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">VisuTry carries the shopper from discovery through a guided decision, a reusable result, and a configured merchant handoff. Plan availability is shown in the comparison below; these capabilities do not create new usage meters.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(([title, description]) => (
            <article key={title} className="border-t border-slate-300 pt-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Check className="h-4 w-4 text-blue-700" aria-hidden="true" />{title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-4xl text-sm leading-6 text-slate-500">Plan entitlements still govern metered AI capabilities such as Generative Try-On and the included AI Commerce Session capacity. Kiosk delivery is a delivery profile, available by plan or add-on; hardware and custom setup are scoped separately.</p>
      </div>
    </section>
  )
}

function PilotSection({ locale }: { locale: string }) {
  return (
    <section id="pilot" data-plan-code="FOUNDING_PILOT" className="border-y border-violet-200 bg-violet-50/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Founding Pilot</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Validate before choosing a monthly plan.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Test real products and shopper traffic with assisted setup and a focused 30-day review cycle.</p>
          <p className="mt-7 text-5xl font-semibold tracking-[-0.05em] text-slate-950">{FOUNDING_PILOT_OFFER.priceLabel}</p>
          <p className="mt-3 text-sm font-semibold text-violet-950">One-time · 30 days · No auto-renew</p>
          <Link href={businessHref(locale, planPath('FOUNDING_PILOT'))} prefetch={false} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            {planCta('FOUNDING_PILOT')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">AI-assisted shoppers</p><p className="mt-2 text-lg font-semibold text-slate-950">{FOUNDING_PILOT_OFFER.aiAssistedShoppers.toLocaleString('en-US')}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Standard Try-On generations</p><p className="mt-2 text-lg font-semibold text-slate-950">{FOUNDING_PILOT_OFFER.standardTryOnGenerations.toLocaleString('en-US')}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Catalog scope</p><p className="mt-2 text-lg font-semibold text-slate-950">{FOUNDING_PILOT_OFFER.catalogFrames.min}–{FOUNDING_PILOT_OFFER.catalogFrames.max} frames</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Working model</p><p className="mt-2 text-lg font-semibold text-slate-950">{FOUNDING_PILOT_OFFER.setup}</p></div>
          </div>
          <div className="mt-7 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">The Pilot includes a guided decision experience with Recommendation, Standard Try-On, Compare, Decision Result / continuation, and configured Merchant Handoff. Kiosk-ready delivery can be configured when the Pilot use case requires it. At day 30, choose Free, Launch, Growth, or Scale. The Store and catalog are retained.</div>
        </div>
      </div>
    </section>
  )
}

function EnterpriseSection({ locale }: { locale: string }) {
  const enterprise = getMerchantPlanDefinition('ENTERPRISE')

  return (
    <section id="enterprise" data-plan-code="ENTERPRISE" className="bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Enterprise</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Custom scale for larger commerce programs.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">For brands, agencies, and teams that need custom usage, scoped integration work, commercial onboarding, or SLA requirements.</p>
          <p className="mt-4 text-2xl font-semibold text-slate-950">{enterprise.priceLabel}</p>
          <p className="mt-2 text-sm text-slate-500">One Merchant / Brand has one canonical Store.</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:min-w-80">
          <ul className="space-y-3 text-sm text-slate-700">
            <li>Custom AI Commerce Sessions</li>
            <li>Custom catalog and Campaign limits</li>
            <li>Scoped integration work</li>
            <li>Custom support / SLA</li>
          </ul>
          <Link href={businessHref(locale, planPath('ENTERPRISE'))} prefetch={false} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            {planCta('ENTERPRISE')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function UsageSection() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">How AI Commerce Sessions work</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">One shopper journey, one session.</h2>
          <p className="mt-5 text-base leading-7 text-slate-300">A shopper enters a Store or Campaign, starts Recommendation, Try-On, or Compare, and can continue through multiple AI interactions within the same visit. That journey counts as one AI Commerce Session.</p>
        </div>
        <div aria-label="AI Commerce Session journey" className="mt-10 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm font-semibold text-white sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-6">
          <span>Store or Campaign</span><ArrowRight className="hidden h-4 w-4 text-sky-300 sm:block" aria-hidden="true" /><span>Guided AI decision journey</span><ArrowRight className="hidden h-4 w-4 text-sky-300 sm:block" aria-hidden="true" /><span>1 AI Commerce Session</span>
        </div>
        <p className="mt-4 text-sm text-slate-400">Recommendation, multiple Try-Ons, and Compare within the same attributed visit still count as one AI Commerce Session. Decision Result, QR continuation, and Merchant Handoff do not add a second session meter. Plain browsing, product views, and product clicks do not consume a paid AI Commerce Session.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold text-white">Store stays live</p><p className="mt-3 text-sm leading-6 text-slate-300">When included capacity is reached, Store browsing, product links, inquiries, and analytics remain available.</p></article>
          <article className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold text-white">Try-On pauses</p><p className="mt-3 text-sm leading-6 text-slate-300">Generative Try-On pauses until capacity is restored or the next billing period begins. Basic Recommendation follows plan policy.</p></article>
          <article className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold text-white">No surprise billing</p><p className="mt-3 text-sm leading-6 text-slate-300">There are no automatic overage charges and no rollover. Included usage resets each billing period.</p></article>
        </div>
        <div className="mt-8 flex items-start gap-3 border-t border-white/15 pt-6 text-sm leading-6 text-slate-300"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" /><span>One Merchant / Brand has one canonical Store. Campaigns are focused marketing activations that use the same catalog.</span></div>
      </div>
    </section>
  )
}

function FaqSection() {
  const faq = [
    ['What counts as an AI Commerce Session?', 'One shopper starts an AI-assisted shopping journey in one Store or Campaign. Recommendation, multiple Try-Ons, Compare, and Intent in that journey count as one session. Plain browsing does not.'],
    ['What happens when I reach my session limit?', 'Your Store, catalog, product browsing, product links, inquiries, and analytics remain available. Generative Try-On pauses until capacity is restored.'],
    ['Does the Founding Pilot renew automatically?', 'No. It is a one-time $149, 30-day offer with no automatic renewal or silent conversion to a monthly plan.'],
    ['Can I upgrade later?', 'Yes. Start with Free or the Founding Pilot, then choose Launch, Growth, or Scale based on the capacity you need.'],
    ['Do I keep my Store if my paid plan ends?', 'Yes. The Store and catalog are retained. Paid AI features change according to the commercial state and plan.'],
    ['How many Stores do I get?', 'One canonical Store per Merchant / Brand in the current model.'],
    ['Do I need a technical integration to start?', 'No for the hosted Store path. Start with a reviewed catalog and your existing product or inquiry destinations.'],
    ['Are Kiosk, Decision Result, and Merchant Handoff separate usage meters?', 'No. They are Merchant Experience capabilities, not additional usage meters. Metered AI features and AI Commerce Session capacity still follow the selected plan.'],
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
      <FreeEntry locale={locale} />

      <section className="bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Choose a plan</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Capacity for the next stage of shopper engagement.</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">Launch, Growth, and Scale use the same one-Store Merchant model with different catalog, Campaign, and AI Commerce Session capacity.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{primaryPlanCodes.map((code) => <PrimaryPlanCard key={code} locale={locale} planCode={code} />)}</div>
        </div>
      </section>

      <MerchantExperienceCapabilities />

      <PilotSection locale={locale} />

      <section className="bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Compare plans</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">The same commercial model, side by side.</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">Compare included capacity, the shopper decision experience, and operating capabilities. The Founding Pilot is a separate 30-day offer.</p>
          <ComparisonTable />
        </div>
      </section>

      <EnterpriseSection locale={locale} />
      <UsageSection />
      <FaqSection />
    </>
  )
}
