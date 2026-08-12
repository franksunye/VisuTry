import { Prisma, type MerchantAgentCredentialStatus as PrismaCredentialStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireMerchantMembership, MerchantAccessError } from './merchant-access'
import {
  AgentCredentialLimitError,
  InvalidAgentCredentialError,
  LAST_USED_UPDATE_INTERVAL_MS,
  MAX_ACTIVE_MERCHANT_AGENT_CREDENTIALS,
  createAgentSecret,
  keyPrefixForSecret,
  normalizeMerchantAgentScopes,
  maskAgentSecret,
  verifyAgentSecret,
  type MerchantAgentScope,
} from '../domain/agent-credentials'
import type { AgentMerchantActor } from '../domain/actor'

const credentialMetadataSelect = {
  id: true,
  name: true,
  keyPrefix: true,
  scopes: true,
  status: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
} as const

type CredentialMetadataRow = {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  status: PrismaCredentialStatus
  createdAt: Date
  lastUsedAt: Date | null
  revokedAt: Date | null
}

export type MerchantAgentCredentialMetadata = Omit<CredentialMetadataRow, 'scopes' | 'keyPrefix'> & {
  scopes: MerchantAgentScope[]
  prefix: string
  masked: string
}

export type CreatedMerchantAgentCredential = {
  credential: MerchantAgentCredentialMetadata
  secret: string
}

export type AgentCredentialAuthentication = AgentMerchantActor

type AuditClient = {
  merchantOperationAudit: {
    create: (args: { data: {
      merchantId: string
      actorType: string
      actorId: string
      action: string
      resourceType: string
      resourceId?: string | null
      result: string
    } }) => Promise<unknown>
  }
}

function toMetadata(row: CredentialMetadataRow): MerchantAgentCredentialMetadata {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
    prefix: row.keyPrefix,
    masked: maskAgentSecret(row.keyPrefix),
    scopes: normalizeMerchantAgentScopes(row.scopes),
  }
}

function validateCredentialName(name: string): string {
  const normalized = name.trim()
  if (!normalized || normalized.length > 80) throw new Error('Credential name must be between 1 and 80 characters.')
  return normalized
}

async function requireCredentialManager(userId: string, merchantId: string) {
  return requireMerchantMembership({
    userId,
    merchantId,
    roles: ['OWNER', 'ADMIN'],
  })
}

async function recordAudit(input: {
  client?: AuditClient
  merchantId: string
  actorType: string
  actorId: string
  action: string
  resourceId?: string | null
  result?: string
}) {
  const client = input.client ?? (prisma as unknown as AuditClient)
  await client.merchantOperationAudit.create({
    data: {
      merchantId: input.merchantId,
      actorType: input.actorType,
      actorId: input.actorId,
      action: input.action,
      resourceType: 'MerchantAgentCredential',
      resourceId: input.resourceId ?? null,
      result: input.result ?? 'SUCCESS',
    },
  })
}

export async function createMerchantAgentCredential(input: {
  userId: string
  merchantId: string
  name: string
  scopes?: readonly string[] | null
}): Promise<CreatedMerchantAgentCredential> {
  await requireCredentialManager(input.userId, input.merchantId)
  const name = validateCredentialName(input.name)
  const scopes = normalizeMerchantAgentScopes(input.scopes)
  const generated = createAgentSecret()

  const created = await prisma.$transaction(async (tx) => {
    const activeCount = await tx.merchantAgentCredential.count({
      where: { merchantId: input.merchantId, status: 'ACTIVE' },
    })
    if (activeCount >= MAX_ACTIVE_MERCHANT_AGENT_CREDENTIALS) throw new AgentCredentialLimitError()

    const credential = await tx.merchantAgentCredential.create({
      data: {
        merchantId: input.merchantId,
        name,
        keyPrefix: generated.keyPrefix,
        secretHash: generated.secretHash,
        scopes,
        createdByUserId: input.userId,
      },
      select: credentialMetadataSelect,
    })
    await recordAudit({
      client: tx,
      merchantId: input.merchantId,
      actorType: 'HUMAN',
      actorId: input.userId,
      action: 'credential.created',
      resourceId: credential.id,
    })
    return credential
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return { credential: toMetadata(created as CredentialMetadataRow), secret: generated.secret }
}

export async function listMerchantAgentCredentials(input: {
  userId: string
  merchantId: string
}): Promise<MerchantAgentCredentialMetadata[]> {
  await requireCredentialManager(input.userId, input.merchantId)
  const rows = await prisma.merchantAgentCredential.findMany({
    where: { merchantId: input.merchantId },
    orderBy: { createdAt: 'desc' },
    select: credentialMetadataSelect,
  })
  return rows.map((row) => toMetadata(row as CredentialMetadataRow))
}

export async function rotateMerchantAgentCredential(input: {
  userId: string
  merchantId: string
  credentialId: string
}): Promise<CreatedMerchantAgentCredential> {
  await requireCredentialManager(input.userId, input.merchantId)
  const generated = createAgentSecret()

  const replacement = await prisma.$transaction(async (tx) => {
    const current = await tx.merchantAgentCredential.findFirst({
      where: { id: input.credentialId, merchantId: input.merchantId, status: 'ACTIVE' },
      select: { id: true, name: true, scopes: true },
    })
    if (!current) throw new MerchantAccessError()

    const next = await tx.merchantAgentCredential.create({
      data: {
        merchantId: input.merchantId,
        name: current.name,
        keyPrefix: generated.keyPrefix,
        secretHash: generated.secretHash,
        scopes: current.scopes,
        createdByUserId: input.userId,
        rotatedFromId: current.id,
      },
      select: credentialMetadataSelect,
    })
    await tx.merchantAgentCredential.update({
      where: { id: current.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    })
    await recordAudit({
      client: tx,
      merchantId: input.merchantId,
      actorType: 'HUMAN',
      actorId: input.userId,
      action: 'credential.rotated',
      resourceId: next.id,
    })
    return next
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return { credential: toMetadata(replacement as CredentialMetadataRow), secret: generated.secret }
}

export async function revokeMerchantAgentCredential(input: {
  userId: string
  merchantId: string
  credentialId: string
}): Promise<MerchantAgentCredentialMetadata> {
  await requireCredentialManager(input.userId, input.merchantId)

  const revoked = await prisma.$transaction(async (tx) => {
    const current = await tx.merchantAgentCredential.findFirst({
      where: { id: input.credentialId, merchantId: input.merchantId },
      select: credentialMetadataSelect,
    })
    if (!current) throw new MerchantAccessError()
    if (current.status === 'REVOKED') return current

    const row = await tx.merchantAgentCredential.update({
      where: { id: current.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
      select: credentialMetadataSelect,
    })
    await recordAudit({
      client: tx,
      merchantId: input.merchantId,
      actorType: 'HUMAN',
      actorId: input.userId,
      action: 'credential.revoked',
      resourceId: row.id,
    })
    return row
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return toMetadata(revoked as CredentialMetadataRow)
}

export async function authenticateMerchantAgentCredential(rawKey: string): Promise<AgentCredentialAuthentication> {
  const keyPrefix = keyPrefixForSecret(rawKey)
  if (!keyPrefix) throw new InvalidAgentCredentialError()

  const credential = await prisma.merchantAgentCredential.findUnique({
    where: { keyPrefix },
    select: {
      id: true,
      merchantId: true,
      secretHash: true,
      scopes: true,
      status: true,
      lastUsedAt: true,
    },
  })
  if (!credential || credential.status !== 'ACTIVE' || !verifyAgentSecret(rawKey, credential.secretHash)) {
    throw new InvalidAgentCredentialError()
  }

  if (!credential.lastUsedAt || Date.now() - credential.lastUsedAt.getTime() >= LAST_USED_UPDATE_INTERVAL_MS) {
    await prisma.merchantAgentCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    })
  }

  return {
    actorType: 'AGENT_CREDENTIAL',
    actorId: credential.id,
    merchantId: credential.merchantId,
    scopes: normalizeMerchantAgentScopes(credential.scopes),
  }
}

export async function recordMerchantAgentOperation(input: {
  actor: { actorType: string; actorId: string; merchantId: string }
  action: string
  resourceType: string
  resourceId?: string
  result?: 'SUCCESS' | 'FAILURE'
}): Promise<void> {
  await prisma.merchantOperationAudit.create({
    data: {
      merchantId: input.actor.merchantId,
      actorType: input.actor.actorType,
      actorId: input.actor.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      result: input.result ?? 'SUCCESS',
    },
  })
}
