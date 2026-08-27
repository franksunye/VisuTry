import { NextResponse } from 'next/server'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access-cloudflare'
import { MerchantOnboardingError } from '@/modules/merchant/application/merchant-onboarding-cloudflare'

export function storeErrorResponse(error: unknown): NextResponse {
  if (error instanceof MerchantAccessError) {
    return NextResponse.json({ success: false, error: error.code }, { status: error.httpStatus })
  }
  if (error instanceof MerchantOnboardingError) {
    return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: error.httpStatus })
  }
  console.error('Merchant Store request failed:', error)
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
}
