import type { ExperienceType } from './experience'
import {
  PRESENTATION_MODES,
  resolvePresentationMode,
  type PresentationMode,
} from './presentation-mode'

export const CAMPAIGN_OBJECTIVES = ['TRAFFIC', 'INTENT', 'LEAD'] as const
export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number]

export const CAMPAIGN_GATES = ['NONE', 'OPT_IN_AFTER_VALUE', 'OPT_IN_BEFORE_AI'] as const
export type CampaignGate = (typeof CAMPAIGN_GATES)[number]

export type CampaignConversionPolicy = {
  objective: CampaignObjective
  gate: CampaignGate
}

export type CampaignPolicyExperience = {
  type: ExperienceType
  campaignObjective?: CampaignObjective | null
  campaignGate?: CampaignGate | null
  presentationMode?: PresentationMode | null
}

export function isCampaignObjective(value: unknown): value is CampaignObjective {
  return typeof value === 'string' && (CAMPAIGN_OBJECTIVES as readonly string[]).includes(value)
}

export function isCampaignGate(value: unknown): value is CampaignGate {
  return typeof value === 'string' && (CAMPAIGN_GATES as readonly string[]).includes(value)
}

export function isPresentationMode(value: unknown): value is PresentationMode {
  return typeof value === 'string' && (PRESENTATION_MODES as readonly string[]).includes(value)
}

/**
 * Single resolver for Campaign conversion semantics. Missing values are only
 * defaulted for historical Campaign rows; Stores do not receive Campaign
 * objective or gate semantics.
 */
export function resolveCampaignConversionPolicy(
  experience: CampaignPolicyExperience,
): CampaignConversionPolicy | null {
  if (experience.type !== 'CAMPAIGN') return null
  return {
    objective: experience.campaignObjective ?? 'INTENT',
    gate: experience.campaignGate ?? 'NONE',
  }
}

export function resolveCampaignPresentationMode(input: {
  experienceType: ExperienceType
  persistedPresentationMode?: PresentationMode | null
  acquisitionSurface?: string | null
}): PresentationMode {
  return resolvePresentationMode({
    experienceType: input.experienceType,
    acquisitionSurface: input.acquisitionSurface,
    persistedPresentationMode: input.persistedPresentationMode,
  })
}
