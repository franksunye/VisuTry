import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod/v4'
import {
  merchantOnboarding,
  MerchantOnboardingError,
  type CatalogFrameInput,
} from '../application/merchant-onboarding'
import { MerchantAccessError } from '../application/merchant-access'
import { AgentRateLimitError } from '../application/merchant-agent-rate-limit'
import { AgentScopeError, InvalidAgentCredentialError } from '../domain/agent-credentials'
import type { AgentMerchantActor } from '../domain/actor'

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

function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] }
}

function errorResult(error: unknown) {
  if (error instanceof MerchantAccessError) return { code: 'RESOURCE_NOT_FOUND', message: 'The requested merchant resource was not found.' }
  if (error instanceof InvalidAgentCredentialError) return { code: error.code, message: error.message }
  if (error instanceof AgentScopeError) return { code: error.code, message: error.message }
  if (error instanceof AgentRateLimitError) return { code: error.code, message: error.message, retryAfterSeconds: error.retryAfterSeconds }
  if (error instanceof MerchantOnboardingError) return { code: error.code, message: error.message }
  return { code: 'INTERNAL_ERROR', message: 'The merchant operation could not be completed.' }
}

async function safe<T>(work: () => Promise<T>) {
  try {
    return result(await work())
  } catch (error) {
    return { ...result(errorResult(error)), isError: true }
  }
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

  return server
}
