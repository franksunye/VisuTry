import {
  getExperienceAnalyticsSummary,
  getExperienceFunnel,
  getMerchantIntentSummary,
  getTopFramesByIntent,
  MerchantAnalyticsError,
} from '@/modules/store/application/merchant-analytics'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { AgentScopeError, type MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'
import { prisma } from '@/lib/prisma'
import { buildCampaignScorecard, highIntentScore, isHighIntentSession } from '@/modules/store/domain/merchant-analytics'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    experience: { findFirst: jest.fn() },
    merchantSession: { findMany: jest.fn() },
    merchantEvent: { groupBy: jest.fn() },
    merchantIntent: { groupBy: jest.fn() },
    merchantFrame: { findMany: jest.fn() },
    merchantMembership: { findUnique: jest.fn() },
  },
}))

const db = prisma as unknown as {
  experience: { findFirst: jest.Mock }
  merchantSession: { findMany: jest.Mock }
  merchantEvent: { groupBy: jest.Mock }
  merchantIntent: { groupBy: jest.Mock }
  merchantFrame: { findMany: jest.Mock }
  merchantMembership: { findUnique: jest.Mock }
}

const agent = {
  actorType: 'AGENT_CREDENTIAL' as const,
  actorId: 'credential-a',
  merchantId: 'merchant-a',
  scopes: ['analytics:read'] as MerchantAgentScope[],
}

function seedAnalytics() {
  db.experience.findFirst.mockResolvedValue({
    id: 'campaign-a', merchantId: 'merchant-a', type: 'CAMPAIGN', slug: 'summer', name: 'Summer', status: 'ACTIVE',
    campaignObjective: 'INTENT', campaignGate: 'NONE', presentationMode: 'EDITORIAL_FIRST', referenceData: true,
  })
  db.merchantSession.findMany.mockResolvedValue([{ id: 'session-1' }, { id: 'session-2' }])
  db.merchantEvent.groupBy.mockResolvedValue([
    { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_frame_selected', _count: { _all: 1 } },
    { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', _count: { _all: 1 } },
    { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'merchant_tryon_completed', _count: { _all: 1 } },
    { merchantSessionId: 'session-1', merchantFrameId: 'frame-2', type: 'merchant_tryon_completed', _count: { _all: 1 } },
    { merchantSessionId: 'session-1', merchantFrameId: null, type: 'merchant_compare_started', _count: { _all: 1 } },
    { merchantSessionId: 'session-2', merchantFrameId: 'frame-1', type: 'merchant_tryon_started', _count: { _all: 1 } },
  ])
  db.merchantIntent.groupBy.mockResolvedValue([
    { merchantSessionId: 'session-1', merchantFrameId: 'frame-1', type: 'FAVORITE', _count: { _all: 1 } },
    { merchantSessionId: 'session-2', merchantFrameId: 'frame-1', type: 'PRODUCT_CLICK', _count: { _all: 1 } },
  ])
  db.merchantFrame.findMany.mockResolvedValue([
    { id: 'frame-1', sku: 'F1', name: 'Frame One', imageUrl: 'https://cdn.test/f1.jpg' },
    { id: 'frame-2', sku: 'F2', name: 'Frame Two', imageUrl: null },
  ])
}

describe('Merchant Analytics application foundation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    seedAnalytics()
  })

  it('aggregates authoritative sessions/events/intents with UTC inclusive-exclusive range', async () => {
    const result = await getExperienceAnalyticsSummary({
      actor: agent,
      experienceId: 'campaign-a',
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-08T00:00:00.000Z',
    })

    expect(result.metrics).toMatchObject({
      visits: 2,
      engagedSessions: 2,
      engagementRate: 1,
      tryOnStarts: 2,
      tryOnCompletions: 2,
      tryOnCompletionRate: 1,
      framesTried: 2,
      uniqueFramesTried: 2,
      favorites: 1,
      compares: 1,
      merchantCtaClicks: null,
      highIntentSessions: 1,
      highIntentRate: 0.5,
    })
    expect(result.referenceData).toBe(true)
    expect(result.period).toEqual({ from: '2026-08-01T00:00:00.000Z', to: '2026-08-08T00:00:00.000Z', timezone: 'UTC' })
    expect(result.scorecard.objective).toBe('INTENT')
    expect(result.scorecard.primaryMetrics).toContain('highIntentSessions')
    expect(db.merchantEvent.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      by: ['merchantSessionId', 'merchantFrameId', 'type'],
      where: { merchantId: 'merchant-a', experienceId: 'campaign-a', createdAt: { gte: expect.any(Date), lt: expect.any(Date) } },
    }))
  })

  it('counts one visit per session even when the session has multiple events', async () => {
    const result = await getExperienceFunnel({ actor: agent, experienceId: 'campaign-a', from: '2026-08-01', to: '2026-08-08' })
    expect(result.stages.find((stage) => stage.stage === 'VISIT')?.sessions).toBe(2)
    expect(result.stages.find((stage) => stage.stage === 'ENGAGED')?.sessions).toBe(2)
    expect(result.stages.find((stage) => stage.stage === 'MERCHANT_CTA')).toEqual({ stage: 'MERCHANT_CTA', sessions: null, available: false })
  })

  it('returns deterministic top frames without raw session or identity data', async () => {
    const result = await getTopFramesByIntent({ actor: agent, experienceId: 'campaign-a' })
    expect(result.frames[0]).toEqual(expect.objectContaining({ frameId: 'frame-1', tryOnCount: 1, favoriteCount: 1, intentScore: 5 }))
    expect(JSON.stringify(result)).not.toContain('session-1')
    expect(JSON.stringify(result)).not.toContain('email')
  })

  it('returns aggregate intent only and marks identity/CTA unavailable', async () => {
    await expect(getMerchantIntentSummary({ actor: agent, experienceId: 'campaign-a' })).resolves.toMatchObject({
      tryOnStarts: 2, tryOnCompletions: 2, framesTried: 2, uniqueFramesTried: 2,
      favorites: 1, compares: 1, merchantCtaClicks: null, identifiedSessions: null, identifiedIntentAvailable: false,
    })
  })

  it('enforces agent analytics:read and tenant-scopes the experience locator', async () => {
    await expect(getExperienceAnalyticsSummary({ actor: { ...agent, scopes: [] }, experienceId: 'campaign-a' })).rejects.toBeInstanceOf(AgentScopeError)
    db.experience.findFirst.mockResolvedValue(null)
    await expect(getExperienceAnalyticsSummary({ actor: agent, experienceId: 'campaign-b' })).rejects.toMatchObject({ code: 'EXPERIENCE_NOT_FOUND' })
    expect(db.experience.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'campaign-b', merchantId: 'merchant-a' } }))
  })

  it('does not return a cross-tenant frame row referenced by an event', async () => {
    db.merchantEvent.groupBy.mockResolvedValue([
      { merchantSessionId: 'session-1', merchantFrameId: 'frame-b', type: 'merchant_tryon_completed', _count: { _all: 1 } },
    ])
    db.merchantFrame.findMany.mockResolvedValue([])
    await expect(getTopFramesByIntent({ actor: agent, experienceId: 'campaign-a' })).rejects.toBeInstanceOf(MerchantAccessError)
    expect(db.merchantFrame.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { merchantId: 'merchant-a', id: { in: expect.arrayContaining(['frame-b']) } } }))
  })

  it('denies global ADMIN-shaped human actors without MerchantMembership', async () => {
    db.merchantMembership.findUnique.mockResolvedValue(null)
    await expect(getExperienceAnalyticsSummary({
      actor: { actorType: 'HUMAN', actorId: 'global-admin', merchantId: 'merchant-a' },
      experienceId: 'campaign-a',
    })).rejects.toBeInstanceOf(MerchantAccessError)
    expect(db.experience.findFirst).not.toHaveBeenCalled()
  })

  it('rejects inverted and overlong ranges without querying analytics data', async () => {
    await expect(getExperienceAnalyticsSummary({ actor: agent, experienceId: 'campaign-a', from: '2026-08-08', to: '2026-08-01' })).rejects.toBeInstanceOf(MerchantAnalyticsError)
    await expect(getExperienceAnalyticsSummary({ actor: agent, experienceId: 'campaign-a', from: '2024-01-01', to: '2026-01-01' })).rejects.toBeInstanceOf(MerchantAnalyticsError)
    expect(db.merchantSession.findMany).not.toHaveBeenCalled()
  })

  it('keeps objective scorecards deterministic and lead metrics honest', () => {
    const metrics = {
      visits: 10, engagedSessions: 4, engagementRate: 0.4, tryOnStarts: 3, tryOnCompletions: 2,
      tryOnCompletionRate: 2 / 3, framesTried: 2, uniqueFramesTried: 2, favorites: 1, compares: 1,
      merchantCtaClicks: null, highIntentSessions: 1, highIntentRate: 0.1,
    }
    expect(buildCampaignScorecard('TRAFFIC', metrics).primaryMetrics).toContain('visits')
    expect(buildCampaignScorecard('INTENT', metrics).primaryMetrics).toContain('tryOnCompletions')
    expect(buildCampaignScorecard('LEAD', metrics).leadMetricsAvailable).toBe(false)
    expect(buildCampaignScorecard('LEAD', metrics).leadMetrics.identifiedSessions).toBeNull()
    expect(buildCampaignScorecard(null, metrics).primaryMetrics).toContain('engagementRate')
  })

  it('returns zero counts and null rates for an empty period', async () => {
    db.merchantSession.findMany.mockResolvedValue([])
    db.merchantEvent.groupBy.mockResolvedValue([])
    db.merchantIntent.groupBy.mockResolvedValue([])
    const result = await getExperienceAnalyticsSummary({ actor: agent, experienceId: 'campaign-a' })
    expect(result.metrics).toMatchObject({ visits: 0, engagedSessions: 0, engagementRate: null, tryOnCompletionRate: null, highIntentRate: null })
    expect(result.metrics.favorites).toBe(0)
  })

  it('scores observed behavior without adding identity weight', () => {
    const signals = { tryOnStarts: 0, tryOnCompletions: 1, uniqueFramesTried: 1, favorites: 0, compares: 0, frameInteractions: 0, productInteractions: 0 }
    expect(highIntentScore(signals)).toBe(3)
    expect(isHighIntentSession({ ...signals, favorites: 1 })).toBe(true)
  })
})
