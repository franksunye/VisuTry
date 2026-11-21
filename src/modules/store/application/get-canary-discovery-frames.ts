import { cache } from 'react'
import { MERCHANT_DISCOVERY_EDITORIAL } from '@/config/merchant-discovery-editorial'
import {
  buildCanaryDiscoveryFrames,
  isCanaryDiscoveryFrameId,
  type CanaryDiscoveryFrame,
} from '@/modules/store/application/canary-discovery-frames'
import { getPublicExperienceDiscoveryContentForRoute } from './get-public-experience-discovery-route'

export type { CanaryDiscoveryFrame } from '@/modules/store/application/canary-discovery-frames'

/**
 * Read only the two bounded public sources through the existing cache/admission
 * boundary. No direct catalog lookup, session, usage or Provider call is made.
 * React cache shares this read across metadata and the page in one render.
 */
export const getCanaryDiscoveryFrames = cache(async (): Promise<CanaryDiscoveryFrame[]> => {
  const [store, campaign] = await Promise.all([
    getPublicExperienceDiscoveryContentForRoute(MERCHANT_DISCOVERY_EDITORIAL.merchantSlug, null, 'en'),
    getPublicExperienceDiscoveryContentForRoute(MERCHANT_DISCOVERY_EDITORIAL.merchantSlug, MERCHANT_DISCOVERY_EDITORIAL.experienceSlug, 'en'),
  ])
  return buildCanaryDiscoveryFrames({ store, campaign })
})

export const getCanaryDiscoveryFrame = cache(async (frameId: string): Promise<CanaryDiscoveryFrame | null> => {
  if (!isCanaryDiscoveryFrameId(frameId)) return null
  const frames = await getCanaryDiscoveryFrames()
  return frames.find((frame) => frame.id === frameId) ?? null
})
