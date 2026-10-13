import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod/v4'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership, MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import {
  prepareMerchantFactoryDraftSelection, applyMerchantFactoryDraftSelection,
} from '@/modules/merchant/application/merchant-delivery-factory-selection'
import { MerchantFactorySelectionConflict } from '@/modules/merchant/domain/merchant-delivery-factory-selection-v1'
import { merchantDeliveryManifestV1Schema } from '@/modules/merchant/domain/merchant-delivery-factory-v1'
import { MerchantOnboardingError } from '@/modules/merchant/application/merchant-onboarding'
import { CampaignServiceError } from '@/modules/store/domain/campaign-readiness'
import { ExperienceCommandError } from '@/modules/store/application/experience-command-service'

export const dynamic = 'force-dynamic'
const reply = (value: unknown, status = 200) =>
  NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } })
const target = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('STORE') }),
  z.strictObject({ type: z.literal('CAMPAIGN'), slug: z.string().min(1).max(120) }),
])
const prepareRequest = z.strictObject({
  target,
  manifest: merchantDeliveryManifestV1Schema,
})
const applyRequest = prepareRequest.extend({
  approved: z.literal(true),
  expectedExperienceId: z.string().min(1).max(120),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  manifestDigest: z.string().regex(/^[a-f0-9]{64}$/),
})
function reject(error: unknown) {
  if (error instanceof MerchantAccessError
    || (error instanceof Error && error.message === 'FACTORY_TENANT_MISMATCH')) {
    return reply({ success: false, error: 'RESOURCE_NOT_FOUND' }, 404)
  }
  if (error instanceof ZodError) return reply({ success: false, error: 'INVALID_FACTORY_SELECTION_REQUEST' }, 400)
  if (error instanceof MerchantFactorySelectionConflict
    || error instanceof ExperienceCommandError
    || (error instanceof MerchantOnboardingError && error.httpStatus === 409)
    || (error instanceof CampaignServiceError && error.httpStatus === 409)) {
    return reply({ success: false, error: 'FACTORY_SELECTION_CONFLICT' }, 409)
  }
  return reply({ success: false, error: 'FACTORY_SELECTION_UNAVAILABLE' }, 500)
}
async function owner(merchantId: string) {
  const auth = await requireAuth()
  if (!auth.ok) return { ok: false as const, response: auth.response }
  const membership = await requireMerchantMembership({ userId: auth.userId, merchantId, roles: ['OWNER'] })
  return {
    ok: true as const,
    actor: { actorType: 'HUMAN' as const, actorId: auth.userId, merchantId, membershipId: membership.membershipId },
  }
}
export async function PUT(request: NextRequest, { params }: { params: { merchantId: string } }) {
  try {
    const access = await owner(params.merchantId)
    if (!access.ok) return access.response
    const data: unknown = await request.json().catch(() => null)
    const input = prepareRequest.parse(data)
    const result = await prepareMerchantFactoryDraftSelection({
      actor: access.actor, target: input.target, proposal: input.manifest,
    })
    return reply({ success: true, data: result })
  } catch (error) { return reject(error) }
}
export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  try {
    const access = await owner(params.merchantId)
    if (!access.ok) return access.response
    const data: unknown = await request.json().catch(() => null)
    const input = applyRequest.parse(data)
    const result = await applyMerchantFactoryDraftSelection({
      actor: access.actor, target: input.target, proposal: input.manifest,
      expectedExperienceId: input.expectedExperienceId,
      expectedUpdatedAt: new Date(input.expectedUpdatedAt).toISOString(),
      manifestDigest: input.manifestDigest,
    })
    return reply({ success: true, data: result })
  } catch (error) { return reject(error) }
}
