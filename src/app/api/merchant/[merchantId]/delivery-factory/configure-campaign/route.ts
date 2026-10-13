import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantAccessError, requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryCampaignConfiguration,
  applyMerchantFactoryCampaignConfiguration,
} from '@/modules/merchant/application/merchant-delivery-factory-configure-campaign'
import { MerchantFactoryCampaignConfigConflict } from '@/modules/merchant/domain/merchant-delivery-factory-configure-campaign-v1'
import { merchantDeliveryManifestV1Schema } from '@/modules/merchant/domain/merchant-delivery-factory-v1'
import { CampaignServiceError } from '@/modules/store/domain/campaign-readiness'
import { ExperienceCommandError } from '@/modules/store/application/experience-command-service'

export const dynamic = 'force-dynamic'
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
const proposed = z.strictObject({
  slug: z.string().min(1).max(120), manifest: merchantDeliveryManifestV1Schema,
})
const approved = proposed.extend({
  approved: z.literal(true), expectedCampaignId: z.string().min(1).max(120),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  manifestDigest: z.string().regex(/^[a-f0-9]{64}$/),
})
async function humanOwner(merchantId: string) {
  const auth = await requireAuth()
  if (!auth.ok) return { ok: false as const, response: auth.response }
  const membership = await requireMerchantMembership({ userId: auth.userId, merchantId, roles: ['OWNER'] })
  return { ok: true as const, actor: {
    actorType: 'HUMAN' as const, actorId: auth.userId,
    merchantId, membershipId: membership.membershipId,
  } }
}
function reject(error: unknown) {
  if (error instanceof MerchantAccessError
    || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
    return reply({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
  }
  if (error instanceof ZodError) return reply({ success: false, error: 'INVALID_FACTORY_CONFIG_REQUEST' }, 400)
  if (error instanceof MerchantFactoryCampaignConfigConflict
    || error instanceof ExperienceCommandError
    || (error instanceof CampaignServiceError && error.httpStatus === 409)
    || (error && typeof error === 'object' && 'code' in error
      && (error.code === 'P2034' || error.code === '40001'))) {
    return reply({ success: false, error: 'FACTORY_CAMPAIGN_CONFIG_CONFLICT' }, 409)
  }
  return reply({ success: false, error: 'FACTORY_CAMPAIGN_CONFIG_UNAVAILABLE' }, 500)
}
export async function PUT(request: NextRequest, { params }: { params: { merchantId: string } }) {
  try {
    const access = await humanOwner(params.merchantId)
    if (!access.ok) return access.response
    const body: unknown = await request.json().catch(() => null)
    const input = proposed.parse(body)
    return reply({ success: true, data: await prepareMerchantFactoryCampaignConfiguration({
      actor: access.actor, slug: input.slug, proposal: input.manifest,
    }) })
  } catch (error) { return reject(error) }
}
export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  try {
    const access = await humanOwner(params.merchantId)
    if (!access.ok) return access.response
    const body: unknown = await request.json().catch(() => null)
    const input = approved.parse(body)
    return reply({ success: true, data: await applyMerchantFactoryCampaignConfiguration({
      actor: access.actor, slug: input.slug, proposal: input.manifest,
      expectedCampaignId: input.expectedCampaignId,
      expectedUpdatedAt: new Date(input.expectedUpdatedAt).toISOString(),
      manifestDigest: input.manifestDigest,
    }) })
  } catch (error) { return reject(error) }
}
