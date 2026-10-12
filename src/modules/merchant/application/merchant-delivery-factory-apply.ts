import { createHash } from 'node:crypto'
import { merchantDeliveryManifestV1Schema } from '../domain/merchant-delivery-factory-v1'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { getMerchantFactoryDryRun } from './merchant-delivery-factory-plan'
import { updateMerchantStore } from './merchant-onboarding'
import type { HumanMerchantActor } from '../domain/actor'
import {
  MerchantFactoryApplyError,
  planFactoryDraftStoreApplyV1,
} from '../domain/merchant-delivery-factory-apply-v1'

/**
 * The Prepare response binds one strict canonical Manifest to one exact
 * tenant-owned Draft Store revision; neither the Manifest nor a stale Plan
 * grants write authority on its own.
 */
function manifestDigest(proposal: unknown): string {
  const manifest = merchantDeliveryManifestV1Schema.parse(proposal)
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex')
}

async function readDraftStoreApplyCandidate(input: {
  actor: HumanMerchantActor
  proposal: unknown
}) {
  if (input.actor.actorType !== 'HUMAN' || !input.actor.membershipId) {
    throw new MerchantAccessError()
  }
  const plan = await getMerchantFactoryDryRun({ actor: input.actor, proposal: input.proposal })
  const decision = planFactoryDraftStoreApplyV1({ proposal: input.proposal, plan })
  // An ambiguous identity must not silently fall back to the latest Store.
  const stores = await prisma.experience.findMany({
    where: { merchantId: input.actor.merchantId, type: 'STORE' },
    select: { id: true, status: true, updatedAt: true },
    take: 2,
  })
  if (stores.length !== 1 || stores[0].status !== 'DRAFT') {
    throw new MerchantFactoryApplyError('An unambiguous existing Draft Store is required.')
  }
  return { decision, store: stores[0], manifestDigest: manifestDigest(input.proposal) }
}

/** Side-effect-free, explicitly scoped Human approval preview. */
export async function prepareMerchantFactoryDraftStoreV1(input: {
  actor: HumanMerchantActor
  proposal: unknown
}) {
  const { decision, store, manifestDigest: digest } = await readDraftStoreApplyCandidate(input)
  return {
    version: 1 as const,
    status: decision.noChange ? 'ALREADY_MATCHED' as const : 'HUMAN_APPROVAL_REQUIRED' as const,
    storeId: store.id, expectedStoreUpdatedAt: store.updatedAt.toISOString(),
    manifestDigest: digest, changedFields: decision.changedFields,
    requiresHumanApproval: !decision.noChange,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}

/**
 * Writes only closed platform policy/copy for one DRAFT Store. Both the
 * canonical Manifest digest and current database revision must match the
 * explicit Human approval request. Never performs bulk Factory Apply.
 */
export async function applyMerchantFactoryDraftStoreV1(input: {
  actor: HumanMerchantActor
  proposal: unknown
  expectedStoreUpdatedAt: string
  expectedStoreId: string
  manifestDigest: string
}) {
  const { decision, store, manifestDigest: digest } = await readDraftStoreApplyCandidate(input)
  if (input.expectedStoreId !== store.id) {
    throw new MerchantFactoryApplyError('FACTORY_APPROVAL_TARGET_MISMATCH')
  }
  if (input.manifestDigest !== digest) {
    throw new MerchantFactoryApplyError('FACTORY_APPROVAL_MANIFEST_MISMATCH')
  }
  if (store.updatedAt.toISOString() !== input.expectedStoreUpdatedAt) {
    throw new MerchantFactoryApplyError('FACTORY_DRAFT_STORE_STALE_REVISION')
  }
  if (decision.noChange) {
    return {
      version: 1 as const, status: 'ALREADY_MATCHED' as const,
      changedFields: [] as string[], storeId: store.id,
      publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
    }
  }

  // Canonical business write includes activation/audit and public-discovery
  // invalidation. Transactional row lock + optimistic revision check prevent
  // write-after-preview and ACTIVE Store mutations (including interleavings).
  await updateMerchantStore({
    actor: input.actor,
    storeId: store.id,
    ...decision.store,
    factoryDraftOnly: true,
    expectedUpdatedAt: input.expectedStoreUpdatedAt,
  })
  return {
    version: 1 as const, status: 'DRAFT_STORE_CONFIGURATION_APPLIED' as const,
    changedFields: decision.changedFields, storeId: store.id,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}
