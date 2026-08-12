import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod/v4'
import {
  merchantOnboarding,
  MerchantOnboardingError,
  type CatalogFrameInput,
} from '../application/merchant-onboarding'
import { MerchantAccessError } from '../application/merchant-access'
import { AgentRateLimitError } from '../application/merchant-agent-rate-limit'
import { recordMerchantAgentOperation } from '../application/merchant-agent-credentials'
import { AgentScopeError, InvalidAgentCredentialError } from '../domain/agent-credentials'
import { requireAgentScope, type AgentMerchantActor } from '../domain/actor'
import {
  archiveCampaign,
  CampaignServiceError,
  createCampaignDraft,
  getCampaign,
  listCampaigns,
  previewCampaign,
  publishCampaign,
  setCampaignFrames,
  updateCampaign,
} from '@/modules/store/application/campaign-service'

const frameInput = z.object({
  sku: z.string().min(1).max(120),
  name: z.string().min(1).max(240),
  brand: z.string().max(120).nullable().optional(),
  variant: z.string().max(120).nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  productUrl: z.string().max(2000).nullable().optional(),
  price: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().max(8).nullable().optional(),
  shape: z.string().min(1).max(80),
  material: z.string().max(120).nullable().optional(),
  color: z.string().max(120).nullable().optional(),
  widthClass: z.string().max(80).nullable().optional(),
  styleTags: z.array(z.string().max(80)).max(20).optional(),
  collectionTags: z.array(z.string().max(80)).max(20).optional(),
})

const campaignObjective = z.enum(['TRAFFIC', 'INTENT', 'LEAD'])
const campaignGate = z.enum(['NONE', 'OPT_IN_AFTER_VALUE', 'OPT_IN_BEFORE_AI'])
const presentationMode = z.enum(['ACTION_FIRST', 'PRODUCT_FIRST', 'EDITORIAL_FIRST'])
const campaignId = z.string().min(1).max(120)
const campaignDate = z.string().max(80).nullable().optional()

function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] }
}

function errorResult(error: unknown) {
  if (error instanceof MerchantAccessError) return { code: 'RESOURCE_NOT_FOUND', message: 'The requested merchant resource was not found.' }
  if (error instanceof InvalidAgentCredentialError) return { code: error.code, message: error.message }
  if (error instanceof AgentScopeError) return { code: error.code, message: error.message }
  if (error instanceof AgentRateLimitError) return { code: error.code, message: error.message, retryAfterSeconds: error.retryAfterSeconds }
  if (error instanceof MerchantOnboardingError) return { code: error.code, message: error.message }
  if (error instanceof CampaignServiceError) return { code: error.code, message: error.message }
  return { code: 'INTERNAL_ERROR', message: 'The merchant operation could not be completed.' }
}

async function safe<T>(work: () => Promise<T>) {
  try {
    return result(await work())
  } catch (error) {
    return { ...result(errorResult(error)), isError: true }
  }
}

async function auditedCampaignMutation<T>(input: {
  actor: AgentMerchantActor
  action: string
  resourceId?: string
  work: () => Promise<T>
}): Promise<T> {
  const value = await input.work()
  await recordMerchantAgentOperation({
    actor: input.actor,
    action: input.action,
    resourceType: 'Experience',
    resourceId: input.resourceId ?? (value as { id?: string }).id,
  })
  return value
}

export function createMerchantMcpServer(actor: AgentMerchantActor) {
  const server = new McpServer({ name: 'visutry-merchant-self-service', version: '1.0.0' })

  server.registerTool('get_onboarding_status', {
    title: 'Get onboarding status',
    description: 'Read the authenticated merchant onboarding checklist, catalog counts, Store state, and blockers.',
    inputSchema: {},
  }, async () => safe(() => merchantOnboarding.getOnboardingStatus({ actor })))

  server.registerTool('get_merchant', {
    title: 'Get merchant',
    description: 'Read the authenticated merchant profile. The merchant is derived from the credential; no merchantId is accepted.',
    inputSchema: {},
  }, async () => safe(() => merchantOnboarding.getMerchant({ actor })))

  server.registerTool('list_frames', {
    title: 'List frames',
    description: 'List the authenticated merchant catalog with deterministic validation status.',
    inputSchema: { cursor: z.string().optional(), limit: z.number().int().min(1).max(100).optional() },
  }, async ({ cursor, limit }) => safe(() => merchantOnboarding.listMerchantFrames({ actor, cursor, limit })))

  server.registerTool('import_frames', {
    title: 'Import frames',
    description: 'Create or update up to 100 structured catalog frames, idempotently by merchant SKU. This never deletes frames.',
    inputSchema: { frames: z.array(frameInput).min(1).max(100) },
  }, async ({ frames }) => safe(() => merchantOnboarding.importMerchantFrames({ actor, frames: frames as CatalogFrameInput[] })))

  server.registerTool('validate_catalog', {
    title: 'Validate catalog',
    description: 'Validate the authenticated merchant catalog for deterministic Store onboarding readiness.',
    inputSchema: {},
  }, async () => safe(() => merchantOnboarding.validateMerchantCatalog({ actor })))

  server.registerTool('create_store', {
    title: 'Create Store',
    description: 'Create the authenticated merchant Store as a DRAFT. Repeated calls return the existing Store.',
    inputSchema: { name: z.string().max(240).optional(), headline: z.string().max(500).optional(), description: z.string().max(5000).optional() },
  }, async ({ name, headline, description }) => safe(() => merchantOnboarding.createMerchantStore({ actor, name, headline, description })))

  server.registerTool('set_store_frames', {
    title: 'Set Store frames',
    description: 'Replace the authenticated merchant Store frame selection using active catalog frame IDs. Cross-merchant IDs are rejected as not found.',
    inputSchema: { storeId: z.string().min(1), frameIds: z.array(z.string().min(1)).max(100) },
  }, async ({ storeId, frameIds }) => safe(() => merchantOnboarding.setMerchantStoreFrames({ actor, storeId, frameIds })))

  server.registerTool('preview_store', {
    title: 'Preview Store',
    description: 'Return a side-effect-free Store readiness preview. It does not create shopper sessions, consume credits, record Sponsored Usage, or invoke AI.',
    inputSchema: { storeId: z.string().min(1) },
  }, async ({ storeId }) => safe(() => merchantOnboarding.previewMerchantStore({ actor, storeId })))

  server.registerTool('publish_store', {
    title: 'Publish Store',
    description: 'Publish a Store only after the merchant has explicitly approved publication in this tool call. Validates the catalog and selected frames first.',
    inputSchema: { storeId: z.string().min(1), approved: z.boolean() },
  }, async ({ storeId, approved }) => safe(() => merchantOnboarding.publishMerchantStore({ actor, storeId, approved })))

  server.registerTool('list_campaigns', {
    title: 'List Campaigns',
    description: 'List Campaign Experiences belonging only to the authenticated merchant.',
    inputSchema: { cursor: z.string().max(120).optional(), limit: z.number().int().min(1).max(100).optional() },
  }, async ({ cursor, limit }) => safe(async () => {
    requireAgentScope(actor, 'experience:read')
    return listCampaigns({ merchantId: actor.merchantId, cursor, limit })
  }))

  server.registerTool('get_campaign', {
    title: 'Get Campaign',
    description: 'Read one tenant-scoped Campaign, including policy, selected frames, readiness, and its public path.',
    inputSchema: { campaignId },
  }, async ({ campaignId: id }) => safe(async () => {
    requireAgentScope(actor, 'experience:read')
    return getCampaign({ merchantId: actor.merchantId, campaignId: id })
  }))

  server.registerTool('create_campaign', {
    title: 'Create Campaign',
    description: 'Create or safely reuse a Campaign DRAFT for the authenticated merchant. It is private until explicit publish approval.',
    inputSchema: {
      name: z.string().min(1).max(240),
      slug: z.string().max(240).nullable().optional(),
      headline: z.string().max(500).nullable().optional(),
      description: z.string().max(5000).nullable().optional(),
      objective: campaignObjective.optional(),
      conversionGate: campaignGate.optional(),
      presentationMode: presentationMode.optional(),
      startAt: campaignDate,
      endAt: campaignDate,
      primaryCtaType: z.string().max(120).nullable().optional(),
      primaryCtaLabel: z.string().max(240).nullable().optional(),
      primaryCtaUrl: z.string().max(2000).nullable().optional(),
      secondaryCtaType: z.string().max(120).nullable().optional(),
      secondaryCtaLabel: z.string().max(240).nullable().optional(),
      secondaryCtaUrl: z.string().max(2000).nullable().optional(),
    },
  }, async (input) => safe(async () => {
    requireAgentScope(actor, 'experience:write')
    return auditedCampaignMutation({
      actor,
      action: 'campaign.created',
      work: () => createCampaignDraft({
        merchantId: actor.merchantId,
        ...input,
        gate: input.conversionGate,
      }),
    })
  }))

  server.registerTool('set_campaign_frames', {
    title: 'Set Campaign frames',
    description: 'Replace a tenant-scoped Campaign frame selection with active, eligible catalog frames.',
    inputSchema: { campaignId, frameIds: z.array(z.string().min(1).max(120)).max(100) },
  }, async ({ campaignId: id, frameIds }) => safe(async () => {
    requireAgentScope(actor, 'experience:write')
    return auditedCampaignMutation({
      actor,
      action: 'campaign.frames_updated',
      resourceId: id,
      work: () => setCampaignFrames({ merchantId: actor.merchantId, campaignId: id, frameIds }),
    })
  }))

  server.registerTool('update_campaign', {
    title: 'Update Campaign',
    description: 'Update bounded Campaign policy, copy, date, and safe CTA fields for the authenticated merchant.',
    inputSchema: {
      campaignId,
      name: z.string().min(1).max(240).optional(),
      headline: z.string().max(500).nullable().optional(),
      description: z.string().max(5000).nullable().optional(),
      objective: campaignObjective.optional(),
      conversionGate: campaignGate.optional(),
      presentationMode: presentationMode.optional(),
      startAt: campaignDate,
      endAt: campaignDate,
      primaryCtaType: z.string().max(120).nullable().optional(),
      primaryCtaLabel: z.string().max(240).nullable().optional(),
      primaryCtaUrl: z.string().max(2000).nullable().optional(),
      secondaryCtaType: z.string().max(120).nullable().optional(),
      secondaryCtaLabel: z.string().max(240).nullable().optional(),
      secondaryCtaUrl: z.string().max(2000).nullable().optional(),
    },
  }, async ({ campaignId: id, conversionGate, ...input }) => safe(async () => {
    requireAgentScope(actor, 'experience:write')
    return auditedCampaignMutation({
      actor,
      action: 'campaign.updated',
      resourceId: id,
      work: () => updateCampaign({ merchantId: actor.merchantId, campaignId: id, ...input, gate: conversionGate }),
    })
  }))

  server.registerTool('preview_campaign', {
    title: 'Preview Campaign',
    description: 'Return a side-effect-free Campaign readiness preview. It creates no session, attribution, lead, intent, AI request, credits, or Sponsored Usage record.',
    inputSchema: { campaignId },
  }, async ({ campaignId: id }) => safe(async () => {
    requireAgentScope(actor, 'experience:read')
    return previewCampaign({ merchantId: actor.merchantId, campaignId: id })
  }))

  server.registerTool('publish_campaign', {
    title: 'Publish Campaign',
    description: 'Publish only after explicit merchant approval. approved must be true and deterministic Campaign readiness must pass.',
    inputSchema: { campaignId, approved: z.boolean() },
  }, async ({ campaignId: id, approved }) => safe(async () => {
    requireAgentScope(actor, 'experience:write')
    return auditedCampaignMutation({
      actor,
      action: 'campaign.published',
      resourceId: id,
      work: () => publishCampaign({ merchantId: actor.merchantId, campaignId: id, approved }),
    })
  }))

  server.registerTool('archive_campaign', {
    title: 'Archive Campaign',
    description: 'Archive a tenant-scoped Campaign to stop interactive operation without deleting it.',
    inputSchema: { campaignId },
  }, async ({ campaignId: id }) => safe(async () => {
    requireAgentScope(actor, 'experience:write')
    return auditedCampaignMutation({
      actor,
      action: 'campaign.archived',
      resourceId: id,
      work: () => archiveCampaign({ merchantId: actor.merchantId, campaignId: id }),
    })
  }))

  return server
}
