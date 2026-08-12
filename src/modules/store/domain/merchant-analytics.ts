import type { CampaignObjective } from './campaign-policy'

export type AnalyticsObjective = CampaignObjective | null

export type MerchantAnalyticsMetrics = {
  visits: number
  engagedSessions: number
  engagementRate: number | null
  tryOnStarts: number
  tryOnCompletions: number
  tryOnCompletionRate: number | null
  framesTried: number
  uniqueFramesTried: number
  favorites: number
  compares: number
  merchantCtaClicks: number | null
  highIntentSessions: number
  highIntentRate: number | null
}

export type CampaignScorecard = {
  objective: AnalyticsObjective
  primaryMetrics: string[]
  leadMetricsAvailable: false
  leadMetrics: {
    gateShown: number | null
    optInCompleted: number | null
    identifiedSessions: number | null
    optInRate: number | null
  }
}

export function safeRate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null
}

/**
 * Deterministic v0.1 Campaign scorecard. This is deliberately pure so the
 * same contract can be reused by future Admin and MCP adapters.
 */
export function buildCampaignScorecard(
  objective: AnalyticsObjective,
  metrics: MerchantAnalyticsMetrics,
): CampaignScorecard {
  const primaryMetrics = objective === 'TRAFFIC' || objective === null
    ? ['visits', 'engagedSessions', 'engagementRate', 'tryOnStarts', 'merchantCtaClicks']
    : objective === 'LEAD'
      ? ['visits', 'engagedSessions', 'tryOnStarts', 'favorites', 'highIntentSessions']
      : ['tryOnStarts', 'tryOnCompletions', 'tryOnCompletionRate', 'framesTried', 'uniqueFramesTried', 'favorites', 'compares', 'highIntentSessions', 'highIntentRate', 'merchantCtaClicks']

  return {
    objective,
    primaryMetrics,
    leadMetricsAvailable: false,
    leadMetrics: {
      gateShown: null,
      optInCompleted: null,
      identifiedSessions: null,
      optInRate: null,
    },
  }
}

export type MerchantAnalyticsSessionSignals = {
  tryOnStarts: number
  tryOnCompletions: number
  uniqueFramesTried: number
  favorites: number
  compares: number
  frameInteractions: number
  productInteractions: number
}

/** Identity is intentionally absent: observed shopping behavior alone scores intent. */
export function highIntentScore(signals: MerchantAnalyticsSessionSignals): number {
  return signals.tryOnCompletions * 3
    + signals.favorites * 3
    + signals.compares * 2
    + (signals.uniqueFramesTried >= 2 ? 2 : 0)
    + (signals.frameInteractions + signals.productInteractions >= 2 ? 1 : 0)
}

export function isHighIntentSession(signals: MerchantAnalyticsSessionSignals): boolean {
  return highIntentScore(signals) >= 4
}
