/** @jest-environment node */

jest.mock('@/modules/merchant', () => ({
  authenticateMerchantAgentCredential: jest.fn(),
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

jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  recordMerchantAgentOperation: jest.fn().mockResolvedValue(undefined),
}))

import { NextRequest } from 'next/server'
import { authenticateMerchantAgentCredential } from '@/modules/merchant'
import { recordMerchantAgentOperation } from '@/modules/merchant/application/merchant-agent-credentials'
import { POST } from '@/app/api/mcp/route'

const authenticate = authenticateMerchantAgentCredential as jest.Mock
const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read', 'catalog:read', 'experience:read', 'experience:write'] }

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
    const initBody = await initialize.json() as { result: { protocolVersion: string } }
    expect(initBody.result.protocolVersion).toBeTruthy()

    const list = await POST(mcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }))
    expect(list.status).toBe(200)
    const listBody = await list.json() as { result: { tools: Array<{ name: string }> } }
    expect(listBody.result.tools.map((tool) => tool.name)).toEqual([
      'get_onboarding_status', 'get_merchant', 'list_frames', 'import_frames', 'validate_catalog', 'create_store', 'set_store_frames', 'preview_store', 'publish_store',
      'list_campaigns', 'get_campaign', 'create_campaign', 'set_campaign_frames', 'update_campaign', 'preview_campaign', 'publish_campaign', 'archive_campaign',
    ])
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
})
