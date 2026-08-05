import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import {
  createStoreRuntime,
  getMerchantInsights,
  storeErrorResponse,
} from '@/modules/store/application'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const runtime = createStoreRuntime()
    const insights = await getMerchantInsights({
      merchants: runtime.merchants,
      events: runtime.events,
      merchantId: params.id,
      recordInsightsViewed: true,
    })

    return NextResponse.json({ success: true, data: insights })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
