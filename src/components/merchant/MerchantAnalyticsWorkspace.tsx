import Link from 'next/link'
import { Activity, BarChart3, CheckCircle, Heart, MessageCircle, MousePointerClick, User } from 'lucide-react'
import type { MerchantCommerceIntelligence } from '@/modules/merchant/application/merchant-commerce-intelligence'
import { MERCHANT_DISTRIBUTION_SOURCE_LABELS } from '@/modules/store/domain/merchant-distribution-report'
import { merchantWorkspaceHref, type MerchantWorkspaceSection } from '@/modules/merchant/application/merchant-workspace-routes'
import { MerchantLivePulse } from './MerchantLivePulse'
import { MerchantDecisionJourneyChart, MerchantDecisionTrendChart, MerchantExperiencePerformanceChart, MerchantMetricSparkline, MerchantTopFramesInterest } from './MerchantCommerceCharts'

type MetricKey = 'visitors' | 'engagedShoppers' | 'highIntentShoppers' | 'productClicks'
type Metric = {
  key: MetricKey
  label: string
  value: number
  icon: typeof User
  trendKey?: 'visitors' | 'engagedShoppers' | 'highIntentShoppers'
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

function comparisonLabel(metric: MetricKey, insights: MerchantCommerceIntelligence) {
  if (insights.comparison.previous[metric] === 0) return 'No prior activity'
  if (!insights.comparison.reliable) return 'Low volume · comparison withheld'
  const delta = insights.comparison.deltas[metric]
  if (delta === null) return 'No prior activity'
  if (delta === 0) return 'No change'
  return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}%`
}

function periodSummary(insights: MerchantCommerceIntelligence, locale: string) {
  return `${dateLabel(insights.period.from, locale)} – ${dateLabel(insights.period.to, locale)} · UTC`
}

function SourceBars({ insights, locale }: { insights: MerchantCommerceIntelligence; locale: string }) {
  const report = insights.distributionReport
  const sourceRows = report
    ? report.sources.map((source) => ({ key: source.sourceClass, label: MERCHANT_DISTRIBUTION_SOURCE_LABELS[source.sourceClass], visitors: source.visitors }))
    : insights.acquisitionSources.map((source) => ({ key: source.source, label: source.source, visitors: source.visitors }))
  const topSources = [...sourceRows].sort((left, right) => right.visitors - left.visitors).slice(0, 4)
  const maxVisitors = Math.max(1, ...topSources.map((source) => source.visitors))

  return <div className="mt-4 border-t border-slate-100 pt-3">
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-slate-900">Top sources</h3>
      <span className="text-[10px] text-slate-400">Visitors</span>
    </div>
    {topSources.length === 0 ? <p className="py-2 text-xs text-slate-500">No source activity</p> : <ol className="space-y-2.5" aria-label="Top visitor sources">
      {topSources.map((source) => <li key={source.key} className="grid grid-cols-[minmax(0,1fr)_minmax(64px,0.8fr)_20px] items-center gap-2">
        <span className="truncate text-xs text-slate-700">{source.label}</span>
        <span role="progressbar" aria-label={`${source.label}: ${source.visitors} visitors`} aria-valuemin={0} aria-valuemax={maxVisitors} aria-valuenow={source.visitors} className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <span aria-hidden="true" className="block h-full rounded-full bg-blue-400" style={{ width: `${(source.visitors / maxVisitors) * 100}%` }} />
        </span>
        <span className="text-right text-xs font-semibold tabular-nums text-slate-800">{source.visitors.toLocaleString(locale)}</span>
      </li>)}
    </ol>}

    {report ? <details className="group mt-3 border-t border-slate-100 pt-2.5">
      <summary className="cursor-pointer list-none text-[11px] font-medium text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5">All source metrics<span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span></span>
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[390px] text-left text-[11px]">
          <thead><tr className="border-y border-slate-100 text-slate-500"><th className="py-2 pr-2 font-medium">Source</th><th className="px-2 py-2 text-right font-medium">Visitors</th><th className="px-2 py-2 text-right font-medium">Product clicks</th><th className="px-2 py-2 text-right font-medium">Inquiries</th><th className="pl-2 py-2 text-right font-medium">High intent</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{report.sources.map((source) => <tr key={source.sourceClass}>
            <th scope="row" className="py-2 pr-2 font-medium text-slate-700">{MERCHANT_DISTRIBUTION_SOURCE_LABELS[source.sourceClass]}</th>
            <td className="px-2 py-2 text-right tabular-nums">{source.visitors.toLocaleString(locale)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{source.productClicks.toLocaleString(locale)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{source.inquiries.toLocaleString(locale)}</td>
            <td className="pl-2 py-2 text-right tabular-nums">{source.highIntentShoppers.toLocaleString(locale)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-400">{report.consumerEventBoundary}</p>
    </details> : null}
  </div>
}

export function MerchantAnalyticsWorkspace({
  locale,
  merchantId,
  insights,
  rangeDays = 30,
}: {
  locale: string
  merchantId: string
  insights: MerchantCommerceIntelligence
  rangeDays?: 7 | 30 | 90
}) {
  const href = (section: MerchantWorkspaceSection) => merchantWorkspaceHref({ locale, section, merchantId })
  const metrics: Metric[] = [
    { key: 'visitors', label: 'Visitors', value: insights.totals.visitors, icon: User, trendKey: 'visitors' },
    { key: 'engagedShoppers', label: 'Engaged shoppers', value: insights.totals.engagedShoppers, icon: MessageCircle, trendKey: 'engagedShoppers' },
    { key: 'highIntentShoppers', label: 'High-intent shoppers', value: insights.totals.highIntentShoppers, icon: CheckCircle, trendKey: 'highIntentShoppers' },
    { key: 'productClicks', label: 'Product clicks', value: insights.totals.productClicks, icon: MousePointerClick },
  ]
  const comparisonPeriod = `${dateLabel(insights.comparison.previousPeriod.from, locale)} – ${dateLabel(insights.comparison.previousPeriod.to, locale)} UTC`
  const comparisonContext = insights.comparison.reliable
    ? `Compared with ${comparisonPeriod}`
    : 'Comparison withheld because volume is low'

  return <div data-testid="merchant-analytics-workspace" className="space-y-3.5 md:-mt-4 sm:space-y-4">
    <header className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Commerce intelligence</p>
        <h1 className="mt-0.5 text-[26px] font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-[30px]">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">How shoppers move from discovery to product intent.</p>
      </div>
      <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
        <form method="get" action={`/${locale}/merchant/analytics`} className="flex items-end gap-2">
          <input type="hidden" name="merchantId" value={merchantId} />
          <label htmlFor="merchant-analytics-range" className="min-w-0 flex-1 sm:min-w-[170px]">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date window</span>
            <select id="merchant-analytics-range" name="range" defaultValue={rangeDays} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>
          <button type="submit" className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Apply</button>
        </form>
        <p className="text-right text-[10px] tabular-nums text-slate-500" title={comparisonContext}>{periodSummary(insights, locale)}<span className="sr-only">. {comparisonContext}.</span></p>
      </div>
    </header>

    {!insights.hasActivity ? <section className="rounded-2xl border border-slate-100 bg-white px-5 py-10 text-center" aria-labelledby="analytics-empty-heading">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600"><BarChart3 className="h-5 w-5" aria-hidden="true" /></div>
      <h2 id="analytics-empty-heading" className="mt-4 text-lg font-semibold text-slate-950">No shopper activity yet</h2>
      <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-slate-600">Signals appear after shoppers interact with a published Store or Campaign. There is no trend to draw for this window.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-4">
        <Link href={href('store')} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Open Store<span aria-hidden="true">→</span></Link>
        <Link href={href('campaigns')} className="inline-flex min-h-10 items-center text-sm font-semibold text-slate-700 hover:text-slate-950">View Campaigns</Link>
      </div>
    </section> : <>
      <section aria-label="Shopper outcome metrics" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const delta = insights.comparison.deltas[metric.key]
          const isComparable = insights.comparison.reliable && delta !== null && insights.comparison.previous[metric.key] > 0
          const comparisonCopy = comparisonLabel(metric.key, insights)
          const deltaTone = !isComparable || delta === 0 ? 'text-slate-500' : delta! > 0 ? 'text-emerald-700' : 'text-rose-600'
          return <article key={metric.key} className="relative flex min-h-[102px] min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-slate-100/90 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.025)] sm:min-h-[110px] sm:gap-3.5 sm:px-4">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:h-10 sm:w-10"><Icon className="h-[17px] w-[17px]" /></span>
            <div className="relative z-10 min-w-0 pb-3 sm:pb-0">
              <h2 className="line-clamp-2 text-[11px] font-medium text-slate-600 sm:line-clamp-none sm:truncate sm:text-xs">{metric.label}</h2>
              <p className="mt-1 text-[25px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-slate-950 sm:text-[27px]">{metric.value.toLocaleString(locale)}</p>
              <p className={`mt-1.5 truncate text-[10px] font-semibold tabular-nums sm:text-[11px] ${deltaTone}`} aria-label={comparisonCopy === 'Low volume · comparison withheld' ? comparisonCopy : undefined}>
                {isComparable && delta !== 0 ? <span aria-hidden="true" className="mr-0.5">{delta! > 0 ? '↑' : '↓'}</span> : null}
                {comparisonCopy === 'Low volume · comparison withheld' ? 'Low volume' : comparisonCopy.replace(/^[↑↓]\s/u, '')}
              </p>
            </div>
            {metric.trendKey ? <div className="absolute bottom-2 right-2 hidden opacity-90 xl:block sm:bottom-1.5 sm:right-2">
              <MerchantMetricSparkline trend={insights.decisionTrend} dataKey={metric.trendKey} label={`${metric.label} trend`} />
            </div> : null}
          </article>
        })}
      </section>

      <section aria-label="Decision analysis" className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.95fr)]">
        <div className="min-w-0 rounded-2xl border border-slate-100 bg-white px-4 py-4 sm:px-5 sm:py-5" aria-labelledby="decision-trend-title">
          <div className="flex items-center justify-between gap-2">
            <h2 id="decision-trend-title" className="text-base font-semibold tracking-tight text-slate-950">Shopper Decision Trend</h2>
            <span className="shrink-0 text-[10px] font-medium text-slate-400">Daily</span>
          </div>
          <div className="mt-3">
            <MerchantDecisionTrendChart trend={insights.decisionTrend} previousTrend={insights.previousDecisionTrend ?? []} showComparison={insights.comparison.reliable} locale={locale} />
          </div>
        </div>

        <aside aria-labelledby="analytics-journey-heading" className="min-w-0 rounded-2xl border border-slate-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="analytics-journey-heading" className="text-base font-semibold tracking-tight text-slate-950">VisuTry Decision Path</h2>
            <span className="shrink-0 text-[10px] text-slate-400">Counts</span>
          </div>
          <MerchantDecisionJourneyChart stages={insights.decisionJourney} totals={insights.totals} locale={locale} />
        </aside>
      </section>

      <section aria-label="Shopper intelligence details" className="grid min-w-0 gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.9fr)_minmax(0,1fr)]">
        <MerchantTopFramesInterest frames={insights.topFrames} locale={locale} viewAllHref={href('catalog')} />
        <MerchantLivePulse merchantId={merchantId} variant="analytics" />

        <section data-testid="analytics-intent-sources" aria-label="Intent signals at a glance" aria-labelledby="intent-signals-heading" className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="intent-signals-heading" className="text-base font-semibold tracking-tight text-slate-950">Intent signals at a glance</h2>
            <Activity aria-hidden="true" className="h-4 w-4 text-blue-600" />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { label: 'Favorites', value: insights.totals.favorites, icon: Heart },
              { label: 'Product clicks', value: insights.totals.productClicks, icon: MousePointerClick },
              { label: 'Inquiries', value: insights.totals.inquiries, icon: MessageCircle },
            ].map((signal) => {
              const Icon = signal.icon
              return <div key={signal.label} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 px-1 py-2.5">
                <dt className="flex min-w-0 items-center gap-0.5 text-[9px] leading-4 text-slate-500"><Icon aria-hidden="true" className="h-3 w-3 shrink-0 text-blue-600" /><span className="truncate">{signal.label}</span></dt>
                <dd className="mt-1 text-base font-semibold tabular-nums tracking-tight text-slate-950">{signal.value.toLocaleString(locale)}</dd>
              </div>
            })}
          </dl>
          <p className="sr-only">Observed shopper actions only; no purchase or revenue attribution.</p>
          <SourceBars insights={insights} locale={locale} />
        </section>
      </section>

      <section aria-labelledby="analytics-experiences-heading" className="rounded-2xl border border-slate-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 id="analytics-experiences-heading" className="text-base font-semibold tracking-tight text-slate-950">Experience performance</h2>
            <p className="mt-0.5 text-xs text-slate-500">Store and Campaign</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={href('store')} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Open Store</Link>
            <Link href={href('campaigns')} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Campaigns</Link>
          </div>
        </div>
        <MerchantExperiencePerformanceChart experiences={insights.experiences} performance={insights.experiencePerformance} locale={locale} />
        {insights.interpretation.summary ? <details className="group mt-3 border-t border-slate-100 pt-2.5">
          <summary className="cursor-pointer list-none text-xs font-medium text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">Read decision insight<span aria-hidden="true" className="ml-1.5 inline-block transition-transform group-open:rotate-180">⌄</span></summary>
          <p className="mt-2 text-xs leading-5 text-slate-600">{insights.interpretation.summary}</p>
        </details> : null}
      </section>
    </>}
  </div>
}
