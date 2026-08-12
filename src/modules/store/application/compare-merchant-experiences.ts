import {
  getExperienceAnalyticsSummary,
  type AnalyticsRangeInput,
  type MerchantAnalyticsSummary,
} from './merchant-analytics'
import { requireAgentScope, type MerchantActorContext } from '@/modules/merchant/domain/actor'

export const MIN_COMPARISON_EXPERIENCES = 2
export const MAX_COMPARISON_EXPERIENCES = 5

export class MerchantAnalyticsComparisonError extends Error {
  readonly code = 'INVALID_REQUEST'
  readonly httpStatus = 400

  constructor(message = 'Comparison requires 2 to 5 distinct experiences.') {
    super(message)
    this.name = 'MerchantAnalyticsComparisonError'
  }
}

export type MerchantExperienceComparisonInput = AnalyticsRangeInput & {
  actor: MerchantActorContext
  experienceIds: string[]
}

export type MerchantExperienceComparison = {
  period: MerchantAnalyticsSummary['period']
  experiences: Array<{
    id: string
    type: MerchantAnalyticsSummary['experience']['type']
    name: string
    objective: MerchantAnalyticsSummary['experience']['objective']
    referenceData: boolean
    metrics: MerchantAnalyticsSummary['metrics']
    scorecard: MerchantAnalyticsSummary['scorecard']
  }>
  comparison: {
    highestEngagement: string | null
    highestTryOnCompletion: string | null
    highestHighIntentRate: string | null
    highestMerchantCtaRate: string | null
  }
}

function uniqueMetricWinner(
  summaries: MerchantAnalyticsSummary[],
  read: (summary: MerchantAnalyticsSummary) => number | null,
): string | null {
  const values = summaries
    .map((summary) => ({ id: summary.experience.id, value: read(summary) }))
    .filter((entry): entry is { id: string; value: number } => entry.value != null && Number.isFinite(entry.value))

  if (values.length === 0) return null
  const highest = Math.max(...values.map((entry) => entry.value))
  const winners = values.filter((entry) => entry.value === highest)
  return winners.length === 1 ? winners[0].id : null
}

export async function compareMerchantExperiences(
  input: MerchantExperienceComparisonInput,
): Promise<MerchantExperienceComparison> {
  if (
    input.experienceIds.length < MIN_COMPARISON_EXPERIENCES
    || input.experienceIds.length > MAX_COMPARISON_EXPERIENCES
    || new Set(input.experienceIds).size !== input.experienceIds.length
  ) {
    throw new MerchantAnalyticsComparisonError()
  }

  requireAgentScope(input.actor, 'analytics:read')

  const summaries = await Promise.all(input.experienceIds.map((experienceId) => getExperienceAnalyticsSummary({
    actor: input.actor,
    experienceId,
    from: input.from,
    to: input.to,
  })))

  return {
    period: summaries[0].period,
    experiences: summaries.map((summary) => ({
      id: summary.experience.id,
      type: summary.experience.type,
      name: summary.experience.name,
      objective: summary.experience.objective,
      referenceData: summary.referenceData,
      metrics: summary.metrics,
      scorecard: summary.scorecard,
    })),
    comparison: {
      highestEngagement: uniqueMetricWinner(summaries, (summary) => summary.metrics.engagementRate),
      highestTryOnCompletion: uniqueMetricWinner(summaries, (summary) => summary.metrics.tryOnCompletionRate),
      highestHighIntentRate: uniqueMetricWinner(summaries, (summary) => summary.metrics.highIntentRate),
      highestMerchantCtaRate: null,
    },
  }
}
