import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod/v4'
import {
  merchantOnboarding,
  MerchantOnboardingError,
  type CatalogFrameInput,
} from '../application/merchant-onboarding-cloudflare'
import { MerchantAccessError } from '../application/merchant-access-cloudflare'
import { AgentRateLimitError } from '../application/merchant-agent-rate-limit-cloudflare'
import { recordMerchantAgentOperation } from '../application/merchant-agent-credentials-cloudflare'
import { AgentScopeError, InvalidAgentCredentialError } from '../domain/agent-credentials'
import { requireAgentScope, type AgentMerchantActor } from '../domain/actor'
import {
  CampaignServiceError,
  createCampaignDraft,
  getCampaign,
  listCampaigns,
  previewCampaign,
  setCampaignFrames,
  updateCampaign,
} from '@/modules/store/application/campaign-service-cloudflare'
import {
  getExperienceAnalyticsSummary,
  getExperienceFunnel,
  getMerchantIntentSummary,
  getTopFramesByIntent,
  MerchantAnalyticsError,
} from '@/modules/store/application/merchant-analytics-cloudflare'

const frameInput = z.object({
  sku: z.string().min(1).max(120), name: z.string().min(1).max(240), brand: z.string().max(120).nullable().optional(),
  variant: z.string().max(120).nullable().optional(), imageUrl: z.string().max(2000).nullable().optional(), productUrl: z.string().max(2000).nullable().optional(),
  price: z.number().int().nonnegative().nullable().optional(), currency: z.string().max(8).nullable().optional(), shape: z.string().min(1).max(80),
  material: z.string().max(120).nullable().optional(), color: z.string().max(120).nullable().optional(), widthClass: z.string().max(80).nullable().optional(),
  styleTags: z.array(z.string().max(80)).max(20).optional(), collectionTags: z.array(z.string().max(80)).max(20).optional(),
  source: z.enum(['MANUAL', 'CSV', 'EXTERNAL']).optional(), externalId: z.string().max(2000).nullable().optional(), sourceNotes: z.string().max(2000).nullable().optional(),
})

const campaignObjective = z.enum(['TRAFFIC', 'INTENT', 'LEAD'])
const campaignGate = z.enum(['NONE', 'OPT_IN_AFTER_VALUE', 'OPT_IN_BEFORE_AI'])
const presentationMode = z.enum(['ACTION_FIRST', 'PRODUCT_FIRST', 'EDITORIAL_FIRST'])
const campaignId = z.string().min(1).max(120)
const analyticsExperienceId = z.string().min(1).max(120)
const analyticsDate = z.string().max(80).nullable().optional()
const analyticsAvailability = { merchantCtaClicks: false, identifiedIntent: false, leadMetrics: false, revenue: false, orders: false, roas: false } as const
const writeTools = new Set(['import_frames', 'create_store', 'set_store_frames', 'publish_store', 'create_campaign', 'set_campaign_frames', 'update_campaign'])

const scopes: Record<string, string[]> = {
  get_onboarding_status: ['merchant:read'], get_merchant: ['merchant:read'], list_frames: ['catalog:read'], import_frames: ['catalog:write'],
  validate_catalog: ['catalog:read'], create_store: ['experience:write'], set_store_frames: ['experience:write'], preview_store: ['experience:read'], publish_store: ['experience:write'],
  list_campaigns: ['experience:read'], get_campaign: ['experience:read'], create_campaign: ['experience:write'], set_campaign_frames: ['experience:write'],
  update_campaign: ['experience:write'], preview_campaign: ['experience:read'],
  get_experience_summary: ['analytics:read'], get_experience_funnel: ['analytics:read'], get_top_frames: ['analytics:read'], get_intent_summary: ['analytics:read'],
}

function withMetadata(name: string, config: Record<string, unknown>) {
  const readOnly = !writeTools.has(name)
  const annotations: ToolAnnotations = { ...(config.annotations as ToolAnnotations | undefined), readOnlyHint: readOnly, destructiveHint: false, idempotentHint: readOnly || name === 'import_frames' || name === 'create_campaign', openWorldHint: false }
  return { ...config, annotations, _meta: { ...(config._meta as Record<string, unknown> | undefined), securitySchemes: [{ type: 'oauth2', scopes: scopes[name] ?? [] }], 'visutry/securityScopes': scopes[name] ?? [] } }
}

function result(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] } }
function errorResult(error: unknown) {
  if (error instanceof MerchantAccessError) return { code: 'RESOURCE_NOT_FOUND', message: 'The requested merchant resource was not found.' }
  if (error instanceof InvalidAgentCredentialError) return { code: error.code, message: error.message }
  if (error instanceof AgentScopeError || error instanceof AgentRateLimitError || error instanceof MerchantOnboardingError || error instanceof CampaignServiceError) return { code: error.code, message: error.message }
  if (error instanceof MerchantAnalyticsError) return { code: error.code === 'EXPERIENCE_NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'INVALID_TIME_RANGE', message: error.message }
  return { code: 'INTERNAL_ERROR', message: 'The merchant operation could not be completed.' }
}
async function safe<T>(work: () => Promise<T>) { try { return result(await work()) } catch (error) { return { ...result(errorResult(error)), isError: true } } }
async function audited<T>(actor: AgentMerchantActor, action: string, resourceId: string | undefined, work: () => Promise<T>) {
  const value = await work()
  await recordMerchantAgentOperation({ actor, action, resourceType: 'Experience', resourceId: resourceId ?? (value as { id?: string }).id })
  return value
}

export function createMerchantMcpServer(actor: AgentMerchantActor) {
  const server = new McpServer({ name: 'visutry-merchant-self-service', version: '1.0.0' })
  const register = server.registerTool.bind(server)
  server.registerTool = ((name: string, config: Record<string, unknown>, callback: unknown) => register(name, withMetadata(name, config) as never, callback as never)) as typeof server.registerTool

  server.registerTool('get_onboarding_status', { title: 'Get onboarding status', description: 'Read the authenticated merchant onboarding checklist.', inputSchema: {} }, async () => safe(() => merchantOnboarding.getOnboardingStatus({ actor })))
  server.registerTool('get_merchant', { title: 'Get merchant', description: 'Read the authenticated merchant profile.', inputSchema: {} }, async () => safe(() => merchantOnboarding.getMerchant({ actor })))
  server.registerTool('list_frames', { title: 'List frames', description: 'List the authenticated merchant catalog.', inputSchema: { cursor: z.string().optional(), limit: z.number().int().min(1).max(100).optional() } }, async ({ cursor, limit }) => safe(() => merchantOnboarding.listMerchantFrames({ actor, cursor, limit })))
  server.registerTool('import_frames', { title: 'Import frames', description: 'Idempotently import structured catalog frames.', inputSchema: { frames: z.array(frameInput).min(1).max(100) } }, async ({ frames }) => safe(() => merchantOnboarding.importMerchantFrames({ actor, frames: frames as CatalogFrameInput[] })))
  server.registerTool('validate_catalog', { title: 'Validate catalog', description: 'Validate the authenticated merchant catalog.', inputSchema: {} }, async () => safe(() => merchantOnboarding.validateMerchantCatalog({ actor })))
  server.registerTool('create_store', { title: 'Create Store', description: 'Create or reuse a Store DRAFT.', inputSchema: { name: z.string().max(240).optional(), headline: z.string().max(500).optional(), description: z.string().max(5000).optional() } }, async ({ name, headline, description }) => safe(() => merchantOnboarding.createMerchantStore({ actor, name, headline, description })))
  server.registerTool('set_store_frames', { title: 'Set Store frames', description: 'Replace the Store frame selection within the authenticated tenant.', inputSchema: { storeId: z.string().min(1), frameIds: z.array(z.string().min(1)).max(100) } }, async ({ storeId, frameIds }) => safe(() => merchantOnboarding.setMerchantStoreFrames({ actor, storeId, frameIds })))
  server.registerTool('preview_store', { title: 'Preview Store', description: 'Return a side-effect-free Store readiness preview.', inputSchema: { storeId: z.string().min(1) } }, async ({ storeId }) => safe(() => merchantOnboarding.previewMerchantStore({ actor, storeId })))
  server.registerTool('publish_store', { title: 'Publish Store', description: 'Publish a Store only after the merchant has explicitly approved publication in this tool call.', inputSchema: { storeId: z.string().min(1), approved: z.boolean() } }, async ({ storeId, approved }) => safe(() => merchantOnboarding.publishMerchantStore({ actor, storeId, approved })))
  server.registerTool('list_campaigns', { title: 'List Campaigns', description: 'List Campaign DRAFTs for the authenticated merchant.', inputSchema: { cursor: z.string().max(120).optional(), limit: z.number().int().min(1).max(100).optional() } }, async ({ cursor, limit }) => safe(async () => { requireAgentScope(actor, 'experience:read'); return listCampaigns({ merchantId: actor.merchantId, cursor, limit }) }))
  server.registerTool('get_campaign', { title: 'Get Campaign', description: 'Read one tenant-scoped Campaign.', inputSchema: { campaignId } }, async ({ campaignId: id }) => safe(async () => { requireAgentScope(actor, 'experience:read'); return getCampaign({ merchantId: actor.merchantId, campaignId: id }) }))
  server.registerTool('create_campaign', { title: 'Create Campaign', description: 'Create or reuse a Campaign DRAFT.', inputSchema: { name: z.string().min(1).max(240), slug: z.string().max(240).nullable().optional(), headline: z.string().max(500).nullable().optional(), description: z.string().max(5000).nullable().optional(), objective: campaignObjective.optional(), conversionGate: campaignGate.optional(), presentationMode: presentationMode.optional(), startAt: z.string().max(80).nullable().optional(), endAt: z.string().max(80).nullable().optional(), primaryCtaType: z.string().max(120).nullable().optional(), primaryCtaLabel: z.string().max(240).nullable().optional(), primaryCtaUrl: z.string().max(2000).nullable().optional(), secondaryCtaType: z.string().max(120).nullable().optional(), secondaryCtaLabel: z.string().max(240).nullable().optional(), secondaryCtaUrl: z.string().max(2000).nullable().optional() } }, async (input) => safe(async () => { requireAgentScope(actor, 'experience:write'); return audited(actor, 'campaign.created', undefined, () => createCampaignDraft({ merchantId: actor.merchantId, ...input, gate: input.conversionGate })) }))
  server.registerTool('set_campaign_frames', { title: 'Set Campaign frames', description: 'Replace Campaign frames within the authenticated tenant.', inputSchema: { campaignId, frameIds: z.array(z.string().min(1).max(120)).max(100) } }, async ({ campaignId: id, frameIds }) => safe(async () => { requireAgentScope(actor, 'experience:write'); return audited(actor, 'campaign.frames_updated', id, () => setCampaignFrames({ merchantId: actor.merchantId, campaignId: id, frameIds })) }))
  server.registerTool('update_campaign', { title: 'Update Campaign', description: 'Update bounded Campaign DRAFT fields.', inputSchema: { campaignId, name: z.string().min(1).max(240).optional(), headline: z.string().max(500).nullable().optional(), description: z.string().max(5000).nullable().optional(), objective: campaignObjective.optional(), conversionGate: campaignGate.optional(), presentationMode: presentationMode.optional(), startAt: z.string().max(80).nullable().optional(), endAt: z.string().max(80).nullable().optional(), primaryCtaType: z.string().max(120).nullable().optional(), primaryCtaLabel: z.string().max(240).nullable().optional(), primaryCtaUrl: z.string().max(2000).nullable().optional(), secondaryCtaType: z.string().max(120).nullable().optional(), secondaryCtaLabel: z.string().max(240).nullable().optional(), secondaryCtaUrl: z.string().max(2000).nullable().optional() } }, async ({ campaignId: id, conversionGate, ...input }) => safe(async () => { requireAgentScope(actor, 'experience:write'); return audited(actor, 'campaign.updated', id, () => updateCampaign({ merchantId: actor.merchantId, campaignId: id, ...input, gate: conversionGate })) }))
  server.registerTool('preview_campaign', { title: 'Preview Campaign', description: 'Return a side-effect-free Campaign readiness preview.', inputSchema: { campaignId } }, async ({ campaignId: id }) => safe(async () => { requireAgentScope(actor, 'experience:read'); return previewCampaign({ merchantId: actor.merchantId, campaignId: id }) }))
  server.registerTool('get_experience_summary', { title: 'Get Experience summary', description: 'Return merchant-scoped aggregate performance for one Store or Campaign. Revenue, orders, ROAS, identity, and raw shopper activity are unavailable.', inputSchema: { experienceId: analyticsExperienceId, from: analyticsDate, to: analyticsDate } }, async ({ experienceId, from, to }) => safe(async () => { requireAgentScope(actor, 'analytics:read'); const summary = await getExperienceAnalyticsSummary({ actor, experienceId, from, to }); return { experience: { id: summary.experience.id, type: summary.experience.type, name: summary.experience.name, objective: summary.experience.objective, referenceData: summary.referenceData }, period: summary.period, metrics: summary.metrics, scorecard: summary.scorecard, availability: analyticsAvailability } }))
  server.registerTool('get_experience_funnel', { title: 'Get Experience funnel', description: 'Return behavior-stage counts for one Store or Campaign. The merchant CTA stage is unavailable in the current metric contract.', inputSchema: { experienceId: analyticsExperienceId, from: analyticsDate, to: analyticsDate } }, async ({ experienceId, from, to }) => safe(async () => { requireAgentScope(actor, 'analytics:read'); return getExperienceFunnel({ actor, experienceId, from, to }) }))
  server.registerTool('get_top_frames', { title: 'Get top frames', description: 'Return observed Try-On, Favorite, Compare, and high-intent frame signals for one Store or Campaign.', inputSchema: { experienceId: analyticsExperienceId, from: analyticsDate, to: analyticsDate, limit: z.number().int().min(1).max(20).optional() } }, async ({ experienceId, from, to, limit }) => safe(async () => { requireAgentScope(actor, 'analytics:read'); const frames = await getTopFramesByIntent({ actor, experienceId, from, to }); return { ...frames, frames: frames.frames.slice(0, limit ?? 10) } }))
  server.registerTool('get_intent_summary', { title: 'Get intent summary', description: 'Return aggregate anonymous shopper intent signals for one Store or Campaign. Identified intent and lead metrics are unavailable.', inputSchema: { experienceId: analyticsExperienceId, from: analyticsDate, to: analyticsDate } }, async ({ experienceId, from, to }) => safe(async () => { requireAgentScope(actor, 'analytics:read'); return { ...(await getMerchantIntentSummary({ actor, experienceId, from, to })), availability: analyticsAvailability } }))
  return server
}
