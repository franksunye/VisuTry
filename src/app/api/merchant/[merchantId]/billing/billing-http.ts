import { NextResponse } from 'next/server'
import { MerchantBillingError } from '@/modules/merchant/application/merchant-billing'

export function billingErrorResponse(error: unknown) {
  if (error instanceof MerchantBillingError || (error && typeof error === 'object' && 'code' in error && 'httpStatus' in error)) {
    const value = error as { code: string; httpStatus: number; message: string; decision?: Record<string, unknown> }
    return NextResponse.json({ success: false, error: value.code, message: value.message, ...(value.decision ? { decision: value.decision } : {}) }, { status: value.httpStatus })
  }
  return NextResponse.json({ success: false, error: 'BILLING_UNAVAILABLE', message: 'Billing is temporarily unavailable. Please try again later.' }, { status: 503 })
}

export function merchantBillingUrl(origin: string, merchantId: string, locale = 'en') {
  const safeLocale = /^[a-z]{2}(?:-[A-Z]{2})?$/u.test(locale) ? locale : 'en'
  return new URL(`/${safeLocale}/merchant`, origin)
}
