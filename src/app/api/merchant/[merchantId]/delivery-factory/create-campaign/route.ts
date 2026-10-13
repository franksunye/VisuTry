import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership, MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryDraftCampaignCreation,
  createMerchantFactoryDraftCampaign,
} from '@/modules/merchant/application/merchant-delivery-factory-create-campaign'
import { MerchantFactoryCreateCampaignConflict } from '@/modules/merchant/domain/merchant-delivery-factory-create-campaign-v1'
import { merchantDeliveryManifestV1Schema } from '@/modules/merchant/domain/merchant-delivery-factory-v1'
import { CampaignServiceError } from '@/modules/store/application/campaign-service'

export const dynamic = 'force-dynamic'
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

const prepareSchema = z.strictObject({
  slug: z.string().min(1).max(120),
  manifest: merchantDeliveryManifestV1Schema,
})
const createSchema = prepareSchema.extend({
  approved: z.literal(true),
  expectedCampaignAbsent: z.literal(true),
  manifestDigest: z.string().regex(/^[a-f0-9]{64}$/),
})

async function identifyOwner(merchantId: string) {
  const auth = await requireAuth()
  if (!auth.ok) return { ok: false as const, response: auth.response }
  const membership = await requireMerchantMembership({ userId: auth.userId, merchantId, roles: ['OWNER'] })
  return {
    ok: true as const,
    actor: { actorType: 'HUMAN' as const, actorId: auth.userId, merchantId, membershipId: membership.membershipId },
  }
}
function rejected(error: unknown) {
  if (error instanceof MerchantAccessError
    || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
    return reply({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
  }
  if (error instanceof ZodError) return reply({ success: false, error: 'INVALID_FACTORY_CAMPAIGN_REQUEST' }, 400)
  if (error instanceof MerchantFactoryCreateCampaignConflict
    || (error instanceof CampaignServiceError && error.httpStatus === 409)
    || (error && typeof error === 'object' && 'code' in error
      && (error.code === 'P2002' || error.code === 'P2034' || error.code === '40001'))) {
    return reply({ success: false, error: 'FACTORY_CAMPAIGN_CREATE_CONFLICT' }, 409)
  }
  return reply({ success: false, error: 'FACTORY_CAMPAIGN_CREATE_UNAVAILABLE' }, 500)
}
export async function PUT(request: NextRequest, { params }: { params: { merchantId: string } }) {
  try {
    const owner = await identifyOwner(params.merchantId)
    if (!owner.ok) return owner.response
    const body: unknown = await request.json().catch(() => null)
    const input = prepareSchema.parse(body)
    const result = await prepareMerchantFactoryDraftCampaignCreation({ actor: owner.actor, proposal: input.manifest, slug: input.slug })
    return reply({ success: true, data: result })
  } catch (error) { return rejected(error) }
}
export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  try {
    const owner = await identifyOwner(params.merchantId)
    if (!owner.ok) return owner.response
    const body: unknown = await request.json().catch(() => null)
    const input = createSchema.parse(body)
    const result = await createMerchantFactoryDraftCampaign({
      actor: owner.actor, proposal: input.manifest,
      slug: input.slug, manifestDigest: input.manifestDigest,
      expectedCampaignAbsent: input.expectedCampaignAbsent,
    })
    return reply({ success: true, data: result })
  } catch (error) { return rejected(error) }
}
