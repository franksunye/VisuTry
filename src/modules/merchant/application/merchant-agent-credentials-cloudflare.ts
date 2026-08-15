import { getCloudflareSql } from '@/data/neon-cloudflare'
import { requireMerchantMembership, MerchantAccessError } from './merchant-access-cloudflare'
import {
  InvalidAgentCredentialError,
  LAST_USED_UPDATE_INTERVAL_MS,
  keyPrefixForSecret,
  maskAgentSecret,
  normalizeMerchantAgentScopes,
  verifyAgentSecret,
  type MerchantAgentScope,
} from '../domain/agent-credentials'
import type { AgentMerchantActor } from '../domain/actor'

export type MerchantAgentCredentialMetadata = {
  id: string
  name: string
  status: string
  createdAt: Date
  lastUsedAt: Date | null
  revokedAt: Date | null
  prefix: string
  masked: string
  scopes: MerchantAgentScope[]
}

export type CreatedMerchantAgentCredential = { credential: MerchantAgentCredentialMetadata; secret: string }
export type AgentCredentialAuthentication = AgentMerchantActor

function dateValue(value: unknown): Date | null {
  return value == null ? null : value instanceof Date ? value : new Date(String(value))
}

function mapCredential(row: Record<string, unknown>): MerchantAgentCredentialMetadata {
  const prefix = String(row.keyPrefix)
  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status),
    createdAt: dateValue(row.createdAt) ?? new Date(0),
    lastUsedAt: dateValue(row.lastUsedAt),
    revokedAt: dateValue(row.revokedAt),
    prefix,
    masked: maskAgentSecret(prefix),
    scopes: normalizeMerchantAgentScopes(Array.isArray(row.scopes) ? row.scopes.map(String) : []),
  }
}

export async function listMerchantAgentCredentials(input: { userId: string; merchantId: string }): Promise<MerchantAgentCredentialMetadata[]> {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "keyPrefix", "scopes", "status", "createdAt", "lastUsedAt", "revokedAt"
    FROM "MerchantAgentCredential"
    WHERE "merchantId" = ${input.merchantId}
    ORDER BY "createdAt" DESC
  `
  return rows.map(mapCredential)
}

export async function authenticateMerchantAgentCredential(rawKey: string): Promise<AgentCredentialAuthentication> {
  const keyPrefix = keyPrefixForSecret(rawKey)
  if (!keyPrefix) throw new InvalidAgentCredentialError()
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "merchantId", "secretHash", "scopes", "status", "lastUsedAt"
    FROM "MerchantAgentCredential"
    WHERE "keyPrefix" = ${keyPrefix}
    LIMIT 1
  `
  const credential = rows[0]
  if (!credential || String(credential.status) !== 'ACTIVE' || !verifyAgentSecret(rawKey, String(credential.secretHash))) {
    throw new InvalidAgentCredentialError()
  }
  // lastUsedAt is intentionally not updated in B1; this is a later write path.
  void LAST_USED_UPDATE_INTERVAL_MS
  return {
    actorType: 'AGENT_CREDENTIAL',
    actorId: String(credential.id),
    merchantId: String(credential.merchantId),
    scopes: normalizeMerchantAgentScopes(Array.isArray(credential.scopes) ? credential.scopes.map(String) : []),
  }
}

function unsupportedWrite(method: string): never {
  throw new Error(`Cloudflare merchant credential ${method} is deferred to the write phase`)
}

export async function createMerchantAgentCredential(_input: { userId: string; merchantId: string; name: string; scopes?: readonly string[] | null }): Promise<CreatedMerchantAgentCredential> {
  return unsupportedWrite('create')
}
export async function rotateMerchantAgentCredential(_input: { userId: string; merchantId: string; credentialId: string }): Promise<CreatedMerchantAgentCredential> {
  return unsupportedWrite('rotate')
}
export async function revokeMerchantAgentCredential(_input: { userId: string; merchantId: string; credentialId: string }): Promise<MerchantAgentCredentialMetadata> {
  return unsupportedWrite('revoke')
}
export async function recordMerchantAgentOperation(_input: { actor: { actorType: string; actorId: string; merchantId: string }; action: string; resourceType: string; resourceId?: string; result?: 'SUCCESS' | 'FAILURE' }): Promise<void> {
  return unsupportedWrite('audit')
}

export { InvalidAgentCredentialError, MerchantAccessError }
