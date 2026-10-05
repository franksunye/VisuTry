'use client'

import Image from 'next/image'
import Link from 'next/link'
import { merchantCampaignHref, merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'
import { Area, AreaChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { MerchantDecisionTrendBucket } from '@/modules/merchant/application/merchant-commerce-intelligence'
import type { MerchantExperiencePerformance } from '@/modules/merchant/domain/merchant-control-insights'
import type { MerchantAnalyticsFunnelStage, MerchantAnalyticsTopFrame } from '@/modules/store/application/merchant-analytics-compute'

const SERIES = [
  { key: 'visitors', label: 'Visitors', color: '#246bfe' },
  { key: 'engagedShoppers', label: 'Engaged', color: '#78a8ff' },
  { key: 'highIntentShoppers', label: 'High intent', color: '#26bea5' },
] as const

function number(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value)
}

function dayLabel(value: string, locale: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const date = new Date(`${value}T12:00:00.000Z`)
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date)
}

export function merchantDecisionTrendAxisTicks(maxValue: number): number[] {
  const maximum = Math.max(1, maxValue)
  return [...new Set([0, Math.round(maximum / 3), Math.round((maximum * 2) / 3), maximum])]
}

const TREND_CONFIG: ChartConfig = {
  visitors: { label: 'Visitors', color: '#246bfe' },
  engagedShoppers: { label: 'Engaged', color: '#78a8ff' },
  highIntentShoppers: { label: 'High intent', color: '#26bea5' },
  highIntentArea: { label: 'High intent', color: '#26bea5' },
  previousVisitors: { label: 'Previous · Visitors', color: '#64748b' },
}

export function MerchantDecisionTrendChart({
  trend,
  previousTrend = [],
  showComparison = false,
  locale,
}: {
  trend: MerchantDecisionTrendBucket[]
  previousTrend?: MerchantDecisionTrendBucket[]
  showComparison?: boolean
  locale: string
}) {
  if (trend.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">Daily session dates are not available for this window, so no trend is drawn.</p>
  }

  const comparisonEnabled = showComparison && previousTrend.length > 0
  const chartData = trend.map((bucket, index) => ({
    ...bucket,
    highIntentArea: bucket.highIntentShoppers,
    previousVisitors: comparisonEnabled ? previousTrend[index]?.visitors ?? null : null,
  }))
  const maxValue = Math.max(2, Math.ceil(Math.max(...chartData.flatMap((bucket) => [
    ...SERIES.map((series) => bucket[series.key]),
    ...(comparisonEnabled && bucket.previousVisitors !== null ? [bucket.previousVisitors] : []),
  ])) * 1.12))
  const gridValues = merchantDecisionTrendAxisTicks(maxValue)
  const tickCount = Math.min(7, trend.length)
  const xTicks = tickCount <= 1
    ? trend.map((bucket) => bucket.date)
    : Array.from({ length: tickCount }, (_, index) => trend[Math.round(index * (trend.length - 1) / (tickCount - 1))].date)

  return <figure data-testid="merchant-decision-trend-chart" aria-labelledby="decision-trend-title" aria-describedby="decision-trend-description" className="min-w-0">
    <figcaption id="decision-trend-description" className="sr-only">Daily counts are grouped by the UTC day a shopper session began. Each line shows canonical session counts for Visitors, Engaged shoppers, or High-intent shoppers.{comparisonEnabled ? ' A dashed line shows previous-period visitors because this comparison meets the reliability threshold.' : ''}</figcaption>
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-2" aria-label="Chart legend">
      {SERIES.map((series) => <span key={series.key} className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-600">
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />{series.label}
      </span>)}
      {comparisonEnabled ? <span className="inline-flex items-center gap-2 text-[10px] font-medium text-slate-400"><span aria-hidden="true" className="w-4 border-t border-dashed border-slate-400" />Previous</span> : null}
    </div>
    <ChartContainer
      config={TREND_CONFIG}
      className="h-[224px] sm:h-[226px]"
    >
      <LineChart data={chartData} accessibilityLayer margin={{ top: 10, right: 8, bottom: 2, left: -18 }}>
        <CartesianGrid vertical={false} stroke="#e9eff7" strokeDasharray="3 6" />
        <XAxis
          dataKey="date"
          ticks={xTicks}
          tickFormatter={(value: string) => dayLabel(value, locale)}
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickMargin={9}
          minTickGap={8}
        />
        <YAxis
          domain={[0, maxValue]}
          ticks={gridValues}
          tickFormatter={(value: number) => number(value, locale)}
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
          wrapperStyle={{ zIndex: 30, outline: 'none' }}
          content={(props) => <ChartTooltipContent
          active={props.active}
          label={props.label}
            payload={props.payload?.filter((item) => item.dataKey !== 'highIntentArea')}
            config={TREND_CONFIG}
            locale={locale}
            labelFormatter={(value) => typeof value === 'string' ? dayLabel(value, locale, { dateStyle: 'medium' }) : String(value ?? '')}
          />}
        />
        <Area
          type="monotone"
          dataKey="highIntentArea"
          name="High intent"
          stroke="none"
          fill="var(--color-highIntentShoppers)"
          fillOpacity={0.1}
          isAnimationActive={false}
          tooltipType="none"
        />
        {comparisonEnabled ? <Line
          type="monotone"
          dataKey="previousVisitors"
          name="Previous · Visitors"
          stroke="var(--color-previousVisitors)"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          strokeOpacity={0.48}
          strokeLinecap="round"
          dot={false}
          activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5 }}
          connectNulls={false}
          isAnimationActive={false}
        /> : null}
        {SERIES.map((series) => <Line
          key={series.key}
          type="monotone"
          dataKey={series.key}
          name={series.label}
          stroke={`var(--color-${series.key})`}
          strokeWidth={series.key === 'visitors' ? 2.7 : 2.3}
          strokeLinecap="round"
          dot={false}
          activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
          isAnimationActive={false}
        />)}
      </LineChart>
    </ChartContainer>
    <div className="sr-only">
      <table className="w-px table-fixed">
        <caption>Daily shopper decision counts, grouped by session start date in UTC</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">Visitors</th><th scope="col">Engaged shoppers</th><th scope="col">High-intent shoppers</th>{comparisonEnabled ? <th scope="col">Previous period visitors</th> : null}</tr></thead>
        <tbody>{trend.map((bucket, index) => <tr key={bucket.date}><th scope="row">{dayLabel(bucket.date, locale, { dateStyle: 'full' })}</th><td>{bucket.visitors}</td><td>{bucket.engagedShoppers}</td><td>{bucket.highIntentShoppers}</td>{comparisonEnabled ? <td>{previousTrend[index]?.visitors ?? '—'}</td> : null}</tr>)}</tbody>
      </table>
    </div>
  </figure>
}

export function MerchantDecisionJourneyChart({ stages, totals, locale }: {
  stages: MerchantAnalyticsFunnelStage[]
  totals: { visitors: number; engagedShoppers: number; recommendationActivity: number; tryOnCompletions: number; compareActivity: number; highIntentShoppers: number; favorites: number; productClicks: number; inquiries: number }
  locale: string
}) {
  const stageValue = (stageName: MerchantAnalyticsFunnelStage['stage']) => stages.find((stage) => stage.stage === stageName && stage.available)?.sessions ?? 0
  const visits = Math.max(0, stageValue('VISIT') || totals.visitors)
  const started = stageValue('TRY_ON_STARTED')
  const completed = stageValue('TRY_ON_COMPLETED')
  const intentSessions = stageValue('HIGH_INTENT') || totals.highIntentShoppers
  const share = (value: number) => visits > 0 ? `${Math.round((value / visits) * 100)}% of visits` : 'No visits in this window'
  const stagesForDisplay = [
    { id: 'visit', label: 'Visit', value: visits, unit: 'sessions', detail: `${share(visits)} · ${number(totals.engagedShoppers, locale)} engaged` },
    { id: 'recommendation', label: 'Recommendation', value: totals.recommendationActivity, unit: 'events', detail: 'Completed recommendation events' },
    { id: 'try-on', label: 'Try-On', value: completed, unit: 'sessions', detail: `${share(completed)} · ${number(started, locale)} started` },
    { id: 'compare', label: 'Compare', value: totals.compareActivity, unit: 'events', detail: 'Frame compare events' },
    { id: 'high-intent', label: 'High intent', value: intentSessions, unit: 'sessions', detail: share(intentSessions) },
  ]
  const maxValue = Math.max(1, ...stagesForDisplay.map((stage) => stage.value))
  const colors = ['#2875ff', '#8bb6ff', '#35c3a5', '#82a4df', '#a884ff']

  return <div className="mt-4">
    <ol className="space-y-[17px]" aria-label="VisuTry shopper decision path">
      {stagesForDisplay.map((stage, index) => <li key={stage.id} className="grid grid-cols-[minmax(86px,0.8fr)_minmax(0,1.35fr)_30px] items-center gap-2.5">
        <span className="truncate text-xs font-medium text-slate-700" title={stage.detail}>{stage.label}<span className="sr-only">, {stage.detail}</span></span>
        <span
          role="progressbar"
          aria-label={`${stage.label}: ${number(stage.value, locale)} ${stage.unit}; relative count, not conversion`}
          aria-valuemin={0}
          aria-valuemax={maxValue}
          aria-valuenow={stage.value}
          className="h-2 overflow-hidden rounded-full bg-slate-100"
        >
          <span aria-hidden="true" className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, (stage.value / maxValue) * 100)}%`, backgroundColor: colors[index] }} />
        </span>
        <span className="text-right text-sm font-semibold tabular-nums tracking-tight text-slate-900">{number(stage.value, locale)}</span>
      </li>)}
    </ol>
    <p className="mt-4 text-[10px] text-slate-400">Relative count · sessions and event totals</p>
    <p className="sr-only">The progress bars show relative counts, not conversion. Recommendation and Compare are event totals. Merchant Actions are unavailable and omitted.</p>
  </div>
}

function statusLabel(status: string) {
  if (status === 'ACTIVE') return 'Live'
  if (status === 'DRAFT') return 'Draft · private'
  if (status === 'ARCHIVED') return 'Archived'
  return status.toLowerCase().replace(/_/gu, ' ')
}

export function MerchantExperiencePerformanceChart({
  experiences,
  performance,
  locale,
  merchantId,
}: {
  experiences: Array<{
    id: string
    type: 'STORE' | 'CAMPAIGN'
    name: string
    status: string
    referenceData: boolean
    visitors: number
    productClicks: number
    highIntentShoppers: number
  }>
  performance: MerchantExperiencePerformance
  locale: string
  merchantId: string
}) {
  const maxVisitors = Math.max(1, ...experiences.map((experience) => experience.visitors))
  const referenceIncluded = experiences.some((experience) => experience.referenceData)
  const topMetricLabel = performance.topMetric === 'highIntentShoppers'
    ? 'High intent'
    : performance.topMetric === 'productClicks'
      ? 'Product clicks'
      : null
  return <div className="mt-1">
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-slate-100 py-2">
      <p className="text-[10px] font-medium text-slate-500">{experiences.length} {experiences.length === 1 ? 'experience' : 'experiences'}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
        <span>{performance.reliable ? 'Reliable comparison' : 'Low volume'}</span>
        {referenceIncluded ? <span title="Reference data is not customer activity" className="inline-flex items-center gap-1"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-400" />Reference data<span className="sr-only"> is not customer activity</span></span> : null}
      </div>
    </div>
    {experiences.length === 0 ? <p className="py-5 text-sm text-slate-500">No Store or Campaign context is available in this window.</p> : <>
      <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(170px,1fr)_minmax(90px,0.55fr)_minmax(105px,0.65fr)] gap-4 border-b border-slate-100 py-2 text-[10px] font-medium text-slate-400 md:grid">
        <span>Experience</span>
        <span className="flex items-center justify-between"><span>Visitors</span><span className="text-[9px] font-normal text-slate-400">relative</span></span>
        <span className="text-right">High intent</span>
        <span className="text-right">Product clicks</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {experiences.map((experience) => (
          <li key={experience.id} className="relative grid gap-2.5 py-3.5 md:grid-cols-[minmax(0,1.3fr)_minmax(170px,1fr)_minmax(90px,0.55fr)_minmax(105px,0.65fr)] md:items-center md:gap-4 md:py-3">
            {performance.reliable && performance.topExperienceId === experience.id && topMetricLabel ? <span aria-hidden="true" className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-blue-600" /> : null}
            <div className="flex min-w-0 items-center justify-between gap-3 pl-2 md:pl-0">
              <div className="min-w-0">
                {experience.type === 'CAMPAIGN'
                  ? <Link
                      href={merchantCampaignHref({ locale, merchantId, campaignId: experience.id })}
                      aria-label={`Open ${experience.name}`}
                      className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-sm text-left text-sm font-semibold tracking-tight text-slate-950 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    ><span className="truncate">{experience.name}</span><span aria-hidden="true" className="shrink-0 text-blue-600">→</span></Link>
                  : <p className="truncate text-sm font-semibold tracking-tight text-slate-950">{experience.name}</p>}
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] leading-4 text-slate-500">
                  <span>{experience.type === 'CAMPAIGN' ? 'Campaign' : 'Store'}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>{statusLabel(experience.status)}</span>
                  {experience.referenceData ? <span title="Reference data is not customer activity" className="rounded bg-slate-50 px-1.5 text-slate-500">Reference<span className="sr-only"> data, not customer activity</span></span> : null}
                  {performance.reliable && performance.topExperienceId === experience.id && topMetricLabel ? <span className="inline-flex items-center gap-1 font-medium text-blue-700"><span aria-hidden="true" className="h-1 w-1 rounded-full bg-blue-600" />{topMetricLabel} lead</span> : null}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 items-end gap-3 pl-2 md:contents">
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-500 md:hidden">Visitors</span>
                <span className="mt-0.5 block text-sm font-semibold tabular-nums tracking-tight text-slate-950 md:mt-0">{number(experience.visitors, locale)}</span>
                <span role="img" aria-label={`${number(experience.visitors, locale)} of ${number(maxVisitors, locale)} visitors on the relative count scale`} className="mt-1.5 block h-1.5 min-w-0 overflow-hidden rounded-full bg-slate-100 md:h-2">
                  <span aria-hidden="true" className="block h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, (experience.visitors / maxVisitors) * 100)}%` }} />
                </span>
              </div>
              <p className="min-w-0 text-right md:py-0.5"><span className="block text-[10px] text-slate-500 md:hidden">High intent</span><span className={`mt-0.5 block text-sm font-semibold tabular-nums tracking-tight ${performance.reliable && performance.topExperienceId === experience.id && performance.topMetric === 'highIntentShoppers' ? 'text-blue-700' : 'text-slate-800'} md:mt-0`}>{number(experience.highIntentShoppers, locale)}</span></p>
              <p className="min-w-0 text-right md:py-0.5"><span className="block text-[10px] text-slate-500 md:hidden">Product clicks</span><span className={`mt-0.5 block text-sm font-semibold tabular-nums tracking-tight ${performance.reliable && performance.topExperienceId === experience.id && performance.topMetric === 'productClicks' ? 'text-blue-700' : 'text-slate-800'} md:mt-0`}>{number(experience.productClicks, locale)}</span></p>
            </div>
          </li>
        ))}
      </ul>
    </>}
  </div>
}

export function MerchantTopFramesInterest({ frames, locale, merchantId, viewAllHref }: { frames: MerchantAnalyticsTopFrame[]; locale: string; merchantId?: string; viewAllHref?: string }) {
  return <section data-testid="analytics-top-frames" aria-labelledby="top-frames-interest-heading" className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 id="top-frames-interest-heading" className="text-base font-semibold tracking-tight text-slate-950">Top frames driving interest</h2>
      {viewAllHref ? <Link href={viewAllHref} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">View all frames<span aria-hidden="true">→</span></Link> : null}
    </div>
    {frames.length === 0 ? <p className="py-3 text-sm text-slate-500">No frame-specific Try-On, Favorite, or Compare signals in this window.</p> : <ol className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {frames.slice(0, 3).map((frame) => {
        const signals = [
          frame.tryOnCount > 0 ? { label: 'Try-Ons', value: frame.tryOnCount } : null,
          frame.favoriteCount > 0 ? { label: 'Favorites', value: frame.favoriteCount } : null,
          frame.compareCount > 0 ? { label: 'Compare', value: frame.compareCount } : null,
          frame.highIntentInteractions > 0 ? { label: 'High intent', value: frame.highIntentInteractions } : null,
        ].filter((signal): signal is { label: string; value: number } => signal !== null)
          .sort((left, right) => right.value - left.value)
          .slice(0, 2)
        const displayName = frame.name.split(' · ')[0]
        return <li key={frame.frameId} className="min-w-[150px] snap-start overflow-hidden rounded-xl border border-slate-100 bg-white sm:min-w-0">
          <div className="relative h-[92px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 sm:h-[100px]" aria-hidden="true">
            {frame.imageUrl ? <Image src={frame.imageUrl} alt="" fill sizes="(min-width: 1280px) 170px, 150px" unoptimized className="object-contain p-2" /> : <span className="flex h-full items-center justify-center text-[10px] text-slate-400">Frame</span>}
          </div>
          <div className="px-2.5 pb-2.5 pt-2">
            <h3 aria-label={frame.name} title={frame.name} className="truncate text-sm font-semibold text-slate-900">{merchantId
              ? <Link href={merchantWorkspaceHref({ locale, section: 'catalog', merchantId, frameId: frame.frameId })} aria-label={`Open ${frame.name} in Catalog`} className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-sm hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="truncate">{displayName}</span><span aria-hidden="true" className="shrink-0 text-blue-600">→</span></Link>
              : displayName}</h3>
            {frame.sku ? <p className="sr-only">SKU {frame.sku}</p> : null}
            <ul aria-label={`${frame.name} observed signals`} className="mt-2 grid grid-cols-2 gap-x-2">
              {signals.map((signal) => <li key={signal.label} className="min-w-0">
                <span className="block text-xs font-semibold tabular-nums text-slate-800">{number(signal.value, locale)}</span>
                <span className="mt-0.5 block truncate text-[9px] leading-3 text-slate-500" title={signal.label}>{signal.label}</span>
              </li>)}
              {signals.length === 0 ? <li className="col-span-2 text-[10px] text-slate-500">No observed signals</li> : null}
            </ul>
          </div>
        </li>
      })}
    </ol>}
    <p className="mt-2 text-[10px] text-slate-400">Observed behavior, not sales ranking.</p>
  </section>
}

export function MerchantMetricSparkline({ trend, dataKey, label }: {
  trend: MerchantDecisionTrendBucket[]
  dataKey: 'visitors' | 'engagedShoppers' | 'highIntentShoppers'
  label: string
}) {
  const recent = trend.slice(-7)
  if (recent.length < 2 || recent.every((bucket) => bucket[dataKey] === 0)) return null
  const config: ChartConfig = { value: { label, color: '#377cff' } }
  const data = recent.map((bucket) => ({ date: bucket.date, value: bucket[dataKey] }))
  const accessibleSummary = data.map((bucket) => `${dayLabel(bucket.date, 'en', { dateStyle: 'medium' })}: ${bucket.value}`).join('; ')
  return <figure aria-label={`${label} daily trend, most recent 7 days. ${accessibleSummary}`} className="hidden shrink-0 sm:block">
    <ChartContainer config={config} className="h-9 w-[74px] md:w-[104px]">
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 1, left: 0 }}>
        <Area type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={1.8} fill="var(--color-value)" fillOpacity={0.09} dot={false} activeDot={false} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  </figure>
}

export function MerchantMiniTrend({ trend, label = 'Visitors over the last 7 days' }: { trend: MerchantDecisionTrendBucket[]; label?: string }) {
  const recent = trend.slice(-7)
  if (recent.length < 2 || recent.every((bucket) => bucket.visitors === 0)) return null
  const config: ChartConfig = { visitors: { label: 'Visitors', color: '#2563eb' } }
  const accessibleSummary = recent.map((bucket) => `${dayLabel(bucket.date, 'en', { dateStyle: 'medium' })}: ${bucket.visitors}`).join('; ')
  return <figure className="min-w-[150px]" aria-label={`${label}. ${accessibleSummary}`}>
    <figcaption className="text-[11px] font-medium text-slate-500">{label}</figcaption>
    <ChartContainer config={config} className="mt-1 h-9 w-full max-w-[190px]">
      <LineChart data={recent} accessibilityLayer margin={{ top: 3, right: 2, bottom: 3, left: 2 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={[0, 'dataMax + 1']} />
        <Tooltip
          cursor={false}
          wrapperStyle={{ zIndex: 30, outline: 'none' }}
          content={(props) => <ChartTooltipContent
            active={props.active}
            label={props.label}
            payload={props.payload}
            config={config}
            labelFormatter={(value) => typeof value === 'string' ? dayLabel(value, 'en', { dateStyle: 'medium' }) : String(value ?? '')}
          />}
        />
        <Line dataKey="visitors" name="Visitors" type="monotone" stroke="var(--color-visitors)" strokeWidth={2.25} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5 }} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
    <span className="sr-only">{accessibleSummary}</span>
  </figure>
}
