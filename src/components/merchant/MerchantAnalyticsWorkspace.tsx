import Link from 'next/link'
import { ArrowRight, BarChart3 } from 'lucide-react'
import type { MerchantCommerceIntelligence } from '@/modules/merchant/application/merchant-commerce-intelligence'
import { MERCHANT_DISTRIBUTION_SOURCE_LABELS } from '@/modules/store/domain/merchant-distribution-report'
import { merchantWorkspaceHref, type MerchantWorkspaceSection } from '@/modules/merchant/application/merchant-workspace-routes'

type Metric = {
  key: 'visitors' | 'engagedShoppers' | 'highIntentShoppers' | 'productClicks'
  label: string
  value: number
  detail: string
}

function dateLabel(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
  }
}

function comparisonLabel(metric: Metric['key'], insights: MerchantCommerceIntelligence) {
  if (insights.comparison.previous[metric] === 0) return 'No prior activity'
  if (!insights.comparison.reliable) return 'Not enough activity for a reliable comparison'
  const delta = insights.comparison.deltas[metric]
  if (delta === null) return 'No prior activity'
  if (delta === 0) return 'No change vs previous period'
  return `${delta > 0 ? '+' : ''}${delta}% vs previous period`
}

function experienceStatus(status: string) {
  if (status === 'ACTIVE') return 'Live'
  if (status === 'DRAFT') return 'Draft · private'
  if (status === 'ARCHIVED') return 'Archived'
  return status.toLowerCase().replace(/_/gu, ' ')
}

function experienceMetricLabel(metric: MerchantCommerceIntelligence['experiencePerformance']['topMetric']) {
  if (metric === 'highIntentShoppers') return 'high-intent shoppers'
  if (metric === 'productClicks') return 'product clicks'
  if (metric === 'tryOnCompletions') return 'Try-On completions'
  if (metric === 'engagedShoppers') return 'engaged shoppers'
  return 'shopper activity'
}

export function MerchantAnalyticsWorkspace({
  locale,
  merchantId,
  insights,
}: {
  locale: string
  merchantId: string
  insights: MerchantCommerceIntelligence
}) {
  const href = (section: MerchantWorkspaceSection) => merchantWorkspaceHref({ locale, section, merchantId })
  const period = `${dateLabel(insights.period.from, locale)} – ${dateLabel(insights.period.to, locale)} · UTC`
  const metrics: Metric[] = [
    { key: 'visitors', label: 'Visitors', value: insights.totals.visitors, detail: 'shopper sessions' },
    { key: 'engagedShoppers', label: 'Engaged shoppers', value: insights.totals.engagedShoppers, detail: `${insights.rates.engagement == null ? '—' : `${insights.rates.engagement}%`} engagement rate` },
    { key: 'highIntentShoppers', label: 'High-intent shoppers', value: insights.totals.highIntentShoppers, detail: 'aggregate behavioral signal' },
    { key: 'productClicks', label: 'Product clicks', value: insights.totals.productClicks, detail: 'merchant destination intent' },
  ]

  return <div data-testid="merchant-analytics-workspace" className="space-y-5">
    <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Merchant workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Analytics</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">Shopper decision signals across your Store and Campaigns.</p>
      </div>
      <p className="flex items-center gap-2 text-xs font-medium text-slate-600"><BarChart3 className="h-4 w-4 text-slate-500" aria-hidden="true" /><span>Data window · {period}</span></p>
    </header>

    {!insights.hasActivity ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-9 text-center" aria-labelledby="analytics-empty-heading">
      <h2 id="analytics-empty-heading" className="text-base font-semibold text-slate-950">No shopper activity yet</h2>
      <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-slate-600">Signals will appear here after shoppers interact with a published Store or Campaign.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href={href('store')} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Open Store <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <Link href={href('campaigns')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">View Campaigns</Link>
      </div>
    </section> : <>
      <section aria-labelledby="analytics-outcomes-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div><h2 id="analytics-outcomes-heading" className="text-sm font-semibold text-slate-950">Shopper activity</h2><p className="mt-0.5 text-xs text-slate-500">Compared with the previous equivalent window.</p></div>
          <p className="text-xs text-slate-500">{dateLabel(insights.comparison.previousPeriod.from, locale)} – {dateLabel(insights.comparison.previousPeriod.to, locale)} · UTC</p>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metrics.map((metric) => <article key={metric.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-600">{metric.label}</h3>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-950">{metric.value.toLocaleString(locale)}</p>
            <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
            <p className="mt-2 text-xs font-medium text-slate-600">{comparisonLabel(metric.key, insights)}</p>
          </article>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-slate-100/80 px-4 py-3 text-sm">
          <span><span className="text-slate-500">Recommendation</span> <strong className="ml-1 tabular-nums text-slate-900">{insights.totals.recommendationActivity.toLocaleString(locale)}</strong></span>
          <span><span className="text-slate-500">Try-On completions</span> <strong className="ml-1 tabular-nums text-slate-900">{insights.totals.tryOnCompletions.toLocaleString(locale)}</strong></span>
          <span><span className="text-slate-500">Compare actions</span> <strong className="ml-1 tabular-nums text-slate-900">{insights.totals.compareActivity.toLocaleString(locale)}</strong></span>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-sm font-semibold text-slate-950">What the signals show</h2><p className="mt-1 text-sm leading-6 text-slate-600">{insights.interpretation.summary}</p></div>
          </div>
          <p className="mt-3 text-xs text-slate-500">{insights.experiencePerformance.reliable ? 'Experience comparison is reliable for this window.' : 'There is not enough activity for a reliable Experience comparison.'}</p>
          {insights.experiencePerformance.reliable && insights.experiencePerformance.topExperienceId ? <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{insights.experiences.find((item) => item.id === insights.experiencePerformance.topExperienceId)?.name ?? 'An Experience'} led on {experienceMetricLabel(insights.experiencePerformance.topMetric)}.</p> : null}
          {insights.interpretation.evidence.length > 1 ? <ul className="mt-3 space-y-1.5 text-sm leading-5 text-slate-600">{insights.interpretation.evidence.slice(1).map((item) => <li key={item}>· {item}</li>)}</ul> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="analytics-experiences-heading">
          <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id="analytics-experiences-heading" className="text-sm font-semibold text-slate-950">Store and Campaign experiences</h2><p className="mt-0.5 text-xs text-slate-500">Signals stay scoped to the experience where the session began.</p></div><div className="flex gap-3"><Link href={href('store')} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Open Store</Link><Link href={href('campaigns')} className="text-xs font-semibold text-blue-700 hover:text-blue-900">View Campaigns</Link></div></div>
          {insights.experiences.length === 0 ? <p className="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-600">No Store or Campaign context is available in this window.</p> : <ul className="mt-4 divide-y divide-slate-100">
            {insights.experiences.map((experience) => <li key={experience.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${experience.type === 'CAMPAIGN' ? 'bg-violet-50 text-violet-800' : 'bg-blue-50 text-blue-800'}`}>{experience.type === 'CAMPAIGN' ? 'Campaign' : 'Store'}</span><span className="text-xs text-slate-600">{experienceStatus(experience.status)}</span>{experience.referenceData ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Reference / simulation data</span> : null}</div>
              <h3 className="mt-2 text-sm font-semibold text-slate-950">{experience.name}</h3>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                <div><dt className="text-slate-500">Visitors</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{experience.visitors.toLocaleString(locale)}</dd></div>
                <div><dt className="text-slate-500">Engaged</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{experience.engagedShoppers.toLocaleString(locale)}</dd></div>
                <div><dt className="text-slate-500">Product clicks</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{experience.productClicks.toLocaleString(locale)}</dd></div>
                <div><dt className="text-slate-500">High-intent</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{experience.highIntentShoppers.toLocaleString(locale)}</dd></div>
              </dl>
            </li>)}
          </ul>}
        </article>
      </section>

      {insights.distributionReport ? <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="analytics-sources-heading">
        <div><h2 id="analytics-sources-heading" className="text-sm font-semibold text-slate-950">Sources and downstream intent</h2><p className="mt-1 text-xs leading-5 text-slate-500">First-touch source classes and observed product-click or inquiry signals. These are behavioral intent signals, not transaction records.</p></div>
        {insights.distributionReport.sources.length === 0 ? <p className="mt-3 rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-600">No source-class activity in this window.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 pr-3 font-medium">Source</th><th className="px-3 py-2 text-right font-medium">Visitors</th><th className="px-3 py-2 text-right font-medium">Product clicks</th><th className="px-3 py-2 text-right font-medium">Inquiries</th><th className="pl-3 py-2 text-right font-medium">High-intent</th></tr></thead><tbody className="divide-y divide-slate-100">{insights.distributionReport.sources.map((source) => <tr key={source.sourceClass}><th scope="row" className="py-2.5 pr-3 font-medium text-slate-800">{MERCHANT_DISTRIBUTION_SOURCE_LABELS[source.sourceClass]}</th><td className="px-3 py-2.5 text-right tabular-nums">{source.visitors.toLocaleString(locale)}</td><td className="px-3 py-2.5 text-right tabular-nums">{source.productClicks.toLocaleString(locale)}</td><td className="px-3 py-2.5 text-right tabular-nums">{source.inquiries.toLocaleString(locale)}</td><td className="pl-3 py-2.5 text-right tabular-nums">{source.highIntentShoppers.toLocaleString(locale)}</td></tr>)}</tbody></table></div>}
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">{insights.distributionReport.consumerEventBoundary}</p>
      </section> : <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-sm font-semibold text-slate-950">Acquisition sources</h2><ul className="mt-3 divide-y divide-slate-100">{insights.acquisitionSources.map((source) => <li key={source.source} className="flex justify-between gap-3 py-2 text-sm"><span>{source.source}</span><span className="tabular-nums">{source.visitors}</span></li>)}</ul></section>}
    </>}
  </div>
}
