/** @jest-environment node */

jest.mock('@/modules/merchant', () => ({
  authenticateMerchantAgentCredential: jest.fn(),
  authenticateMerchantMcpBearer: jest.fn(),
  canonicalMcpResource: jest.fn().mockReturnValue('http://localhost/api/mcp'),
  InvalidAgentCredentialError: class InvalidAgentCredentialError extends Error {
    readonly code = 'INVALID_AGENT_CREDENTIAL'
    readonly httpStatus = 401
  },
  consumeMerchantAgentMcpRequest: jest.fn(),
  AgentRateLimitError: class AgentRateLimitError extends Error {
    readonly code = 'AGENT_RATE_LIMITED'
    readonly httpStatus = 429
    readonly retryAfterSeconds = 10
  },
}))

jest.mock('@/modules/merchant/application/merchant-onboarding', () => ({
  merchantOnboarding: {
    getOnboardingStatus: jest.fn().mockResolvedValue({ merchant: { id: 'merchant-a' }, blockers: [] }),
    getMerchant: jest.fn().mockResolvedValue({ id: 'merchant-a', slug: 'merchant-a' }),
    listMerchantFrames: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    validateMerchantCatalog: jest.fn().mockResolvedValue({ total: 0, valid: 0, invalid: 0, items: [] }),
    importMerchantFrames: jest.fn(),
    createMerchantStore: jest.fn(),
    setMerchantStoreFrames: jest.fn(),
    previewMerchantStore: jest.fn(),
    publishMerchantStore: jest.fn(),
  },
  MerchantOnboardingError: class MerchantOnboardingError extends Error {},
}))

jest.mock('@/modules/store/application/campaign-service', () => ({
  listCampaigns: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
  getCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT' }),
  createCampaignDraft: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT', publicPath: '/en/c/merchant-a/spring-edit' }),
  setCampaignFrames: jest.fn().mockResolvedValue({ frameIds: ['frame-a'] }),
  updateCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT' }),
  previewCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', readiness: { ready: true } }),
  publishCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'ACTIVE' }),
  archiveCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'ARCHIVED' }),
  CampaignServiceError: class CampaignServiceError extends Error {
    readonly code = 'CAMPAIGN_NOT_READY'
    readonly httpStatus = 409
  },
}))

jest.mock('@/modules/store/application/merchant-analytics', () => ({
  getExperienceAnalyticsSummary: jest.fn().mockResolvedValue({
    experience: { id: 'campaign-a', type: 'CAMPAIGN', slug: 'spring-edit', name: 'Spring Edit', status: 'ACTIVE', objective: 'INTENT', gate: 'NONE' },
    period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z', timezone: 'UTC' },
    referenceData: false,
    metrics: { visits: 20, engagedSessions: 10, engagementRate: 0.5, tryOnStarts: 5, tryOnCompletions: 4, tryOnCompletionRate: 0.8, framesTried: 4, uniqueFramesTried: 3, favorites: 2, compares: 1, merchantCtaClicks: null, highIntentSessions: 3, highIntentRate: 0.15 },
    scorecard: { objective: 'INTENT', primaryMetrics: ['tryOnCompletions'], leadMetricsAvailable: false, leadMetrics: { gateShown: null, optInCompleted: null, identifiedSessions: null, optInRate: null } },
  }),
  getExperienceFunnel: jest.fn().mockResolvedValue({ experienceId: 'campaign-a', period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z', timezone: 'UTC' }, referenceData: false, stages: [{ stage: 'VISIT', sessions: 20, available: true }] }),
  getTopFramesByIntent: jest.fn().mockResolvedValue({ experienceId: 'campaign-a', period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z', timezone: 'UTC' }, referenceData: false, frames: [{ frameId: 'frame-a', sku: 'A', name: 'Frame A', imageUrl: null, tryOnCount: 2, favoriteCount: 1, compareCount: 1, ctaCount: null, highIntentInteractions: 2, intentScore: 7 }] }),
  getMerchantIntentSummary: jest.fn().mockResolvedValue({ experienceId: 'campaign-a', period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z', timezone: 'UTC' }, referenceData: false, tryOnStarts: 5, tryOnCompletions: 4, framesTried: 4, uniqueFramesTried: 3, favorites: 2, compares: 1, merchantCtaClicks: null, highIntentSessions: 3, identifiedSessions: null, identifiedIntentAvailable: false }),
  MerchantAnalyticsError: class MerchantAnalyticsError extends Error {},
}))

jest.mock('@/modules/store/application/compare-merchant-experiences', () => ({
  compareMerchantExperiences: jest.fn().mockResolvedValue({
    period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z', timezone: 'UTC' },
    experiences: [
      { id: 'campaign-a', type: 'CAMPAIGN', name: 'Spring Edit', objective: 'INTENT', referenceData: false, metrics: { engagementRate: 0.5 }, scorecard: { objective: 'INTENT' } },
      { id: 'campaign-b', type: 'CAMPAIGN', name: 'Summer Edit', objective: 'INTENT', referenceData: false, metrics: { engagementRate: 0.4 }, scorecard: { objective: 'INTENT' } },
    ],
    comparison: { highestEngagement: 'campaign-a', highestTryOnCompletion: null, highestHighIntentRate: null, highestMerchantCtaRate: null },
  }),
  MerchantAnalyticsComparisonError: class MerchantAnalyticsComparisonError extends Error {
    readonly code = 'INVALID_REQUEST'
  },
}))

jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn().mockResolvedValue(undefined),
}))

import { NextRequest } from 'next/server'
import { authenticateMerchantMcpBearer } from '@/modules/merchant'
import { recordMerchantAgentOperation } from '@/modules/merchant/application/merchant-agent-credentials'
import { POST } from '@/app/api/mcp/route'

const authenticate = authenticateMerchantMcpBearer as jest.Mock
const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read', 'catalog:read', 'experience:read', 'experience:write', 'analytics:read'] }

function mcpRequest(message: unknown) {
  return new NextRequest('http://localhost/api/mcp', {
    method: 'POST',
    headers: { authorization: 'Bearer secret', 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(message),
  })
}

describe('MCP transport protocol', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticate.mockResolvedValue(actor)
  })

  it('supports initialize and tools/list over Streamable HTTP', async () => {
    const initialize = await POST(mcpRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }))
    expect(initialize.status).toBe(200)
    const initBody = await initialize.json() as { result: { protocolVersion: string; instructions?: string } }
    expect(initBody.result.protocolVersion).toBeTruthy()
    expect(initBody.result.instructions).toContain('one authorized VisuTry Merchant workspace')

    const list = await POST(mcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }))
    expect(list.status).toBe(200)
    const listBody = await list.json() as { result: { tools: Array<{ name: string; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean }; _meta?: { securitySchemes?: Array<{ type: string; scopes: string[] }> } }> } }
    expect(listBody.result.tools.map((tool) => tool.name)).toEqual([
      'get_onboarding_status', 'get_merchant', 'list_frames', 'import_frames', 'validate_catalog', 'create_store', 'set_store_frames', 'preview_store', 'publish_store',
      'list_campaigns', 'get_campaign', 'create_campaign', 'set_campaign_frames', 'update_campaign', 'preview_campaign', 'publish_campaign', 'archive_campaign',
      'get_experience_summary', 'get_experience_funnel', 'get_top_frames', 'get_intent_summary', 'compare_experiences',
    ])
    const publish = listBody.result.tools.find((tool) => tool.name === 'publish_campaign')
    expect(publish?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true })
    expect(publish?._meta?.securitySchemes).toEqual([{ type: 'oauth2', scopes: ['experience:write'] }])
    const read = listBody.result.tools.find((tool) => tool.name === 'get_merchant')
    expect(read?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false })
  })

  it('routes a tool call through the authenticated tenant context', async () => {
    const response = await POST(mcpRequest({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_merchant', arguments: {} } }))
    expect(response.status).toBe(200)
    const body = await response.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(body.result.content[0].text)).toEqual({ id: 'merchant-a', slug: 'merchant-a' })
  })

  it('routes Campaign create and publish through the authenticated actor', async () => {
    const create = await POST(mcpRequest({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'create_campaign', arguments: { name: 'Spring Edit', objective: 'INTENT', conversionGate: 'NONE' } } }))
    expect(create.status).toBe(200)
    const createBody = await create.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(createBody.result.content[0].text)).toMatchObject({ id: 'campaign-a', status: 'DRAFT' })
    expect(recordMerchantAgentOperation).toHaveBeenCalledWith(expect.objectContaining({ action: 'campaign.created', resourceType: 'Experience', resourceId: 'campaign-a' }))

    const publish = await POST(mcpRequest({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'publish_campaign', arguments: { campaignId: 'campaign-a', approved: true } } }))
    expect(publish.status).toBe(200)
    const publishBody = await publish.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(publishBody.result.content[0].text)).toEqual({ id: 'campaign-a', status: 'ACTIVE' })
    expect(recordMerchantAgentOperation).toHaveBeenCalledWith(expect.objectContaining({ action: 'campaign.published', resourceType: 'Experience', resourceId: 'campaign-a' }))
  })

  it('routes Analytics summary and comparison through the authenticated actor', async () => {
    const summary = await POST(mcpRequest({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'get_experience_summary', arguments: { experienceId: 'campaign-a' } } }))
    expect(summary.status).toBe(200)
    const summaryBody = await summary.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(summaryBody.result.content[0].text)).toMatchObject({
      experience: { id: 'campaign-a', objective: 'INTENT', referenceData: false },
      availability: { merchantCtaClicks: false, identifiedIntent: false, revenue: false },
    })

    const comparison = await POST(mcpRequest({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'compare_experiences', arguments: { experienceIds: ['campaign-a', 'campaign-b'] } } }))
    expect(comparison.status).toBe(200)
    const comparisonBody = await comparison.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(comparisonBody.result.content[0].text)).toMatchObject({ comparison: { highestEngagement: 'campaign-a' } })
  })

  it('denies Analytics tools when the credential lacks analytics:read', async () => {
    authenticate.mockResolvedValue({ ...actor, scopes: ['merchant:read'] })
    const response = await POST(mcpRequest({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'get_intent_summary', arguments: { experienceId: 'campaign-a' } } }))
    expect(response.status).toBe(200)
    const body = await response.json() as { result: { isError?: boolean; content: Array<{ text: string }> } }
    expect(body.result.isError).toBe(true)
    expect(JSON.parse(body.result.content[0].text)).toMatchObject({ code: 'AGENT_SCOPE_REQUIRED' })
  })

  it('advertises protected-resource metadata when bearer authentication fails', async () => {
    authenticate.mockRejectedValue(new (require('@/modules/merchant').InvalidAgentCredentialError)())
    const response = await POST(mcpRequest({ jsonrpc: '2.0', id: 9, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'oauth-client', version: '1' } } }))
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toContain('resource_metadata="http://localhost/.well-known/oauth-protected-resource"')
  })
})
