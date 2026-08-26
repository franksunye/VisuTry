import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'
import { importMerchantFrames, listMerchantFrames, MAX_CATALOG_IMPORT, type CatalogFrameInput } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { catalogErrorResponse, isRecord, parseFrameInputs } from './catalog-http'

export const dynamic = 'force-dynamic'

function actorFor(userId: string, merchantId: string, membershipId: string) {
  return { actorType: 'HUMAN' as const, actorId: userId, merchantId, membershipId }
}

export async function GET(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const rawLimit = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50
    const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined
    const data = await listMerchantFrames({ actor: actorFor(auth.userId, params.merchantId, membership.membershipId), cursor, limit })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return catalogErrorResponse(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const body = await request.json() as unknown
    if (!isRecord(body) || body.approved !== true) return NextResponse.json({ success: false, error: 'APPROVAL_REQUIRED', message: 'Explicit approval is required before catalog records are written.' }, { status: 400 })
    const frames = parseFrameInputs(body.frames, MAX_CATALOG_IMPORT)
    if (!frames) return NextResponse.json({ success: false, error: 'INVALID_CATALOG' }, { status: 400 })
    const data = await importMerchantFrames({ actor: actorFor(auth.userId, params.merchantId, membership.membershipId), frames: frames as CatalogFrameInput[] })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return catalogErrorResponse(error)
  }
}
