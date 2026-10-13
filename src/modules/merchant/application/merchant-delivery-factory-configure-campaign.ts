import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { recordMerchantAgentOperation } from './merchant-agent-credentials'
import { getMerchantFactoryDryRun } from './merchant-delivery-factory-plan'
import { merchantDeliveryManifestV1Schema } from '../domain/merchant-delivery-factory-v1'
import { updateCampaign } from '@/modules/store/application/campaign-service'
import type { HumanMerchantActor } from '../domain/actor'
import {
  MerchantFactoryCampaignConfigConflict, planFactoryDraftCampaignConfiguration,
} from '../domain/merchant-delivery-factory-configure-campaign-v1'

const digest = (raw: unknown) => createHash('sha256')
  .update(JSON.stringify(merchantDeliveryManifestV1Schema.parse(raw))).digest('hex')

async function read(input: { actor: HumanMerchantActor; proposal: unknown; slug: string }) {
  if (input.actor.actorType !== 'HUMAN' || !input.actor.membershipId) throw new MerchantAccessError()
  const plan = await getMerchantFactoryDryRun({ actor: input.actor, proposal: input.proposal })
  const decision = planFactoryDraftCampaignConfiguration({
    proposal: input.proposal, plan, slug: input.slug,
  })
  const rows = await prisma.experience.findMany({
    where: { merchantId: input.actor.merchantId, type: 'CAMPAIGN', slug: input.slug },
    take: 2,
    select: {
      id: true, updatedAt: true, status: true, name: true, headline: true,
      description: true, presentationMode: true, journeyPolicy: true, deliveryPolicy: true,
    },
  })
  if (rows.length !== 1 || rows[0].status !== 'DRAFT') {
    throw new MerchantFactoryCampaignConfigConflict()
  }
  return { row: rows[0], decision, manifestDigest: digest(input.proposal) }
}

export async function prepareMerchantFactoryCampaignConfiguration(input: {
  actor: HumanMerchantActor; proposal: unknown; slug: string
}) {
  const { row, decision, manifestDigest } = await read(input)
  return {
    version: 1 as const, slug: input.slug, campaignId: row.id,
    expectedUpdatedAt: row.updatedAt.toISOString(), manifestDigest,
    status: decision.noChange ? 'ALREADY_MATCHED' as const : 'HUMAN_APPROVAL_REQUIRED' as const,
    reviewChanges: decision.changedFields.map(field => ({
      field, before: row[field] ?? null, after: decision.patch[field] ?? null,
    })),
    requiresHumanApproval: !decision.noChange,
    pending: ['selectedFrameIds'] as const,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}

export async function applyMerchantFactoryCampaignConfiguration(input: {
  actor: HumanMerchantActor; proposal: unknown; slug: string
  expectedCampaignId: string; expectedUpdatedAt: string; manifestDigest: string
}) {
  const { row, decision, manifestDigest } = await read(input)
  if (input.expectedCampaignId !== row.id
    || input.expectedUpdatedAt !== row.updatedAt.toISOString()
    || input.manifestDigest !== manifestDigest) {
    throw new MerchantFactoryCampaignConfigConflict()
  }
  if (decision.noChange) {
    return {
      version: 1 as const, status: 'ALREADY_MATCHED' as const,
      campaignId: row.id, publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
    }
  }
  // Existing canonical Campaign policy/copy service, guarded under #410
  // same-transaction exact DRAFT+revision check; no direct Prisma writes.
  await updateCampaign({
    merchantId: input.actor.merchantId, campaignId: row.id,
    ...decision.patch,
    factoryDraftOnly: true, expectedUpdatedAt: input.expectedUpdatedAt,
  })
  await recordMerchantAgentOperation({
    actor: input.actor, action: 'campaign.updated',
    resourceType: 'Experience', resourceId: row.id,
  })
  return {
    version: 1 as const, status: 'DRAFT_CAMPAIGN_CONFIGURATION_APPLIED' as const,
    campaignId: row.id, changedFields: decision.changedFields,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}
