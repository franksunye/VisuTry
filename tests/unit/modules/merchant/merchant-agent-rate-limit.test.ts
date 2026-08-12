jest.mock('@/lib/prisma', () => ({
  prisma: { storeAbuseCounter: { upsert: jest.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { AgentRateLimitError, consumeMerchantAgentMcpRequest } from '@/modules/merchant/application/merchant-agent-rate-limit'

const upsert = prisma.storeAbuseCounter.upsert as jest.Mock
const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: [] as never[] }

describe('merchant MCP rate limit', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses a credential-scoped agent bucket', async () => {
    upsert.mockResolvedValue({ count: 60 })
    await expect(consumeMerchantAgentMcpRequest({ actor })).resolves.toBeUndefined()
    expect(upsert.mock.calls[0][0].create.bucket).toBe('agent_mcp:credential-a')
    expect(upsert.mock.calls[0][0].create.merchantId).toBe('merchant-a')
  })

  it('returns the stable rate-limit error after the limit', async () => {
    upsert.mockResolvedValue({ count: 61 })
    await expect(consumeMerchantAgentMcpRequest({ actor, now: new Date('2026-08-12T00:00:30.000Z') })).rejects.toBeInstanceOf(AgentRateLimitError)
  })
})
