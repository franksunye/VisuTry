import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/api-auth'
import { invalidatePublicDiscovery } from '@/modules/store/application/public-discovery-invalidation'
import {
  isStoreCampaignExperienceSlug,
  isStoreCampaignMerchantSlug,
  STORE_CAMPAIGN_MAX_EXPERIENCE_SLUG_LENGTH,
  STORE_CAMPAIGN_MAX_MERCHANT_SLUG_LENGTH,
} from '@/modules/store/application/public-edge-contract'

export const dynamic = 'force-dynamic'

const revalidateSchema = z.object({
  merchantSlug: z.string().trim().min(1).max(STORE_CAMPAIGN_MAX_MERCHANT_SLUG_LENGTH)
    .refine(isStoreCampaignMerchantSlug),
  experienceSlug: z.string().trim().min(1).max(STORE_CAMPAIGN_MAX_EXPERIENCE_SLUG_LENGTH)
    .refine(isStoreCampaignExperienceSlug).optional(),
}).strict()

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ success: false, error: 'INVALID_REQUEST' }, 400)
  }

  const parsed = revalidateSchema.safeParse(body)
  if (!parsed.success) {
    return json({ success: false, error: 'INVALID_REQUEST' }, 400)
  }

  const { merchantSlug, experienceSlug } = parsed.data
  try {
    const result = await invalidatePublicDiscovery({
      target: experienceSlug
        ? { kind: 'experience', merchantSlug, experienceSlug }
        : { kind: 'store', merchantSlug },
    })
    return json({ success: true, data: result })
  } catch {
    return json({ success: false, error: 'PUBLIC_DISCOVERY_REVALIDATION_FAILED' }, 500)
  }
}
