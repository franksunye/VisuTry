import { getCloudflareSql } from '@/data/neon-cloudflare'
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

function newRecordId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export async function consumeMerchantAgentMcpRequest(input: { actor: AgentMerchantActor; now?: Date; limit?: number }): Promise<void> {
  const now = input.now ?? new Date()
  const windowStart = new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS)
  const rateLimitIdentity = input.actor.actorType === 'AGENT_OAUTH' ? input.actor.authorizationId : input.actor.actorId
  const bucket = `agent_mcp:${rateLimitIdentity}`
  const sql = getCloudflareSql()
  const rows = await sql`
    INSERT INTO "StoreAbuseCounter" ("id", "merchantId", "bucket", "windowStart", "count", "bytes", "createdAt", "updatedAt")
    VALUES (${newRecordId()}, ${input.actor.merchantId}, ${bucket}, ${windowStart}, 1, 0, NOW(), NOW())
    ON CONFLICT ("merchantId", "bucket", "windowStart") DO UPDATE SET "count" = "StoreAbuseCounter"."count" + 1, "updatedAt" = NOW()
    RETURNING "count"
  `
  const count = Number(rows[0]?.count ?? 0)
  const limit = input.limit ?? MERCHANT_AGENT_MCP_REQUESTS_PER_MINUTE
  if (count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + WINDOW_MS - now.getTime()) / 1000))
    throw new AgentRateLimitError(retryAfterSeconds)
  }
}
