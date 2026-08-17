import { getCloudflareSql } from '@/data/neon-cloudflare'
import { requireMerchantMembership, MerchantAccessError } from './merchant-access-cloudflare'
import {
  AgentCredentialLimitError,
  InvalidAgentCredentialError,
  LAST_USED_UPDATE_INTERVAL_MS,
  MAX_ACTIVE_MERCHANT_AGENT_CREDENTIALS,
  createAgentSecret,
  keyPrefixForSecret,
  maskAgentSecret,
  normalizeMerchantAgentScopes,
  verifyAgentSecret,
  type MerchantAgentScope,
} from '../domain/agent-credentials'
import type { AgentMerchantActor } from '../domain/actor'

type Row = Record<string, unknown>

export type MerchantAgentCredentialMetadata = {
  id: string
  name: string
  status: 'ACTIVE' | 'REVOKED'
  createdAt: Date
  lastUsedAt: Date | null
  revokedAt: Date | null
  prefix: string
  masked: string
  scopes: MerchantAgentScope[]
}

export type CreatedMerchantAgentCredential = { credential: MerchantAgentCredentialMetadata; secret: string }
export type AgentCredentialAuthentication = AgentMerchantActor

const credentialColumns = '"id", "name", "keyPrefix", "scopes", "status", "createdAt", "lastUsedAt", "revokedAt"'

function dateValue(value: unknown): Date | null {
  return value == null ? null : value instanceof Date ? value : new Date(String(value))
}

function mapCredential(row: Row): MerchantAgentCredentialMetadata {
  const prefix = String(row.keyPrefix)
  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status) === 'ACTIVE' ? 'ACTIVE' : 'REVOKED',
    createdAt: dateValue(row.createdAt) ?? new Date(0),
    lastUsedAt: dateValue(row.lastUsedAt),
    revokedAt: dateValue(row.revokedAt),
    prefix,
    masked: maskAgentSecret(prefix),
    scopes: normalizeMerchantAgentScopes(Array.isArray(row.scopes) ? row.scopes.map(String) : []),
  }
}

function validateCredentialName(name: string): string {
  const normalized = name.trim()
  if (!normalized || normalized.length > 80) throw new Error('Credential name must be between 1 and 80 characters.')
  return normalized
}

export async function listMerchantAgentCredentials(input: { userId: string; merchantId: string }): Promise<MerchantAgentCredentialMetadata[]> {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT ${sql.unsafe(credentialColumns)}
    FROM "MerchantAgentCredential"
    WHERE "merchantId" = ${input.merchantId}
    ORDER BY "createdAt" DESC
  `
  return rows.map(mapCredential)
}

export async function createMerchantAgentCredential(input: { userId: string; merchantId: string; name: string; scopes?: readonly string[] | null }): Promise<CreatedMerchantAgentCredential> {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  const name = validateCredentialName(input.name)
  const scopes = normalizeMerchantAgentScopes(input.scopes)
  const generated = createAgentSecret()
  const id = globalThis.crypto?.randomUUID?.() ?? `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  const sql = getCloudflareSql()
  const rows = await sql`
    WITH inserted AS (
      INSERT INTO "MerchantAgentCredential" ("id", "merchantId", "name", "keyPrefix", "secretHash", "scopes", "createdByUserId", "createdAt", "updatedAt")
      SELECT ${id}, ${input.merchantId}, ${name}, ${generated.keyPrefix}, ${generated.secretHash}, ${scopes}, ${input.userId}, NOW(), NOW()
      WHERE (SELECT count(*) FROM "MerchantAgentCredential" WHERE "merchantId" = ${input.merchantId} AND "status" = 'ACTIVE') < ${MAX_ACTIVE_MERCHANT_AGENT_CREDENTIALS}
      RETURNING ${sql.unsafe(credentialColumns)}
    ), audited AS (
      INSERT INTO "MerchantOperationAudit" ("id", "merchantId", "actorType", "actorId", "action", "resourceType", "resourceId", "result")
      SELECT ${globalThis.crypto?.randomUUID?.() ?? `cf-audit-${Date.now().toString(36)}`}, ${input.merchantId}, 'HUMAN', ${input.userId}, 'credential.created', 'MerchantAgentCredential', "id", 'SUCCESS'
      FROM inserted
    )
    SELECT * FROM inserted
  `
  if (!rows[0]) throw new AgentCredentialLimitError()
  return { credential: mapCredential(rows[0]), secret: generated.secret }
}

export async function rotateMerchantAgentCredential(input: { userId: string; merchantId: string; credentialId: string }): Promise<CreatedMerchantAgentCredential> {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  const sql = getCloudflareSql()
  const currentRows = await sql`
    SELECT "id", "name", "scopes"
    FROM "MerchantAgentCredential"
    WHERE "id" = ${input.credentialId} AND "merchantId" = ${input.merchantId} AND "status" = 'ACTIVE'
    LIMIT 1
  `
  const current = currentRows[0]
  if (!current) throw new MerchantAccessError()
  const generated = createAgentSecret()
  const nextId = globalThis.crypto?.randomUUID?.() ?? `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  const auditId = globalThis.crypto?.randomUUID?.() ?? `cf-audit-${Date.now().toString(36)}`
  const rows = await sql.transaction([
    sql`
      INSERT INTO "MerchantAgentCredential" ("id", "merchantId", "name", "keyPrefix", "secretHash", "scopes", "createdByUserId", "rotatedFromId", "createdAt", "updatedAt")
      VALUES (${nextId}, ${input.merchantId}, ${String(current.name)}, ${generated.keyPrefix}, ${generated.secretHash}, ${current.scopes}, ${input.userId}, ${input.credentialId}, NOW(), NOW())
      RETURNING ${sql.unsafe(credentialColumns)}
    `,
    sql`UPDATE "MerchantAgentCredential" SET "status" = 'REVOKED', "revokedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = ${input.credentialId}`,
    sql`INSERT INTO "MerchantOperationAudit" ("id", "merchantId", "actorType", "actorId", "action", "resourceType", "resourceId", "result") VALUES (${auditId}, ${input.merchantId}, 'HUMAN', ${input.userId}, 'credential.rotated', 'MerchantAgentCredential', ${nextId}, 'SUCCESS')`,
  ], { isolationLevel: 'Serializable' })
  const created = rows[0]?.[0]
  if (!created) throw new Error('Cloudflare credential rotation returned no credential')
  return { credential: mapCredential(created), secret: generated.secret }
}

export async function revokeMerchantAgentCredential(input: { userId: string; merchantId: string; credentialId: string }): Promise<MerchantAgentCredentialMetadata> {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  const sql = getCloudflareSql()
  const currentRows = await sql`
    SELECT ${sql.unsafe(credentialColumns)}
    FROM "MerchantAgentCredential"
    WHERE "id" = ${input.credentialId} AND "merchantId" = ${input.merchantId}
    LIMIT 1
  `
  const current = currentRows[0]
  if (!current) throw new MerchantAccessError()
  if (String(current.status) === 'REVOKED') return mapCredential(current)
  const auditId = globalThis.crypto?.randomUUID?.() ?? `cf-audit-${Date.now().toString(36)}`
  const rows = await sql.transaction([
    sql`UPDATE "MerchantAgentCredential" SET "status" = 'REVOKED', "revokedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = ${input.credentialId} RETURNING ${sql.unsafe(credentialColumns)}`,
    sql`INSERT INTO "MerchantOperationAudit" ("id", "merchantId", "actorType", "actorId", "action", "resourceType", "resourceId", "result") VALUES (${auditId}, ${input.merchantId}, 'HUMAN', ${input.userId}, 'credential.revoked', 'MerchantAgentCredential', ${input.credentialId}, 'SUCCESS')`,
  ], { isolationLevel: 'Serializable' })
  const revoked = rows[0]?.[0]
  if (!revoked) throw new Error('Cloudflare credential revoke returned no credential')
  return mapCredential(revoked)
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
  if (!credential || String(credential.status) !== 'ACTIVE' || !verifyAgentSecret(rawKey, String(credential.secretHash))) throw new InvalidAgentCredentialError()
  void LAST_USED_UPDATE_INTERVAL_MS
  return {
    actorType: 'AGENT_CREDENTIAL',
    actorId: String(credential.id),
    merchantId: String(credential.merchantId),
    scopes: normalizeMerchantAgentScopes(Array.isArray(credential.scopes) ? credential.scopes.map(String) : []),
  }
}

export async function recordMerchantAgentOperation(input: { actor: { actorType: string; actorId: string; merchantId: string }; action: string; resourceType: string; resourceId?: string; result?: 'SUCCESS' | 'FAILURE' }): Promise<void> {
  const sql = getCloudflareSql()
  const id = globalThis.crypto?.randomUUID?.() ?? `cf-audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  await sql`
    INSERT INTO "MerchantOperationAudit" ("id", "merchantId", "actorType", "actorId", "action", "resourceType", "resourceId", "result")
    VALUES (${id}, ${input.actor.merchantId}, ${input.actor.actorType}, ${input.actor.actorId}, ${input.action}, ${input.resourceType}, ${input.resourceId ?? null}, ${input.result ?? 'SUCCESS'})
  `
}

export { InvalidAgentCredentialError, MerchantAccessError }
