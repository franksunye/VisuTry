import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantBrandWorkspace, updateMerchantBrand } from '@/modules/merchant/application/merchant-brand-kit'
import { BrandKitError } from '@/modules/merchant/domain/merchant-brand-kit'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'
export const dynamic = 'force-dynamic'
type Context = { params: { merchantId: string } }
function onError(error: unknown) {
  if (error instanceof BrandKitError) return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: error.httpStatus })
  return merchantAgentErrorResponse(error)
}
export async function GET(_request: NextRequest, { params }: Context) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER','ADMIN'] })
    return NextResponse.json({ success: true, data: await getMerchantBrandWorkspace(params.merchantId) })
  } catch (error) { return onError(error) }
}
export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  let data: Record<string, unknown>
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error()
    data = body as Record<string, unknown>
  } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
  if (Object.keys(data).some(k => !['accentColor','logoUrl','approvedLiveChange'].includes(k))
    || (data.logoUrl !== undefined && data.logoUrl !== null && typeof data.logoUrl !== 'string')
    || (data.accentColor !== undefined && data.accentColor !== null && typeof data.accentColor !== 'string')
    || (data.approvedLiveChange !== undefined && typeof data.approvedLiveChange !== 'boolean')) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  try {
    return NextResponse.json({ success: true, data: await updateMerchantBrand({
      userId: auth.userId, merchantId: params.merchantId,
      accentColor: data.accentColor as string | null | undefined,
      logoUrl: data.logoUrl as string | null | undefined,
      approvedLiveChange: data.approvedLiveChange as boolean | undefined,
    }) })
  } catch (error) { return onError(error) }
}
