import { NextResponse } from 'next/server'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { CampaignServiceError } from '@/modules/store/application/campaign-service'

export function campaignErrorResponse(error: unknown): NextResponse {
  if (error instanceof MerchantAccessError) {
    return NextResponse.json({ success: false, error: error.code }, { status: error.httpStatus })
  }
  if (error && typeof error === 'object' && 'decision' in error && 'code' in error && 'httpStatus' in error) {
    const commercial = error as { code: string; httpStatus: number; message: string; decision?: { current?: number; limit?: number | null; recommendedPlan?: string | null } }
    return NextResponse.json({
      success: false,
      error: commercial.code,
      message: commercial.message,
      decision: {
        current: commercial.decision?.current,
        limit: commercial.decision?.limit,
        recommendedPlan: commercial.decision?.recommendedPlan,
      },
    }, { status: commercial.httpStatus })
  }
  if (error instanceof CampaignServiceError) {
    return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: error.httpStatus })
  }
  console.error('Merchant Campaign request failed:', error)
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
}
