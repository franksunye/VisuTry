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

import { NextRequest } from 'next/server'
import { authenticateMerchantAgentCredential } from '@/modules/merchant'
import { POST } from '@/app/api/mcp/route'

const authenticate = authenticateMerchantAgentCredential as jest.Mock
const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['merchant:read', 'catalog:read'] }

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
    ])
  })

  it('routes a tool call through the authenticated tenant context', async () => {
    const response = await POST(mcpRequest({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_merchant', arguments: {} } }))
    expect(response.status).toBe(200)
    const body = await response.json() as { result: { content: Array<{ text: string }> } }
    expect(JSON.parse(body.result.content[0].text)).toEqual({ id: 'merchant-a', slug: 'merchant-a' })
  })
})
