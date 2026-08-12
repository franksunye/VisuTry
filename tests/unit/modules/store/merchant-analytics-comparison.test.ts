import {
  compareMerchantExperiences,
  MerchantAnalyticsComparisonError,
} from '@/modules/store/application/compare-merchant-experiences'
import { getExperienceAnalyticsSummary, MerchantAnalyticsError, type MerchantAnalyticsSummary } from '@/modules/store/application/merchant-analytics'
import { AgentScopeError, type MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'

jest.mock('@/modules/store/application/merchant-analytics', () => ({
  getExperienceAnalyticsSummary: jest.fn(),
  MerchantAnalyticsError: class MerchantAnalyticsError extends Error {
    readonly code: 'INVALID_RANGE' | 'EXPERIENCE_NOT_FOUND'

    constructor(code: 'INVALID_RANGE' | 'EXPERIENCE_NOT_FOUND', message: string) {
      super(message)
      this.code = code
    }
  },
}))

const summary = (id: string, metrics: Partial<MerchantAnalyticsSummary['metrics']>): MerchantAnalyticsSummary => ({
  experience: { id, type: 'CAMPAIGN', slug: id, name: id, status: 'ACTIVE', objective: 'INTENT', gate: 'NONE' },
  period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z', timezone: 'UTC' },
  referenceData: false,
  metrics: { visits: 0, engagedSessions: 0, engagementRate: null, tryOnStarts: 0, tryOnCompletions: 0, tryOnCompletionRate: null, framesTried: 0, uniqueFramesTried: 0, favorites: 0, compares: 0, merchantCtaClicks: null, highIntentSessions: 0, highIntentRate: null, ...metrics },
  scorecard: { objective: 'INTENT', primaryMetrics: ['tryOnCompletions'], leadMetricsAvailable: false, leadMetrics: { gateShown: null, optInCompleted: null, identifiedSessions: null, optInRate: null } },
})

const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['analytics:read'] as MerchantAgentScope[] }
const getSummary = getExperienceAnalyticsSummary as jest.Mock

describe('compareMerchantExperiences', () => {
  beforeEach(() => jest.clearAllMocks())

  it('composes two to five C1 summaries without a second analytics query model', async () => {
    getSummary
      .mockResolvedValueOnce(summary('campaign-a', { engagementRate: 0.4, tryOnCompletionRate: 0.5, highIntentRate: 0.2 }))
      .mockResolvedValueOnce(summary('campaign-b', { engagementRate: 0.6, tryOnCompletionRate: 0.3, highIntentRate: 0.1 }))
    const result = await compareMerchantExperiences({ actor, experienceIds: ['campaign-a', 'campaign-b'] })
    expect(result.comparison).toEqual({ highestEngagement: 'campaign-b', highestTryOnCompletion: 'campaign-a', highestHighIntentRate: 'campaign-a', highestMerchantCtaRate: null })
    expect(getSummary).toHaveBeenNthCalledWith(1, expect.objectContaining({ actor, experienceId: 'campaign-a' }))
    expect(getSummary).toHaveBeenNthCalledWith(2, expect.objectContaining({ actor, experienceId: 'campaign-b' }))
  })

  it('supports five experiences and returns null for zero denominators, unavailable metrics, and ties', async () => {
    getSummary.mockImplementation(async (input: { experienceId: string }) => summary(input.experienceId, { engagementRate: 0, tryOnCompletionRate: null, highIntentRate: 0 }))
    const result = await compareMerchantExperiences({ actor, experienceIds: ['a', 'b', 'c', 'd', 'e'] })
    expect(result.comparison).toEqual({ highestEngagement: null, highestTryOnCompletion: null, highestHighIntentRate: null, highestMerchantCtaRate: null })
  })

  it('rejects more than five or duplicate experiences before composing summaries', async () => {
    await expect(compareMerchantExperiences({ actor, experienceIds: ['a', 'b', 'c', 'd', 'e', 'f'] })).rejects.toBeInstanceOf(MerchantAnalyticsComparisonError)
    await expect(compareMerchantExperiences({ actor, experienceIds: ['a', 'a'] })).rejects.toBeInstanceOf(MerchantAnalyticsComparisonError)
    expect(getSummary).not.toHaveBeenCalled()
  })

  it('enforces analytics scope and preserves C1 tenant-safe not-found errors', async () => {
    await expect(compareMerchantExperiences({ actor: { ...actor, scopes: [] }, experienceIds: ['a', 'b'] })).rejects.toBeInstanceOf(AgentScopeError)
    getSummary.mockRejectedValue(new MerchantAnalyticsError('EXPERIENCE_NOT_FOUND', 'Experience not found.'))
    await expect(compareMerchantExperiences({ actor, experienceIds: ['a', 'foreign'] })).rejects.toMatchObject({ code: 'EXPERIENCE_NOT_FOUND' })
  })
})
