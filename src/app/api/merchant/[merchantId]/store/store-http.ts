import { NextResponse } from 'next/server'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { MerchantOnboardingError } from '@/modules/merchant/application/merchant-onboarding'

function isCatalogSelectionConflict(error: unknown): error is Error & { code: string; httpStatus: number } {
  return error instanceof Error
    && 'code' in error && error.code === 'CATALOG_SELECTION_NOT_ACTIVE'
    && 'httpStatus' in error && error.httpStatus === 409
}

export function storeErrorResponse(error: unknown): NextResponse {
  if (error instanceof MerchantAccessError) {
    return NextResponse.json({ success: false, error: error.code }, { status: error.httpStatus })
  }
  if (error instanceof MerchantOnboardingError) {
    return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: error.httpStatus })
  }
  if (isCatalogSelectionConflict(error)) {
    return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: 409 })
  }
  console.error('Merchant Store request failed:', error)
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
}
