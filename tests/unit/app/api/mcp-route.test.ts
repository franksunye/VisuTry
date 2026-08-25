/** @jest-environment node */

jest.mock('@/modules/merchant/application/merchant-mcp-cloudflare', () => ({
  authenticateMerchantMcpBearer: jest.fn(),
  canonicalMcpResource: jest.fn((origin: string) => `${origin}/api/mcp`),
  assertTrustedMcpOrigin: jest.fn(),
  McpOriginError: class McpOriginError extends Error {
    readonly code = 'MCP_ORIGIN_FORBIDDEN'
    readonly httpStatus = 403
  },
  InvalidAgentCredentialError: class InvalidAgentCredentialError extends Error {
    readonly code = 'INVALID_AGENT_CREDENTIAL'
    readonly httpStatus = 401
  },
}))

jest.mock('@/modules/merchant/cloudflare', () => ({
  consumeMerchantAgentMcpRequest: jest.fn().mockResolvedValue(undefined),
  AgentRateLimitError: class AgentRateLimitError extends Error {
    readonly code = 'AGENT_RATE_LIMITED'
    readonly httpStatus = 429
    readonly retryAfterSeconds = 10
  },
}))

jest.mock('@/modules/merchant/application/merchant-onboarding-cloudflare', () => ({
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
  MerchantOnboardingError: class MerchantOnboardingError extends Error {
    readonly code = 'MERCHANT_ONBOARDING_ERROR'
  },
}))

jest.mock('@/modules/merchant/application/merchant-agent-credentials-cloudflare', () => ({
  recordMerchantAgentOperation: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/modules/store/application/campaign-service-cloudflare', () => ({
  listCampaigns: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
  getCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT' }),
  createCampaignDraft: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT', publicPath: '/en/c/merchant-a/spring-edit' }),
  setCampaignFrames: jest.fn().mockResolvedValue({ frameIds: ['frame-a'] }),
  updateCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', status: 'DRAFT' }),
  previewCampaign: jest.fn().mockResolvedValue({ id: 'campaign-a', readiness: { ready: true } }),
  CampaignServiceError: class CampaignServiceError extends Error {
    readonly code = 'CAMPAIGN_NOT_READY'
    readonly httpStatus = 409
  },
}))

jest.mock('@/modules/store/application/merchant-analytics-cloudflare', () => ({
  getExperienceAnalyticsSummary: jest.fn().mockResolvedValue({ experience: { id: 'store-a', type: 'STORE', name: 'Store A', objective: null }, period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-24T00:00:00.000Z', timezone: 'UTC' }, referenceData: true, metrics: { visits: 1 }, scorecard: {} }),
  getExperienceFunnel: jest.fn().mockResolvedValue({ experienceId: 'store-a', stages: [] }),
  getTopFramesByIntent: jest.fn().mockResolvedValue({ experienceId: 'store-a', frames: [] }),
  getMerchantIntentSummary: jest.fn().mockResolvedValue({ experienceId: 'store-a', tryOnStarts: 0 }),
  MerchantAnalyticsError: class MerchantAnalyticsError extends Error { readonly code = 'EXPERIENCE_NOT_FOUND' },
}))

import { NextRequest } from 'next/server'
import {
  assertTrustedMcpOrigin,
  authenticateMerchantMcpBearer,
  InvalidAgentCredentialError,
  McpOriginError,
} from '@/modules/merchant/application/merchant-mcp-cloudflare'
import { recordMerchantAgentOperation } from '@/modules/merchant/application/merchant-agent-credentials-cloudflare'
import { POST } from '@/app/api/mcp/route'

const authenticate = authenticateMerchantMcpBearer as jest.Mock
const originGuard = assertTrustedMcpOrigin as jest.Mock
const actor = {
  actorType: 'AGENT_CREDENTIAL' as const,
  actorId: 'credential-a',
  merchantId: 'merchant-a',
  scopes: ['merchant:read', 'catalog:read', 'catalog:write', 'experience:read', 'experience:write'],
}

function mcpRequest(message: unknown, origin?: string) {
  return new NextRequest('http://localhost/api/mcp', {
    method: 'POST',
    headers: {
      authorization: 'Bearer vt_live_test',
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(message),
  })
}

describe('MCP transport protocol', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticate.mockResolvedValue(actor)
  })

  it('supports initialize and exposes only the proven Cloudflare B2 tool surface', async () => {
    const initialize = await POST(mcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
    }))
    expect(initialize.status).toBe(200)
    const initBody = await initialize.json() as { result: { protocolVersion: string } }
    expect(initBody.result.protocolVersion).toBeTruthy()

    const list = await POST(mcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }))
    expect(list.status).toBe(200)
    const listBody = await list.json() as {
      result: {
        tools: Array<{
          name: string
          annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean }
          _meta?: { securitySchemes?: Array<{ type: string; scopes: string[] }> }
        }>
      }
    }
    expect(listBody.result.tools.map((tool) => tool.name)).toEqual([
      'get_onboarding_status',
      'get_merchant',
      'list_frames',
      'import_frames',
      'validate_catalog',
      'create_store',
      'set_store_frames',
      'preview_store',
      'publish_store',
      'list_campaigns',
      'get_campaign',
      'create_campaign',
      'set_campaign_frames',
      'update_campaign',
      'preview_campaign',
      'get_experience_summary',
      'get_experience_funnel',
      'get_top_frames',
      'get_intent_summary',
    ])

    const create = listBody.result.tools.find((tool) => tool.name === 'create_campaign')
    expect(create?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false })
    expect(create?._meta?.securitySchemes).toEqual([{ type: 'oauth2', scopes: ['experience:write'] }])
    const read = listBody.result.tools.find((tool) => tool.name === 'get_merchant')
    expect(read?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false })

    const names = new Set(listBody.result.tools.map((tool) => tool.name))
    expect(names.has('inspect_catalog_source')).toBe(false)
    expect(names.has('publish_campaign')).toBe(false)
    expect(names.has('get_intent_summary')).toBe(true)
  })

  it('routes a tool call through the authenticated tenant context', async () => {
    const response = await POST(mcpRequest({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_merchant', arguments: {} } }))
    expect(response.status).toBe(200)
    const body = await response.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(body.result.content[0].text)).toEqual({ id: 'merchant-a', slug: 'merchant-a' })
  })

  it('routes a Campaign DRAFT create through the authenticated actor', async () => {
    const response = await POST(mcpRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'create_campaign', arguments: { name: 'Spring Edit', objective: 'INTENT', conversionGate: 'NONE' } },
    }))
    expect(response.status).toBe(200)
    const body = await response.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(body.result.content[0].text)).toMatchObject({ id: 'campaign-a', status: 'DRAFT' })
    expect(recordMerchantAgentOperation).toHaveBeenCalledWith(expect.objectContaining({
      action: 'campaign.created',
      resourceType: 'Experience',
      resourceId: 'campaign-a',
    }))
  })

  it('returns an MCP scope error for a supported write when experience:write is absent', async () => {
    authenticate.mockResolvedValue({ ...actor, scopes: ['merchant:read'] })
    const response = await POST(mcpRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'create_campaign', arguments: { name: 'Spring Edit' } },
    }))
    expect(response.status).toBe(200)
    const body = await response.json() as { result: { isError?: boolean; content: Array<{ text: string }> } }
    expect(body.result.isError).toBe(true)
    expect(JSON.parse(body.result.content[0].text)).toMatchObject({ code: 'AGENT_SCOPE_REQUIRED' })
  })

  it('advertises protected-resource metadata when bearer authentication fails', async () => {
    authenticate.mockRejectedValue(new InvalidAgentCredentialError())
    const response = await POST(mcpRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'oauth-client', version: '1' } },
    }))
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toContain('resource_metadata="http://localhost/.well-known/oauth-protected-resource"')
  })

  it('rejects an untrusted Origin before bearer authentication', async () => {
    originGuard.mockImplementationOnce(() => { throw new McpOriginError() })
    const response = await POST(mcpRequest({ jsonrpc: '2.0', id: 7, method: 'initialize', params: {} }, 'https://evil.example'))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'MCP_ORIGIN_FORBIDDEN' })
    expect(authenticate).not.toHaveBeenCalled()
  })
})
