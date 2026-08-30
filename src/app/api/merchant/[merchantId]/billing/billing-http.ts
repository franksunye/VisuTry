import { NextResponse } from 'next/server'
import { MerchantBillingError } from '@/modules/merchant/application/merchant-billing'

function merchantBillingMessage(code: string, message: string) {
  if (message.includes('No charge was made.') && message.includes('current plan is unchanged.')) return message
  if (code === 'BILLING_DISABLED') return 'Live billing is disabled for this workspace. No charge was made. Your current plan is unchanged.'
  if (code === 'SUBSCRIPTION_MISSING' || code === 'BILLING_RECOVERY_REQUIRED' || code === 'SUBSCRIPTION_NOT_FOUND') return 'We could not verify the current billing subscription. No charge was made. Your current plan is unchanged.'
  if (code === 'SUBSCRIPTION_INVALID' || code === 'BILLING_IDENTITY_MISMATCH' || code === 'SUBSCRIPTION_NOT_SUPPORTED') return 'The current billing subscription is not valid for this workspace. No charge was made. Your current plan is unchanged.'
  if (code === 'PROVIDER_UNAVAILABLE' || code === 'BILLING_CONFIGURATION_ERROR' || code === 'BILLING_MODE_NOT_CONFIGURED' || code === 'STRIPE_ENVIRONMENT_MISMATCH') return 'We could not reach the billing provider. No charge was made. Your current plan is unchanged.'
  return `${message} No charge was made. Your current plan is unchanged.`
}

export function billingErrorResponse(error: unknown) {
  if (error instanceof MerchantBillingError || (error && typeof error === 'object' && 'code' in error && 'httpStatus' in error)) {
    const value = error as { code: string; httpStatus: number; message: string; decision?: Record<string, unknown> }
    return NextResponse.json({ success: false, error: value.code, message: merchantBillingMessage(value.code, value.message), ...(value.decision ? { decision: value.decision } : {}) }, { status: value.httpStatus })
  }
  return NextResponse.json({ success: false, error: 'BILLING_UNAVAILABLE', message: 'We could not reach the billing provider. No charge was made. Your current plan is unchanged. Please try again later.' }, { status: 503 })
}

export function merchantBillingUrl(origin: string, merchantId: string, locale = 'en') {
  const safeLocale = /^[a-z]{2}(?:-[A-Z]{2})?$/u.test(locale) ? locale : 'en'
  return new URL(`/${safeLocale}/merchant`, origin)
}
