import {
  INTERNAL_DISTRIBUTION_SURFACES,
  type InternalDistributionSurface,
} from '../domain/session-acquisition'

export type InternalMerchantExperienceHrefInput = {
  path: string
  surface: InternalDistributionSurface
  campaign?: string | null
}

/** Build the single explicit handoff contract for VisuTry-owned traffic. */
export function buildMerchantExperienceHref(
  input: InternalMerchantExperienceHrefInput,
): string {
  if (!input.path.startsWith('/')) {
    throw new Error('Merchant Experience handoff path must be relative')
  }

  const url = new URL(input.path, 'https://visutry.local')
  url.searchParams.set('source', 'visutry')
  url.searchParams.set('medium', 'internal')
  url.searchParams.set('surface', input.surface)
  if (input.campaign) url.searchParams.set('campaign', input.campaign)

  return `${url.pathname}${url.search}${url.hash}`
}
