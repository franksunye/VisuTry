import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'
import { inspectHumanMerchantCatalogSource } from '@/modules/merchant/application/merchant-catalog-source-intake-runtime'
import { MAX_SOURCE_PRODUCTS, MAX_SOURCE_URLS } from '@/modules/merchant/application/merchant-catalog-source-shared'
import { catalogErrorResponse, isRecord, parseFrameInputs } from '../catalog-http'

export const dynamic = 'force-dynamic'

function actorFor(userId: string, merchantId: string, membershipId: string) {
  return { actorType: 'HUMAN' as const, actorId: userId, merchantId, membershipId }
}

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const sourceType = form.get('sourceType')
      const file = form.get('file')
      if (sourceType !== 'csv' || !(file instanceof File)) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
      const result = await inspectHumanMerchantCatalogSource({ actor: actorFor(auth.userId, params.merchantId, membership.membershipId), csvText: await file.text() })
      return NextResponse.json({ success: true, data: result })
    }

    const body = await request.json() as unknown
    if (!isRecord(body) || typeof body.sourceType !== 'string') return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const actor = actorFor(auth.userId, params.merchantId, membership.membershipId)
    if (body.sourceType === 'url') {
      const sourceUrls = Array.isArray(body.sourceUrls) ? body.sourceUrls : typeof body.url === 'string' ? [body.url] : null
      if (!sourceUrls || sourceUrls.length === 0 || sourceUrls.length > MAX_SOURCE_URLS || sourceUrls.some((url) => typeof url !== 'string' || url.length > 2000)) return NextResponse.json({ success: false, error: 'INVALID_SOURCE_URL' }, { status: 400 })
      const result = await inspectHumanMerchantCatalogSource({ actor, sourceUrls })
      return NextResponse.json({ success: true, data: result })
    }
    if (body.sourceType === 'manual') {
      const manualProducts = parseFrameInputs(body.manualProducts, MAX_SOURCE_PRODUCTS)
      if (!manualProducts) return NextResponse.json({ success: false, error: 'INVALID_CATALOG' }, { status: 400 })
      const result = await inspectHumanMerchantCatalogSource({ actor, manualProducts })
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  } catch (error) {
    return catalogErrorResponse(error)
  }
}
