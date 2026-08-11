import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { getExperienceAdminWorkspace } from '@/modules/store/application'
import { storeErrorResponse } from '@/modules/store/application'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const rawFilter = request.nextUrl.searchParams.get('type')?.toUpperCase() || 'ALL'
    const filter = rawFilter === 'STORE' || rawFilter === 'CAMPAIGN' ? rawFilter : 'ALL'
    const workspace = await getExperienceAdminWorkspace({ merchantId: params.id, filter })
    if (!workspace) return NextResponse.json({ success: false, error: 'Merchant not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: workspace })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
