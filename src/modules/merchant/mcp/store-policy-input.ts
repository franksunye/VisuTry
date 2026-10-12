import { z } from 'zod/v4'
import {
  DECISION_JOURNEY_STAGES,
  assertDecisionJourneyPolicy,
} from '@/modules/store/domain/decision-journey'
import {
  MIN_KIOSK_IDLE_TIMEOUT_SECONDS,
  MAX_KIOSK_IDLE_TIMEOUT_SECONDS,
  assertExperienceDeliveryPolicy,
} from '@/modules/store/domain/delivery-profile'

function followsCanonicalJourney(value: unknown): boolean {
  try { assertDecisionJourneyPolicy(value); return true } catch { return false }
}
function followsCanonicalDelivery(value: unknown): boolean {
  try { assertExperienceDeliveryPolicy(value); return true } catch { return false }
}

/**
 * Preserve real JSON Schema for MCP clients (unlike opaque z.custom).
 * Node and Cloudflare both delegate final validation to canonical domain
 * rules; business writes still use the shared Experience command boundary.
 */
export const mcpStoreJourneyPolicy = z.strictObject({
  enabledStages: z.array(z.enum(DECISION_JOURNEY_STAGES)).min(2).max(DECISION_JOURNEY_STAGES.length),
}).refine(followsCanonicalJourney, 'Invalid canonical Store Journey policy')

export const mcpStoreDeliveryPolicy = z.strictObject({
  kioskEnabled: z.boolean(),
  kioskIdleTimeoutSeconds: z.number().int().min(MIN_KIOSK_IDLE_TIMEOUT_SECONDS).max(MAX_KIOSK_IDLE_TIMEOUT_SECONDS),
}).refine(followsCanonicalDelivery, 'Invalid Store Web/Kiosk delivery policy')
