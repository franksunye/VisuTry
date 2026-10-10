import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { updateMerchantExperienceHero } from '@/modules/merchant/application/merchant-brand-kit'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { prisma } from '@/lib/prisma'
import { BrandKitError } from '@/modules/merchant/domain/merchant-brand-kit'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const membership = await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER','ADMIN'] })
    const experienceId = new URL(request.url).searchParams.get('experienceId')
    if (!experienceId || experienceId.length > 200) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const row = await prisma.experience.findFirst({
      where: { id: experienceId, merchantId: params.merchantId, type: { in: ['STORE','CAMPAIGN'] } },
      select: { id: true, name: true, status: true, type: true, heroAssetUrl: true },
    })
    if (!row) return NextResponse.json({ success: false, error: 'EXPERIENCE_NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ success: true, data: { ...row, canEdit: membership.role === 'OWNER' && ['DRAFT','ACTIVE'].includes(row.status) } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return merchantAgentErrorResponse(error) }
}
export async function PATCH(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  let data: Record<string, unknown>
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error()
    data = body as Record<string, unknown>
  } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
  if (Object.keys(data).some(k => !['experienceId','heroAssetUrl','approvedLiveChange'].includes(k))
    || typeof data.experienceId !== 'string' || !data.experienceId
    || (data.heroAssetUrl !== null && typeof data.heroAssetUrl !== 'string')
    || (data.approvedLiveChange !== undefined && typeof data.approvedLiveChange !== 'boolean')) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  try {
    return NextResponse.json({ success: true, data: await updateMerchantExperienceHero({
      userId: auth.userId, merchantId: params.merchantId, experienceId: data.experienceId,
      heroAssetUrl: data.heroAssetUrl as string | null,
      approvedLiveChange: data.approvedLiveChange as boolean | undefined,
    }) })
  } catch (error) {
    if (error instanceof BrandKitError) return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: error.httpStatus })
    return merchantAgentErrorResponse(error)
  }
}
