import { ANALYTICS_DEFAULT_RANGE_DAYS } from '@/modules/store/application/merchant-analytics-compute'
import type { MerchantAnalyticsMetrics } from '@/modules/store/domain/merchant-analytics'
import type { MerchantInsightsDto } from '@/modules/store/application/get-merchant-insights'
import type { MerchantAnalyticsPeriodDto } from '@/modules/store/application/merchant-analytics-compute'

export function formatC1Percent(value: number | null): string {
  return value == null ? '—' : `${Math.round(value * 100)}%`
}

export function formatC1PeriodCaption(period: MerchantAnalyticsPeriodDto): string {
  const from = new Date(period.from)
  const toInclusive = new Date(new Date(period.to).getTime() - 1)
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return `Last ${ANALYTICS_DEFAULT_RANGE_DAYS} days · ${period.timezone} · ${fmt.format(from)} – ${fmt.format(toInclusive)}`
}

export type AdminPerformanceCard = {
  key: 'visits' | 'engagement' | 'tryOnCompletion' | 'highIntent'
  label: string
  value: string
  hint: string
}

export function adminPerformanceCards(metrics: MerchantAnalyticsMetrics): AdminPerformanceCard[] {
  return [
    { key: 'visits', label: 'Visits', value: String(metrics.visits), hint: 'Distinct shopper sessions' },
    { key: 'engagement', label: 'Engagement rate', value: formatC1Percent(metrics.engagementRate), hint: `${metrics.engagedSessions} engaged sessions` },
    { key: 'tryOnCompletion', label: 'Try-On completion rate', value: formatC1Percent(metrics.tryOnCompletionRate), hint: 'Completions ÷ starts' },
    { key: 'highIntent', label: 'High intent rate', value: formatC1Percent(metrics.highIntentRate), hint: `${metrics.highIntentSessions} high-intent sessions` },
  ]
}

export type AdminActivitySignal = {
  label: string
  value: number
}

export function adminActivitySignals(metrics: MerchantInsightsDto['metrics']): AdminActivitySignal[] {
  return [
    { label: 'Sessions', value: metrics.sessions },
    { label: 'Recommendation', value: metrics.recommendations },
    { label: 'Try-On', value: metrics.tryOns },
    { label: 'Compare', value: metrics.compareStarts },
    { label: 'Favorite', value: metrics.favorites },
    { label: 'Product Click', value: metrics.productClicks },
    { label: 'Inquiry', value: metrics.inquiries },
  ]
}
