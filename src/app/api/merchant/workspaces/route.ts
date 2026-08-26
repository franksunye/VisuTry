import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { MerchantProvisioningError, createMerchantWithOwner } from '@/modules/merchant/cloudflare'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }

  const payload = body as { name?: unknown; websiteUrl?: unknown; source?: unknown; campaign?: unknown }
  if ((payload.name !== undefined && typeof payload.name !== 'string') ||
    (payload.websiteUrl !== undefined && payload.websiteUrl !== null && typeof payload.websiteUrl !== 'string') ||
    (payload.source !== undefined && payload.source !== null && typeof payload.source !== 'string') ||
    (payload.campaign !== undefined && payload.campaign !== null && typeof payload.campaign !== 'string')) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }

  try {
    const provisionInput = {
      userId: auth.userId,
      name: payload.name,
      websiteUrl: payload.websiteUrl as string | null | undefined,
      ...(payload.source !== undefined ? { source: payload.source as string | null } : {}),
      ...(payload.campaign !== undefined ? { campaign: payload.campaign as string | null } : {}),
    }
    const result = await createMerchantWithOwner(provisionInput)
    const created = result.created !== false
    return NextResponse.json({ success: true, data: { ...result, created } }, { status: created ? 201 : 200 })
  } catch (error) {
    if (error instanceof MerchantProvisioningError) {
      const message = error.code === 'INVALID_MERCHANT_NAME'
        ? 'Please enter a business or brand name with at least 2 characters.'
        : error.code === 'INVALID_WEBSITE_URL'
          ? 'Please enter a valid http(s) website URL.'
          : 'That workspace name is currently unavailable. Please try another name.'
      return NextResponse.json({ success: false, code: error.code, error: message }, { status: error.code === 'SLUG_UNAVAILABLE' ? 409 : 400 })
    }
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
