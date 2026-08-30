/** @jest-environment jsdom */

jest.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => body }) },
}))

import { billingErrorResponse } from '@/app/api/merchant/[merchantId]/billing/billing-http'
import { MerchantBillingError } from '@/modules/merchant/application/merchant-billing'

describe('Merchant billing HTTP error contract', () => {
  it('returns an explicit disabled state without a generic provider error', async () => {
    const response = billingErrorResponse(new MerchantBillingError('BILLING_DISABLED', 'Live billing is disabled for this workspace.', 403))
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ success: false, error: 'BILLING_DISABLED', message: expect.stringContaining('No charge was made.') })
  })

  it('returns actionable recovery language for missing subscriptions', async () => {
    const response = billingErrorResponse(new MerchantBillingError('SUBSCRIPTION_MISSING', 'subscription missing', 409))
    await expect(response.json()).resolves.toMatchObject({ success: false, error: 'SUBSCRIPTION_MISSING', message: expect.stringContaining('Your current plan is unchanged.') })
  })

  it('keeps unknown failures safe and actionable', async () => {
    const response = billingErrorResponse(new Error('provider outage'))
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ success: false, error: 'BILLING_UNAVAILABLE', message: expect.stringContaining('No charge was made.') })
  })
})
