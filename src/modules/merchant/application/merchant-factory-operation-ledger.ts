import { createHash } from 'node:crypto'
import { z } from 'zod/v4'
import { prisma } from '@/lib/prisma'
import type { HumanMerchantActor } from '../domain/actor'
import { MerchantAccessError } from './merchant-access'
import { merchantDeliveryManifestV1Schema } from '../domain/merchant-delivery-factory-v1'

export const factoryOperationKind = z.enum([
  'CREATE_STORE_DRAFT', 'CREATE_CAMPAIGN_DRAFT',
  'CONFIGURE_STORE_DRAFT', 'CONFIGURE_CAMPAIGN_DRAFT',
  'SELECT_STORE_FRAMES', 'SELECT_CAMPAIGN_FRAMES', 'RESTORE_DRAFT',
])
const boundedId = z.string().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/)
const operationId = z.uuid()
export const factoryOperationReceiptSchema = z.strictObject({
  version: z.literal(1),
  status: z.enum(['DRAFT_STORE_CREATED_ONLY', 'DRAFT_CAMPAIGN_CREATED_ONLY',
    'DRAFT_STORE_CONFIGURATION_APPLIED', 'DRAFT_CAMPAIGN_CONFIGURATION_APPLIED',
    'DRAFT_SELECTION_APPLIED', 'DRAFT_RESTORED', 'ALREADY_MATCHED']),
  resourceId: boundedId,
  changedFields: z.array(z.string().min(1).max(80)).max(20).default([]),
  publicRender: z.literal('NOT_EXECUTED'),
  releaseReady: z.literal(false),
})
export type FactoryOperationReceipt = z.infer<typeof factoryOperationReceiptSchema>

export class MerchantFactoryOperationConflict extends Error {
  constructor(message = 'The Factory operation was already reserved or requires reconciliation.') {
    super(message)
    this.name = 'MerchantFactoryOperationConflict'
  }
}

/** Hash the normalized Manifest AND the exact target/revision into one immutable action identity. */
export function factoryOperationFingerprint(input: {
  merchantId: string
  action: z.infer<typeof factoryOperationKind>
  targetType: 'STORE' | 'CAMPAIGN'
  targetId: string
  expectedRevision: string
  manifest: unknown
}) {
  const canonical = merchantDeliveryManifestV1Schema.parse(input.manifest)
  return createHash('sha256').update(JSON.stringify({
    version: 1, merchantId: input.merchantId, action: input.action,
    targetType: input.targetType, targetId: input.targetId,
    expectedRevision: input.expectedRevision, manifest: canonical,
  })).digest('hex')
}

type OperationIdentity = {
  actor: HumanMerchantActor
  operationId: string
  action: z.infer<typeof factoryOperationKind>
  targetType: 'STORE' | 'CAMPAIGN'
  targetId: string
  expectedRevision: string
  manifest: unknown
}

function validate(input: OperationIdentity) {
  if (input.actor.actorType !== 'HUMAN' || !input.actor.membershipId) throw new MerchantAccessError()
  const id = operationId.parse(input.operationId)
  const kind = factoryOperationKind.parse(input.action)
  const targetId = boundedId.parse(input.targetId)
  return {
    merchantId: input.actor.merchantId, actorId: input.actor.actorId,
    operationId: id, action: kind, targetType: input.targetType, targetId,
    fingerprint: factoryOperationFingerprint({
      merchantId: input.actor.merchantId, action: kind, targetType: input.targetType,
      targetId, expectedRevision: input.expectedRevision, manifest: input.manifest,
    }),
  }
}

export async function reserveMerchantFactoryOperation(input: OperationIdentity) {
  const data = validate(input)
  try {
    await prisma.merchantFactoryOperation.create({ data: {
      ...data, status: 'IN_PROGRESS',
    } })
    return { kind: 'NEW' as const, fingerprint: data.fingerprint }
  } catch (error) {
    // Never hide connectivity/SQL faults as a known duplicate reservation.
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')) throw error
    const existing = await prisma.merchantFactoryOperation.findUnique({
      where: { merchantId_operationId: { merchantId: data.merchantId, operationId: data.operationId } },
      select: {
        actorId: true, action: true, targetType: true, targetId: true,
        fingerprint: true, status: true, receipt: true,
      },
    })
    if (!existing || existing.actorId !== data.actorId || existing.action !== data.action
      || existing.targetType !== data.targetType || existing.targetId !== data.targetId
      || existing.fingerprint !== data.fingerprint) throw new MerchantFactoryOperationConflict()
    if (existing.status === 'COMPLETED') {
      const receipt = factoryOperationReceiptSchema.safeParse(existing.receipt)
      if (!receipt.success) throw new MerchantFactoryOperationConflict()
      return { kind: 'REPLAY' as const, fingerprint: data.fingerprint, receipt: receipt.data }
    }
    // IN_PROGRESS may already have performed a canonical write before a crash.
    // Reject; operator must independently verify the business resource.
    throw new MerchantFactoryOperationConflict()
  }
}

export async function completeMerchantFactoryOperation(input: OperationIdentity & {
  receipt: unknown
}) {
  const data = validate(input)
  const receipt = factoryOperationReceiptSchema.parse(input.receipt)
  const updated = await prisma.merchantFactoryOperation.updateMany({
    where: {
      merchantId: data.merchantId, operationId: data.operationId,
      actorId: data.actorId, fingerprint: data.fingerprint, status: 'IN_PROGRESS',
    },
    data: { status: 'COMPLETED', receipt },
  })
  if (updated.count !== 1) throw new MerchantFactoryOperationConflict()
  return receipt
}
