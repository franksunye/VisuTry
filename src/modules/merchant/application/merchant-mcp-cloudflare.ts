import { createHash } from 'node:crypto'
import { getCloudflareSql } from '@/data/neon-cloudflare'
import { canonicalMcpResource } from './merchant-oauth-metadata'
import { assertTrustedMcpOrigin, McpOriginError } from './merchant-mcp-security-cloudflare'
import { authenticateMerchantAgentCredential } from './merchant-agent-credentials-cloudflare'
import { InvalidAgentCredentialError, normalizeMerchantAgentScopes } from '../domain/agent-credentials'
import type { AgentMerchantActor } from '../domain/actor'

export { assertTrustedMcpOrigin, canonicalMcpResource, InvalidAgentCredentialError, McpOriginError }

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function validDate(value: unknown): Date | null {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * OAuth tokens are stored as hashes. Keep this adapter on the direct-Neon
 * runtime so the MCP route does not fall back to the Prisma stub used by the
 * Cloudflare build.
 */
export async function authenticateMerchantOAuthAccessToken(rawToken: string, expectedResource: string): Promise<AgentMerchantActor> {
  const tokenHash = hashToken(rawToken)
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT at."id" AS "accessTokenId", at."expiresAt" AS "accessExpiresAt", at."revokedAt" AS "accessRevokedAt",
      a."id" AS "authorizationId", a."userId", a."merchantId", a."scopes", a."resource", a."status"
    FROM "MerchantOAuthAccessToken" at
    JOIN "MerchantOAuthAuthorization" a ON a."id" = at."authorizationId"
    WHERE at."tokenHash" = ${tokenHash}
    LIMIT 1
  `
  const row = rows[0]
  const expiresAt = validDate(row?.accessExpiresAt)
  if (
    !row ||
    row.accessRevokedAt != null ||
    !expiresAt ||
    expiresAt.getTime() <= Date.now() ||
    String(row.status) !== 'ACTIVE' ||
    String(row.resource) !== expectedResource
  ) {
    throw new InvalidAgentCredentialError()
  }

  await sql.transaction([
    sql`UPDATE "MerchantOAuthAccessToken" SET "lastUsedAt" = NOW() WHERE "id" = ${String(row.accessTokenId)}`,
    sql`UPDATE "MerchantOAuthAuthorization" SET "lastUsedAt" = NOW() WHERE "id" = ${String(row.authorizationId)}`,
  ])

  return {
    actorType: 'AGENT_OAUTH',
    actorId: String(row.accessTokenId),
    userId: String(row.userId),
    authorizationId: String(row.authorizationId),
    merchantId: String(row.merchantId),
    scopes: normalizeMerchantAgentScopes(Array.isArray(row.scopes) ? row.scopes.map(String) : []),
  }
}

export async function authenticateMerchantMcpBearer(rawToken: string, expectedResource: string) {
  if (rawToken.startsWith('vt_live_')) return authenticateMerchantAgentCredential(rawToken)
  return authenticateMerchantOAuthAccessToken(rawToken, expectedResource)
}
