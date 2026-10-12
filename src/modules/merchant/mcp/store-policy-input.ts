import { z } from 'zod/v4'
import { assertDecisionJourneyPolicy, type DecisionJourneyPolicy } from '@/modules/store/domain/decision-journey'
import { assertExperienceDeliveryPolicy, type ExperienceDeliveryPolicy } from '@/modules/store/domain/delivery-profile'

/**
 * Shared MCP input boundary for canonical Store policy commands.
 * Both Node and Cloudflare must accept only the platform's fixed policy
 * contracts. The canonical Experience command remains the write authority.
 */
export const mcpStoreJourneyPolicy = z.custom<DecisionJourneyPolicy>((value) => {
  try {
    assertDecisionJourneyPolicy(value)
    return true
  } catch {
    return false
  }
}, 'Invalid canonical Store Journey policy')

export const mcpStoreDeliveryPolicy = z.custom<ExperienceDeliveryPolicy>((value) => {
  try {
    assertExperienceDeliveryPolicy(value)
    return true
  } catch {
    return false
  }
}, 'Invalid Store Web/Kiosk delivery policy')
