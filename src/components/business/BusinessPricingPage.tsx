import { Fragment } from 'react'
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
import { BusinessTrackedCtaLink } from './BusinessTrackedCtaLink'

const primaryPlanCodes = ['LAUNCH', 'GROWTH', 'SCALE'] as const
const comparisonPlanCodes = ['FREE', 'LAUNCH', 'GROWTH', 'SCALE', 'ENTERPRISE'] as const
type PrimaryPlanCode = (typeof primaryPlanCodes)[number]
type ComparisonPlanCode = (typeof comparisonPlanCodes)[number]

function planPath(planCode: MerchantPlanCode) {
  if (planCode === 'ENTERPRISE') return '/business/pilot?plan=enterprise'
  if (planCode === 'FOUNDING_PILOT') return '/business/pilot'
  return merchantPurchasePath(planCode as MerchantPurchaseIntent)
}

function planCta(planCode: MerchantPlanCode) {
  if (planCode === 'FREE') return 'Start Free'
  if (planCode === 'ENTERPRISE') return 'Contact Sales'
  if (planCode === 'FOUNDING_PILOT') return 'Request Pilot Review'
  return `Choose ${getMerchantPlanDefinition(planCode).name}`
}

function formatNumber(value: number | null) {
  return value === null ? 'Custom' : value.toLocaleString('en-US')
}

function planPositioning(planCode: PrimaryPlanCode) {
  if (planCode === 'LAUNCH') return 'Launch the complete AI-assisted eyewear decision journey.'
  if (planCode === 'GROWTH') return 'Turn multiple Campaigns into measurable shopper intent.'
  return 'Run higher-volume digital and in-store decision experiences.'
}

function planHighlight(planCode: PrimaryPlanCode) {
  if (planCode === 'LAUNCH') return 'Recommendation + Try-On + Compare + Decision Result'
  if (planCode === 'GROWTH') return 'Advanced commerce analytics included'
  return 'In-store Kiosk Mode included'
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
      <p className="flex items-start gap-2 text-sm font-semibold leading-5 text-slate-700">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
        {planHighlight(planCode)}
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

function kioskDeliveryLabel(planCode: ComparisonPlanCode) {
  const entitlement = getMerchantPlanDefinition(planCode).kioskDelivery
  if (entitlement === 'add_on') return 'Add-on'
  if (entitlement === 'included') return 'Included'
  if (entitlement === 'custom') return 'Custom'
  return '—'
}

function comparisonRows() {
  const plans = comparisonPlanCodes.map((code) => getMerchantPlanDefinition(code))
  return [
    { group: 'Capacity', label: 'Price', values: plans.map((plan) => plan.priceLabel) },
    { group: 'Capacity', label: 'Store', tooltip: 'Each Merchant or Brand has one canonical Store in the current model.', values: comparisonPlanCodes.map((code) => code === 'ENTERPRISE' ? '1 / Brand' : '1') },
    { group: 'Capacity', label: 'Catalog items', values: plans.map((plan) => formatNumber(plan.catalogItems)) },
    { group: 'Capacity', label: 'Active Campaigns', tooltip: 'Only published and active Campaigns count toward your plan limit. Draft Campaigns do not.', values: plans.map((plan) => formatNumber(plan.activeCampaigns)) },
    { group: 'Capacity', label: 'AI Commerce Sessions', tooltip: 'One shopper using Recommendation, Try-On, or Compare within the same session counts as 1 AI Commerce Session. Plain browsing does not count.', values: plans.map((plan) => plan.code === 'FREE' ? 'Not applicable' : formatNumber(plan.aiCommerceSessions)) },
    { group: 'Decision journey', label: 'AI Recommendation', values: plans.map((plan) => plan.recommendation ? plan.code === 'FREE' ? 'Basic' : '✓ Included' : '—') },
    { group: 'Decision journey', label: 'Generative Try-On', tooltip: 'If included AI Commerce Session capacity is exhausted, your Store stays live while generative Try-On pauses until capacity is restored.', values: plans.map((plan) => plan.generativeTryOn ? '✓ Included' : '—') },
    { group: 'Decision journey', label: 'Frame Compare', values: plans.map((plan) => plan.compare ? '✓ Included' : '—') },
    { group: 'Decision journey', label: 'Decision Result + mobile continuation', tooltip: 'Paid plans can carry a shopper’s decision result to their phone through a secure continuation link or QR code.', values: plans.map((plan) => plan.decisionResult ? '✓ Included' : '—') },
    { group: 'Commerce', label: 'Merchant Actions', tooltip: 'Free Stores can link to products. Paid plans can use configured actions such as store visit, appointment, inquiry, or supported merchant destinations.', values: plans.map((plan) => plan.merchantHandoff ? '✓ Included' : 'Basic product links') },
    { group: 'Commerce', label: 'Commerce analytics & attribution', tooltip: 'Free includes basic Store analytics; Launch adds source attribution. Growth and Scale include advanced commerce analytics. Enterprise scope is tailored.', values: comparisonPlanCodes.map(analyticsLabel) },
    { group: 'Delivery & service', label: 'In-store Kiosk Mode', tooltip: 'A shared-device delivery profile with reset and secure phone continuation. Launch and Growth can arrange an add-on; Scale includes the profile. Hardware and custom installation are separately scoped.', values: comparisonPlanCodes.map(kioskDeliveryLabel) },
    { group: 'Delivery & service', label: 'Custom integration scope', tooltip: 'Enterprise can scope specific integration work with VisuTry. This does not imply a generally available public API, webhook, CRM, or booking-provider product.', values: comparisonPlanCodes.map((code) => code === 'ENTERPRISE' ? 'Scoped' : '—') },
    { group: 'Delivery & service', label: 'Support / SLA', values: comparisonPlanCodes.map((code) => code === 'ENTERPRISE' ? 'Custom SLA' : code === 'GROWTH' || code === 'SCALE' ? 'Priority' : code === 'LAUNCH' ? 'Standard' : 'Self-service') },
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
          {rows.map((row, rowIndex) => {
            const showGroup = rowIndex === 0 || rows[rowIndex - 1].group !== row.group
            return (
              <Fragment key={row.label}>
                {showGroup ? (
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th colSpan={comparisonPlanCodes.length + 1} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{row.group}</th>
                  </tr>
                ) : null}
                <tr className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3.5 font-medium text-slate-700">
                    <span className="inline-flex items-center">{row.label}{row.tooltip ? <PricingTooltip label={row.label} description={row.tooltip} /> : null}</span>
                  </th>
                  {row.values.map((value, index) => <td key={comparisonPlanCodes[index]} className={`px-4 py-3.5 ${comparisonPlanCodes[index] === 'GROWTH' ? 'bg-blue-50/50 text-blue-950' : 'text-slate-600'}`}>{value}</td>)}
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MerchantExperienceCapabilities() {
  const capabilities = [
    ['Guided Decision Journey', 'Move from a relevant shortlist through Try-On and Compare without breaking the shopping context.'],
    ['Decision Result', 'Keep the shopper’s shortlist, fit guidance, and try-on results together beyond the active session.'],
    ['Continue to Action', 'Move naturally to product, appointment, inquiry, store visit, or another configured merchant destination.'],
    ['Web & In-Store Delivery', 'Deliver the same decision experience through Store, Campaign, and Kiosk-ready shared-device use cases.'],
  ] as const

  return (
    <section data-pricing-section="decision-journey" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">From discovery to action</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">One journey from discovery to a confident decision — and merchant action.</h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">VisuTry helps shoppers discover the right frames, make a confident decision, keep that decision with them, and continue directly to the merchant’s next action.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(([title, description]) => (
            <article key={title} className="border-t border-slate-300 pt-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Check className="h-4 w-4 text-blue-700" aria-hidden="true" />{title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-4xl text-sm leading-6 text-slate-500">Availability varies by plan and is shown in the comparison below. These continuation and delivery capabilities do not add a second usage meter.</p>
      </div>
    </section>
  )
}

function PilotSection({ locale }: { locale: string }) {
  return (
    <section id="pilot" data-plan-code="FOUNDING_PILOT" data-pricing-section="pilot" className="border-y border-violet-200 bg-violet-50/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Founding Pilot</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Validate before choosing a monthly plan.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Start with a focused, real-world pilot using your own eyewear catalog. Final scope and pilot fee are confirmed based on your deployment configuration.</p>
          <p className="mt-7 text-5xl font-semibold tracking-[-0.05em] text-slate-950">From {FOUNDING_PILOT_OFFER.priceLabel}</p>
          <p className="mt-3 text-sm font-semibold text-violet-950">30 days · No auto-renew · Scope confirmed before billing</p>
          <BusinessTrackedCtaLink href={businessHref(locale, planPath('FOUNDING_PILOT'))} locale={locale} ctaLocation="pricing_pilot" intentType="pilot_request" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            {planCta('FOUNDING_PILOT')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </BusinessTrackedCtaLink>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Typical pilot includes</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm font-semibold text-slate-950">8–50 real frames</p><p className="mt-1 text-sm leading-6 text-slate-600">A focused selection from your own eyewear catalog.</p></div>
            <div><p className="text-sm font-semibold text-slate-950">AI-assisted shopper experience</p><p className="mt-1 text-sm leading-6 text-slate-600">Guided Recommendation and decision support using your products.</p></div>
            <div><p className="text-sm font-semibold text-slate-950">Virtual Try-On + Compare</p><p className="mt-1 text-sm leading-6 text-slate-600">Let shoppers evaluate shortlisted frames in the same journey.</p></div>
            <div><p className="text-sm font-semibold text-slate-950">Assisted setup + weekly review</p><p className="mt-1 text-sm leading-6 text-slate-600">Launch support and a focused review cycle during the Pilot.</p></div>
          </div>
          <div className="mt-7 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">Hosted, Campaign, in-store, and other deployment configurations may vary in scope and pricing. Final scope and pilot fee are confirmed before billing.</div>
        </div>
      </div>
    </section>
  )
}

function EnterpriseSection({ locale }: { locale: string }) {
  const enterprise = getMerchantPlanDefinition('ENTERPRISE')

  return (
    <section id="enterprise" data-plan-code="ENTERPRISE" data-pricing-section="enterprise" className="bg-white">
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
          <BusinessTrackedCtaLink href={businessHref(locale, planPath('ENTERPRISE'))} locale={locale} ctaLocation="pricing_enterprise" intentType="enterprise_inquiry" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            {planCta('ENTERPRISE')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </BusinessTrackedCtaLink>
        </div>
      </div>
    </section>
  )
}

function UsageSection() {
  return (
    <section data-pricing-section="usage-model" className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">How AI Commerce Sessions work</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">One shopper journey, one session.</h2>
          <p className="mt-5 text-base leading-7 text-slate-300">A shopper enters a Store or Campaign, starts Recommendation, Try-On, or Compare, and can continue through multiple AI interactions within the same visit. That journey counts as one AI Commerce Session — not one charge per recommendation or individual try-on.</p>
        </div>
        <div aria-label="AI Commerce Session journey" className="mt-10 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm font-semibold text-white sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-6">
          <span>Store or Campaign</span><ArrowRight className="hidden h-4 w-4 text-sky-300 sm:block" aria-hidden="true" /><span>Guided AI decision journey</span><ArrowRight className="hidden h-4 w-4 text-sky-300 sm:block" aria-hidden="true" /><span>1 AI Commerce Session</span>
        </div>
        <p className="mt-4 text-sm text-slate-400">Recommendation, multiple Try-Ons, and Compare within the same attributed visit still count as one AI Commerce Session. Decision Result, QR continuation, and Merchant Actions do not add a second session meter. Plain browsing, product views, and product clicks do not consume a paid AI Commerce Session.</p>
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

function ProductProofSection({ locale }: { locale: string }) {
  return (
    <section data-pricing-section="proof" className="border-y border-slate-200 bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Product proof</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">See the decision journey before you buy.</h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">Open a working Reference Experience or browse the product examples to evaluate the shopper journey directly. Reference Experiences demonstrate product capability and do not imply a customer or partner relationship.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Reference Campaign</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-slate-950">AKILA · Statement Frames</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">A working style-led Campaign Reference Experience using public catalog information.</p>
            <Link href={businessHref(locale, '/c/akila/statement-frames')} prefetch={false} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Open Reference Experience<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Product examples</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-slate-950">Store & Campaign patterns</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Review different eyewear merchandising and decision scenarios built on the same commerce workflow.</p>
            <Link href={businessHref(locale, '/business/examples')} prefetch={false} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Explore Product Examples<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  const faq = [
    ['What counts as an AI Commerce Session?', 'One shopper starts an AI-assisted shopping journey in one Store or Campaign. Recommendation, multiple Try-Ons, Compare, and Intent in that journey count as one session. Plain browsing does not.'],
    ['What happens when I reach my session limit?', 'Your Store, catalog, product browsing, product links, inquiries, and analytics remain available. Generative Try-On pauses until capacity is restored.'],
    ['Does the Founding Pilot renew automatically?', 'No. The Founding Pilot starts from $149 / 30 days. Final scope and fee are confirmed based on deployment configuration, with no automatic renewal or silent conversion to a monthly plan.'],
    ['Can I upgrade later?', 'Yes. Start with Free or the Founding Pilot, then choose Launch, Growth, or Scale based on the capacity you need.'],
    ['Do I keep my Store if my paid plan ends?', 'Yes. The Store and catalog are retained. Paid AI features change according to the commercial state and plan.'],
    ['How many Stores do I get?', 'One canonical Store per Merchant / Brand in the current model.'],
    ['Do I need a technical integration to start?', 'No for the hosted Store path. Start with a reviewed catalog and your existing product or inquiry destinations.'],
    ['Are Kiosk, Decision Result, and Merchant Actions separate usage meters?', 'No. They are continuation, commerce, and delivery capabilities rather than additional usage meters. Metered AI features and AI Commerce Session capacity still follow the selected plan.'],
  ] as const

  return (
    <section data-pricing-section="faq" className="bg-white">
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

      <section data-pricing-section="plans" className="bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Choose a plan</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Choose the capacity that fits your shopper volume.</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">Every paid plan includes the complete AI-assisted decision journey. Plans scale by shopper volume, catalog depth, active Campaigns, analytics, and delivery capabilities.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{primaryPlanCodes.map((code) => <PrimaryPlanCard key={code} locale={locale} planCode={code} />)}</div>
        </div>
      </section>

      <UsageSection />
      <MerchantExperienceCapabilities />
      <PilotSection locale={locale} />

      <section data-pricing-section="comparison" className="bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Compare plans</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">The same commercial model, side by side.</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">Compare capacity, the decision journey, commerce capabilities, and delivery or service options. The Founding Pilot remains a separate 30-day offer.</p>
          <ComparisonTable />
        </div>
      </section>

      <EnterpriseSection locale={locale} />
      <ProductProofSection locale={locale} />
      <FaqSection />
    </>
  )
}
