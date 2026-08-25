export const MERCHANT_COMMERCE_METRICS = [
  'visitors',
  'engagedShoppers',
  'recommendationActivity',
  'tryOnCompletions',
  'compareActivity',
  'productClicks',
  'highIntentShoppers',
] as const

export type MerchantCommerceMetric = (typeof MERCHANT_COMMERCE_METRICS)[number]
export type MerchantCommerceMetricValues = Record<MerchantCommerceMetric, number>

export type MerchantCommerceComparison = {
  previousPeriod: { from: string; to: string; timezone: 'UTC' }
  previous: MerchantCommerceMetricValues
  deltas: Record<MerchantCommerceMetric, number | null>
  reliable: boolean
}

export type MerchantExperiencePerformanceInput = {
  id: string
  name: string
  type: 'STORE' | 'CAMPAIGN'
  visitors: number
  engagedShoppers: number
  tryOnCompletions: number
  productClicks: number
  highIntentShoppers: number
}

export type MerchantExperiencePerformance = {
  reliable: boolean
  ranked: MerchantExperiencePerformanceInput[]
  topExperienceId: string | null
  topMetric: 'highIntentShoppers' | 'productClicks' | 'tryOnCompletions' | 'engagedShoppers' | null
  needsAttentionExperienceId: string | null
}

export type MerchantSourcePerformanceInput = {
  source: string
  visitors: number
  productClicks: number
  inquiries: number
  highIntentShoppers: number
}

export type MerchantSourceHighlights = {
  topVisitors: string | null
  topDownstreamIntent: string | null
  topHighIntent: string | null
  reliable: boolean
}

export type MerchantCommerceInterpretation = {
  summary: string
  evidence: string[]
  nextAction: string
}

export const MIN_RELIABLE_COMPARISON_VISITORS = 2

export function calculateMerchantPercentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

export function buildMerchantCommerceComparison(input: {
  current: MerchantCommerceMetricValues
  previous: MerchantCommerceMetricValues
  previousPeriod: { from: string; to: string; timezone: 'UTC' }
}): MerchantCommerceComparison {
  const deltas = Object.fromEntries(MERCHANT_COMMERCE_METRICS.map((metric) => [metric, calculateMerchantPercentDelta(input.current[metric], input.previous[metric])])) as Record<MerchantCommerceMetric, number | null>
  return {
    previousPeriod: input.previousPeriod,
    previous: input.previous,
    deltas,
    reliable: input.current.visitors >= MIN_RELIABLE_COMPARISON_VISITORS && input.previous.visitors >= MIN_RELIABLE_COMPARISON_VISITORS,
  }
}

function performanceScore(value: MerchantExperiencePerformanceInput): number {
  return value.highIntentShoppers * 100000 + value.productClicks * 1000 + value.tryOnCompletions * 100 + value.engagedShoppers
}

function topMetric(left: MerchantExperiencePerformanceInput, right: MerchantExperiencePerformanceInput): MerchantExperiencePerformance['topMetric'] {
  if (left.highIntentShoppers !== right.highIntentShoppers) return 'highIntentShoppers'
  if (left.productClicks !== right.productClicks) return 'productClicks'
  if (left.tryOnCompletions !== right.tryOnCompletions) return 'tryOnCompletions'
  if (left.engagedShoppers !== right.engagedShoppers) return 'engagedShoppers'
  return null
}

export function buildMerchantExperiencePerformance(experiences: MerchantExperiencePerformanceInput[]): MerchantExperiencePerformance {
  const ranked = [...experiences].sort((left, right) => performanceScore(right) - performanceScore(left) || right.visitors - left.visitors || left.name.localeCompare(right.name))
  const reliable = ranked.length >= 2 && ranked.every((experience) => experience.visitors >= MIN_RELIABLE_COMPARISON_VISITORS)
  const winner = ranked[0]
  const runnerUp = ranked[1]
  const winnerIsUnique = Boolean(winner && runnerUp && performanceScore(winner) > performanceScore(runnerUp))
  const topExperienceId = reliable && winnerIsUnique ? winner.id : null
  const needsAttentionExperienceId = reliable && winnerIsUnique && ranked.at(-1) && ranked.at(-1)?.id !== topExperienceId ? ranked.at(-1)!.id : null
  return {
    reliable,
    ranked,
    topExperienceId,
    topMetric: topExperienceId && winner && runnerUp ? topMetric(winner, runnerUp) : null,
    needsAttentionExperienceId,
  }
}

function uniqueLeader(values: Array<{ name: string; value: number }>): string | null {
  const ordered = [...values].sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
  if (!ordered[0] || ordered[0].value === 0 || ordered[0].value === ordered[1]?.value) return null
  return ordered[0].name
}

export function buildMerchantSourceHighlights(sources: MerchantSourcePerformanceInput[]): MerchantSourceHighlights {
  const reliable = sources.length > 0 && Math.max(...sources.map((source) => source.visitors)) >= MIN_RELIABLE_COMPARISON_VISITORS
  return {
    topVisitors: uniqueLeader(sources.map((source) => ({ name: source.source, value: source.visitors }))),
    topDownstreamIntent: uniqueLeader(sources.map((source) => ({ name: source.source, value: source.productClicks + source.inquiries }))),
    topHighIntent: uniqueLeader(sources.map((source) => ({ name: source.source, value: source.highIntentShoppers }))),
    reliable,
  }
}

function signedPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`
}

function metricLabel(metric: MerchantExperiencePerformance['topMetric']): string {
  if (metric === 'highIntentShoppers') return 'high-intent shopper'
  if (metric === 'productClicks') return 'downstream intent'
  if (metric === 'tryOnCompletions') return 'Try-On completion'
  if (metric === 'engagedShoppers') return 'engagement'
  return 'decision'
}

export function buildMerchantCommerceInterpretation(input: {
  current: MerchantCommerceMetricValues
  comparison: MerchantCommerceComparison
  experiences: MerchantExperiencePerformance
  sources: MerchantSourceHighlights
  experienceNames: Map<string, string>
}): MerchantCommerceInterpretation {
  if (input.current.visitors === 0) {
    return {
      summary: 'No shopper activity yet. Share a published Store or Campaign before comparing performance.',
      evidence: [],
      nextAction: 'Ask Agent to review setup',
    }
  }

  const evidence: string[] = []
  if (input.comparison.reliable) {
    const visitorDelta = input.comparison.deltas.visitors
    evidence.push(visitorDelta === null ? 'This window has activity, but the previous window had no visitors for a percentage comparison.' : `Visitors changed ${signedPercent(visitorDelta)} versus the previous equivalent window.`)
  } else {
    evidence.push('There is not enough activity in both windows for a reliable period comparison.')
  }

  if (input.experiences.topExperienceId) {
    const name = input.experienceNames.get(input.experiences.topExperienceId) ?? 'One Experience'
    evidence.push(`${name} led the observed ${metricLabel(input.experiences.topMetric)} signal in this window.`)
  } else if (input.experiences.ranked.length > 1) {
    evidence.push('No Experience has enough activity for a reliable performance ranking in this window.')
  }

  if (input.sources.topHighIntent) evidence.push(`${input.sources.topHighIntent} produced the most high-intent shoppers among observed sources.`)
  else if (input.sources.topVisitors && !input.sources.reliable) evidence.push('A source has activity, but not enough source volume for a reliable intent comparison.')

  return {
    summary: evidence[0] ?? 'Review the observed shopper signals below.',
    evidence,
    nextAction: input.experiences.topExperienceId ? 'Ask Agent to analyze this Experience' : 'Ask Agent to compare these Experiences',
  }
}
