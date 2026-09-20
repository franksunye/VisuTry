import { getPublicRouteAdmissionIndex } from './public-route-admission-cloudflare'
import { publicEdgeTagsForRouteMembership } from './public-edge-paths'

/**
 * Cloudflare's direct-Neon write adapters use the same public admission model
 * as the public read path, without importing Prisma into the traffic Worker.
 */
export async function getPublicEdgeTagsForCloudflareMerchant(merchantSlug: string): Promise<string[]> {
  try {
    const index = await getPublicRouteAdmissionIndex()
    return publicEdgeTagsForRouteMembership(merchantSlug, index[merchantSlug])
  } catch (error) {
    console.warn(JSON.stringify({
      event: 'public_html_invalidation',
      phase: 'route_membership_lookup',
      success: false,
      reason: error instanceof Error ? error.name : 'route_membership_lookup_failed',
    }))
    return []
  }
}
