import 'server-only'

import { getPublicRouteAdmissionIndex } from './public-route-admission'
import { publicEdgeTagsForRouteMembership } from './public-edge-paths'

/**
 * Reads the existing public admission model for Vercel-side writes. This
 * adapter is intentionally separate from the pure route mapper so the
 * Cloudflare direct-SQL application does not pull Prisma into its bundle.
 */
export async function getPublicEdgeTagsForMerchant(merchantSlug: string): Promise<string[]> {
  try {
    const index = await getPublicRouteAdmissionIndex()
    return publicEdgeTagsForRouteMembership(merchantSlug, index[merchantSlug])
  } catch (error) {
    // Route-membership lookup is auxiliary to the committed write. The
    // invalidation boundary still purges the exact target path when possible;
    // a read-model outage must not block a merchant mutation.
    console.warn(JSON.stringify({
      event: 'public_html_invalidation',
      phase: 'route_membership_lookup',
      success: false,
      reason: error instanceof Error ? error.name : 'route_membership_lookup_failed',
    }))
    return []
  }
}
