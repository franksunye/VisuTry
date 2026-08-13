import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { MerchantProvisioningError, createMerchantWithOwner } from '@/modules/merchant'

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

  const payload = body as { name?: unknown; websiteUrl?: unknown }
  if (typeof payload.name !== 'string' || (payload.websiteUrl !== undefined && payload.websiteUrl !== null && typeof payload.websiteUrl !== 'string')) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }

  try {
    const result = await createMerchantWithOwner({
      userId: auth.userId,
      name: payload.name,
      websiteUrl: payload.websiteUrl as string | null | undefined,
    })
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    if (error instanceof MerchantProvisioningError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.code === 'SLUG_UNAVAILABLE' ? 409 : 400 })
    }
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
