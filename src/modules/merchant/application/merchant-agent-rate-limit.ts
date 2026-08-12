import { prisma } from '@/lib/prisma'
import type { AgentMerchantActor } from '../domain/actor'

export const MERCHANT_AGENT_MCP_REQUESTS_PER_MINUTE = 60
const WINDOW_MS = 60_000

export class AgentRateLimitError extends Error {
  readonly code = 'AGENT_RATE_LIMITED'
  readonly httpStatus = 429
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds = 60) {
    super('Agent request rate limit exceeded.')
    this.name = 'AgentRateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function minuteWindowStart(now = new Date()): Date {
  return new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS)
}

export async function consumeMerchantAgentMcpRequest(input: {
  actor: AgentMerchantActor
  now?: Date
  limit?: number
}): Promise<void> {
  const now = input.now ?? new Date()
  const windowStart = minuteWindowStart(now)
  const row = await prisma.storeAbuseCounter.upsert({
    where: {
      merchantId_bucket_windowStart: {
        merchantId: input.actor.merchantId,
        bucket: `agent_mcp:${input.actor.actorId}`,
        windowStart,
      },
    },
    create: {
      merchantId: input.actor.merchantId,
      bucket: `agent_mcp:${input.actor.actorId}`,
      windowStart,
      count: 1,
      bytes: 0,
    },
    update: { count: { increment: 1 } },
    select: { count: true },
  })

  const limit = input.limit ?? MERCHANT_AGENT_MCP_REQUESTS_PER_MINUTE
  if (row.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + WINDOW_MS - now.getTime()) / 1000))
    throw new AgentRateLimitError(retryAfterSeconds)
  }
}
