import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { validateMerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import { recordMerchantAgentOperation } from './merchant-agent-credentials'
import { getMerchantFactoryDryRun } from './merchant-delivery-factory-plan'
import { setMerchantStoreFrames } from './merchant-onboarding'
import { setCampaignFrames } from '@/modules/store/application/campaign-service'
import type { HumanMerchantActor } from '../domain/actor'
import { merchantDeliveryManifestV1Schema } from '../domain/merchant-delivery-factory-v1'
import {
  MerchantFactorySelectionConflict, planFactoryDraftSelection,
  type MerchantFactorySelectionTarget,
} from '../domain/merchant-delivery-factory-selection-v1'

function digest(input: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(merchantDeliveryManifestV1Schema.parse(input)))
    .digest('hex')
}
function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

async function readSelection(input: {
  actor: HumanMerchantActor
  proposal: unknown
  target: MerchantFactorySelectionTarget
}) {
  if (input.actor.actorType !== 'HUMAN' || !input.actor.membershipId) throw new MerchantAccessError()
  const plan = await getMerchantFactoryDryRun(input)
  const decision = planFactoryDraftSelection({ plan, proposal: input.proposal, target: input.target })
  const rows = await prisma.experience.findMany({
    where: {
      merchantId: input.actor.merchantId,
      type: input.target.type,
      ...(input.target.type === 'CAMPAIGN' ? { slug: input.target.slug } : {}),
    },
    select: {
      id: true, status: true, updatedAt: true,
      frames: { where: { active: true }, orderBy: { sortOrder: 'asc' }, select: { merchantFrameId: true } },
    },
    take: 2,
  })
  if (rows.length !== 1 || rows[0].status !== 'DRAFT') {
    throw new MerchantFactorySelectionConflict()
  }
  if (input.target.type === 'CAMPAIGN' && decision.desiredFrameIds.length) {
    // Match canonical Campaign selection: ACTIVE alone is not enough for a
    // recommended product. Unlike Store display, Campaign requires full
    // recommendation readiness (including shape/enrichment).
    const candidates = await prisma.merchantFrame.findMany({
      where: {
        merchantId: input.actor.merchantId, id: { in: decision.desiredFrameIds }, status: 'ACTIVE',
      },
      select: {
        id: true, sku: true, externalId: true, name: true, imageUrl: true,
        productUrl: true, shape: true, source: true, status: true, enrichmentStatus: true,
      },
    })
    if (candidates.length !== decision.desiredFrameIds.length
      || candidates.some(frame => !validateMerchantFrameReadiness(frame).valid)) {
      throw new MerchantFactorySelectionConflict()
    }
  }
  const before = rows[0].frames.map(row => row.merchantFrameId)
  if (decision.noChange !== sameIds(before, decision.desiredFrameIds)) {
    throw new MerchantFactorySelectionConflict()
  }
  return { decision, row: rows[0], before, manifestDigest: digest(input.proposal) }
}

export async function prepareMerchantFactoryDraftSelection(input: {
  actor: HumanMerchantActor
  proposal: unknown
  target: MerchantFactorySelectionTarget
}) {
  const { decision, row, before, manifestDigest } = await readSelection(input)
  return {
    version: 1 as const,
    status: decision.noChange ? 'ALREADY_MATCHED' as const : 'HUMAN_APPROVAL_REQUIRED' as const,
    expectedExperienceId: row.id,
    expectedUpdatedAt: row.updatedAt.toISOString(),
    manifestDigest,
    target: decision.target,
    reviewChanges: decision.noChange ? [] : [{
      field: 'selectedFrameIds' as const, before, after: decision.desiredFrameIds,
    }],
    requiresHumanApproval: !decision.noChange,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}

export async function applyMerchantFactoryDraftSelection(input: {
  actor: HumanMerchantActor
  proposal: unknown
  target: MerchantFactorySelectionTarget
  expectedExperienceId: string
  expectedUpdatedAt: string
  manifestDigest: string
}) {
  const { decision, row, manifestDigest } = await readSelection(input)
  if (input.expectedExperienceId !== row.id || input.expectedUpdatedAt !== row.updatedAt.toISOString()
    || input.manifestDigest !== manifestDigest) {
    throw new MerchantFactorySelectionConflict()
  }
  if (decision.noChange) {
    return {
      version: 1 as const, status: 'ALREADY_MATCHED' as const, experienceId: row.id,
      publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
    }
  }
  // Both canonical selection implementations validate owned ACTIVE products;
  // the shared Prisma transaction rechecks exact Draft revision and archive
  // races under Merchant → MerchantFrame → Experience row locks.
  if (decision.target.type === 'STORE') {
    await setMerchantStoreFrames({
      actor: input.actor, storeId: row.id, frameIds: decision.desiredFrameIds,
      factoryDraftOnly: true, expectedUpdatedAt: input.expectedUpdatedAt,
    })
  } else {
    await setCampaignFrames({
      merchantId: input.actor.merchantId, campaignId: row.id,
      frameIds: decision.desiredFrameIds,
      factoryDraftOnly: true, expectedUpdatedAt: input.expectedUpdatedAt,
    })
    await recordMerchantAgentOperation({
      actor: input.actor, action: 'campaign.frames_updated',
      resourceType: 'Experience', resourceId: row.id,
    })
  }
  return {
    version: 1 as const, status: 'DRAFT_SELECTION_APPLIED' as const,
    experienceId: row.id, selectedFrameIds: decision.desiredFrameIds,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}
