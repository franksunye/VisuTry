import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import {
  createStoreRuntime,
  getMerchantInsights,
  storeErrorResponse,
} from '@/modules/store/application'
import { getExperienceAnalyticsSummary, MerchantAnalyticsError } from '@/modules/store/application/merchant-analytics'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const experienceId = request.nextUrl.searchParams.get('experienceId')?.trim() || null
    if (experienceId) {
      const summary = await getExperienceAnalyticsSummary({
        actor: { actorType: 'SYSTEM', actorId: `admin:${auth.userId}`, merchantId: params.id },
        experienceId,
        from: request.nextUrl.searchParams.get('from'),
        to: request.nextUrl.searchParams.get('to'),
      })
      return NextResponse.json({ success: true, data: summary })
    }

    const runtime = createStoreRuntime()
    const insights = await getMerchantInsights({
      merchants: runtime.merchants,
      events: runtime.events,
      merchantId: params.id,
      experienceId,
      recordInsightsViewed: true,
    })

    return NextResponse.json({ success: true, data: insights })
  } catch (error) {
    if (error instanceof MerchantAnalyticsError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.httpStatus })
    }
    return storeErrorResponse(error)
  }
}
