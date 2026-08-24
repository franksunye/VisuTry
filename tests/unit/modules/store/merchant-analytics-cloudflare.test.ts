/** @jest-environment node */

jest.mock('@/data/neon-cloudflare', () => ({
  getCloudflareSql: jest.fn(),
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { getExperienceAnalyticsSummary, getExperienceFunnel, getMerchantIntentSummary } from '@/modules/store/application/merchant-analytics-cloudflare'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'

const actor: AgentMerchantActor = {
  actorType: 'AGENT_OAUTH' as const,
  actorId: 'access-token-a',
  userId: 'user-a',
  authorizationId: 'authorization-a',
  merchantId: 'merchant-a',
  scopes: ['analytics:read'],
}

function sqlMock(results: unknown[][]) {
  const sql = jest.fn(async () => results.shift() ?? [])
  ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)
  return sql
}

function analyticsSqlResults() {
  return [
    [{ id: 'store-a', merchantId: 'merchant-a', type: 'STORE', slug: 'store', name: 'Store A', status: 'ACTIVE', campaignObjective: null, campaignGate: null, referenceData: true, merchantReferenceData: true }],
    [{ id: 'session-a' }],
    [
      { merchantSessionId: 'session-a', merchantFrameId: 'frame-a', type: 'merchant_recommendation_completed', count: 1 },
      { merchantSessionId: 'session-a', merchantFrameId: 'frame-a', type: 'merchant_tryon_started', count: 1 },
      { merchantSessionId: 'session-a', merchantFrameId: 'frame-a', type: 'merchant_tryon_completed', count: 1 },
      { merchantSessionId: 'session-a', merchantFrameId: 'frame-a', type: 'merchant_compare_started', count: 1 },
      { merchantSessionId: 'session-a', merchantFrameId: 'frame-a', type: 'merchant_frame_selected', count: 1 },
    ],
    [{ merchantSessionId: 'session-a', merchantFrameId: 'frame-a', type: 'FAVORITE', count: 1 }],
    [{ id: 'frame-a', sku: 'sku-a', name: 'Frame A', imageUrl: 'https://example.test/frame-a.png' }],
  ]
}

describe('Cloudflare merchant analytics', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns merchant-readable aggregate summary with reference provenance', async () => {
    sqlMock(analyticsSqlResults())
    const result = await getExperienceAnalyticsSummary({ actor, experienceId: 'store-a' })

    expect(result).toMatchObject({
      experience: { id: 'store-a', type: 'STORE', name: 'Store A' },
      referenceData: true,
      metrics: { visits: 1, engagedSessions: 1, tryOnCompletions: 1, compares: 1, favorites: 1, highIntentSessions: 1 },
    })
    expect(result).not.toHaveProperty('sessions')
    expect(result).not.toHaveProperty('revenue')
  })

  it('returns funnel and intent reads without exposing session rows', async () => {
    sqlMock(analyticsSqlResults())
    const funnel = await getExperienceFunnel({ actor, experienceId: 'store-a' })
    sqlMock(analyticsSqlResults())
    const intent = await getMerchantIntentSummary({ actor, experienceId: 'store-a' })

    expect(funnel.stages).toEqual(expect.arrayContaining([
      { stage: 'VISIT', sessions: 1, available: true },
      { stage: 'HIGH_INTENT', sessions: 1, available: true },
    ]))
    expect(intent).toMatchObject({ tryOnStarts: 1, tryOnCompletions: 1, favorites: 1, compares: 1, highIntentSessions: 1 })
    expect(intent).not.toHaveProperty('session-a')
  })
})
