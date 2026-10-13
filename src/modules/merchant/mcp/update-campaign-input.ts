import { z } from 'zod/v4'
import { mcpStoreJourneyPolicy, mcpStoreDeliveryPolicy } from './store-policy-input'

/**
 * The MCP SDK strips unknown properties from a default z.object.
 * Reject unknown or empty Campaign update inputs before any DB mutation or
 * success audit, and keep Node / Cloudflare tool contracts in parity.
 */
export const mcpUpdateCampaignInput = z.strictObject({
  campaignId: z.string().min(1).max(120),
  name: z.string().min(1).max(240).optional(),
  headline: z.string().max(500).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  objective: z.enum(['TRAFFIC', 'INTENT', 'LEAD']).optional(),
  conversionGate: z.enum(['NONE', 'OPT_IN_AFTER_VALUE', 'OPT_IN_BEFORE_AI']).optional(),
  presentationMode: z.enum(['ACTION_FIRST', 'PRODUCT_FIRST', 'EDITORIAL_FIRST']).optional(),
  journeyPolicy: mcpStoreJourneyPolicy.optional(),
  deliveryPolicy: mcpStoreDeliveryPolicy.optional(),
  startAt: z.string().max(80).nullable().optional(),
  endAt: z.string().max(80).nullable().optional(),
  primaryCtaType: z.string().max(120).nullable().optional(),
  primaryCtaLabel: z.string().max(240).nullable().optional(),
  primaryCtaUrl: z.string().max(2000).nullable().optional(),
  secondaryCtaType: z.string().max(120).nullable().optional(),
  secondaryCtaLabel: z.string().max(240).nullable().optional(),
  secondaryCtaUrl: z.string().max(2000).nullable().optional(),
}).refine(
  (value) => Object.keys(value).some((field) => field !== 'campaignId'),
  { message: 'At least one Campaign update field is required.' },
)
