import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { recordMerchantAgentOperation } from './merchant-agent-credentials'
import { getMerchantFactoryDryRun } from './merchant-delivery-factory-plan'
import type { HumanMerchantActor } from '../domain/actor'
import { merchantDeliveryManifestV1Schema } from '../domain/merchant-delivery-factory-v1'
import {
  MerchantFactoryCreateCampaignConflict, planFactoryDraftCampaignCreation,
} from '../domain/merchant-delivery-factory-create-campaign-v1'
import { createCampaignDraft } from '@/modules/store/application/campaign-service'

function digest(proposal: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(merchantDeliveryManifestV1Schema.parse(proposal)))
    .digest('hex')
}

async function readCandidate(input: {
  actor: HumanMerchantActor
  proposal: unknown
  slug: string
}) {
  if (input.actor.actorType !== 'HUMAN' || !input.actor.membershipId) throw new MerchantAccessError()
  const plan = await getMerchantFactoryDryRun(input)
  const target = planFactoryDraftCampaignCreation({ plan, proposal: input.proposal, slug: input.slug })
  const existing = await prisma.experience.findFirst({
    where: { merchantId: input.actor.merchantId, slug: target.slug },
    select: { id: true },
  })
  if (existing) throw new MerchantFactoryCreateCampaignConflict()
  return { target, manifestDigest: digest(input.proposal) }
}

export async function prepareMerchantFactoryDraftCampaignCreation(input: {
  actor: HumanMerchantActor
  proposal: unknown
  slug: string
}) {
  const { target, manifestDigest } = await readCandidate(input)
  return {
    version: 1 as const, status: 'HUMAN_APPROVAL_REQUIRED' as const,
    slug: target.slug, expectedCampaignAbsent: true as const, manifestDigest,
    reviewChanges: (['name', 'headline', 'description', 'presentationMode'] as const).map(field => ({
      field, before: null, after: target[field] ?? null,
    })),
    pending: target.pending,
    requiresHumanApproval: true as const,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}

export async function createMerchantFactoryDraftCampaign(input: {
  actor: HumanMerchantActor
  proposal: unknown
  slug: string
  manifestDigest: string
  expectedCampaignAbsent: true
}) {
  const { target, manifestDigest } = await readCandidate(input)
  if (manifestDigest !== input.manifestDigest || input.expectedCampaignAbsent !== true) {
    throw new MerchantFactoryCreateCampaignConflict()
  }
  // Canonical create enforces slug uniqueness and refuses a concurrent replay.
  const created = await createCampaignDraft({
    merchantId: input.actor.merchantId,
    slug: target.slug,
    name: target.name,
    headline: target.headline,
    description: target.description,
    presentationMode: target.presentationMode,
    factoryExpectAbsent: true,
  })
  if (created.status !== 'DRAFT' || created.slug !== target.slug) {
    throw new MerchantFactoryCreateCampaignConflict()
  }
  await recordMerchantAgentOperation({
    actor: input.actor, action: 'campaign.created', resourceType: 'Experience', resourceId: created.id,
  })
  return {
    version: 1 as const, status: 'DRAFT_CAMPAIGN_CREATED_ONLY' as const,
    campaignId: created.id, slug: created.slug, pending: target.pending,
    publicRender: 'NOT_EXECUTED' as const, releaseReady: false as const,
  }
}
