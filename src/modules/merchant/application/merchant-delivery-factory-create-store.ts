import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { createMerchantStore } from './merchant-onboarding'
import { getMerchantFactoryDryRun } from './merchant-delivery-factory-plan'
import type { HumanMerchantActor } from '../domain/actor'
import { merchantDeliveryManifestV1Schema } from '../domain/merchant-delivery-factory-v1'
import {
  MerchantFactoryCreateStoreConflict,
  planFactoryDraftStoreCreation,
} from '../domain/merchant-delivery-factory-create-store-v1'

function digest(proposal: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(merchantDeliveryManifestV1Schema.parse(proposal)))
    .digest('hex')
}

async function readCandidate(input: { actor: HumanMerchantActor; proposal: unknown }) {
  if (input.actor.actorType !== 'HUMAN' || !input.actor.membershipId) throw new MerchantAccessError()
  const plan = await getMerchantFactoryDryRun(input)
  const target = planFactoryDraftStoreCreation({ proposal: input.proposal, plan })
  // Fresh identity check: Plan must not make a second Store when an unrelated
  // Store record exists, even if the public Store selector returned null.
  const existing = await prisma.experience.findFirst({
    where: { merchantId: input.actor.merchantId, type: 'STORE' },
    select: { id: true },
  })
  if (existing) throw new MerchantFactoryCreateStoreConflict()
  return { target, digest: digest(input.proposal) }
}

/** No-store Human Owner preflight, does not create or select a Catalog item. */
export async function prepareMerchantFactoryDraftStoreCreation(input: {
  actor: HumanMerchantActor
  proposal: unknown
}) {
  const { target, digest: manifestDigest } = await readCandidate(input)
  return {
    version: 1 as const,
    status: 'HUMAN_APPROVAL_REQUIRED' as const,
    expectedStoreAbsent: true as const,
    manifestDigest,
    reviewChanges: (['name', 'headline', 'description'] as const).map(field => ({
      field, before: null, after: target[field],
    })),
    pending: target.pending,
    requiresHumanApproval: true as const,
    publicRender: 'NOT_EXECUTED' as const,
    releaseReady: false as const,
  }
}

/**
 * Creates ONLY a private Draft shell using canonical Merchant onboarding.
 * No frame selection, Journey/Delivery config, Brand, Campaign or publication.
 * A subsequent approved action must complete configuration and verify it.
 */
export async function createMerchantFactoryDraftStore(input: {
  actor: HumanMerchantActor
  proposal: unknown
  manifestDigest: string
  expectedStoreAbsent: true
}) {
  const { target, digest: actual } = await readCandidate(input)
  if (input.manifestDigest !== actual || input.expectedStoreAbsent !== true) {
    throw new MerchantFactoryCreateStoreConflict()
  }
  const created = await createMerchantStore({
    actor: input.actor,
    name: target.name,
    headline: target.headline ?? undefined,
    description: target.description ?? undefined,
  })
  if (!created.created || created.status !== 'DRAFT') {
    throw new MerchantFactoryCreateStoreConflict()
  }
  return {
    version: 1 as const,
    status: 'DRAFT_STORE_CREATED_ONLY' as const,
    storeId: created.id,
    pending: target.pending,
    publicRender: 'NOT_EXECUTED' as const,
    releaseReady: false as const,
  }
}
