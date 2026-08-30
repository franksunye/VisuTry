/** @jest-environment node */

import React from 'react'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NOT_FOUND') }),
  redirect: jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
jest.mock('@/lib/auth-runtime', () => ({ authOptions: {} }))
jest.mock('@/modules/merchant/application/merchant-memberships', () => ({ listMerchantsForUser: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({ requireMerchantMembership: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-commercial-entitlements', () => ({ getMerchantCommercialState: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-billing', () => ({ getMerchantBillingState: jest.fn(), hasMerchantFoundingPilotReceipt: jest.fn() }))
jest.mock('@/components/merchant/MerchantPurchaseSummary', () => ({
  MerchantPurchaseSummary: (props: { merchantId: string; intent: string; action: string }) => <div data-merchant-id={props.merchantId} data-purchase-intent={props.intent} data-purchase-action={props.action} />,
}))

import { getServerSession } from 'next-auth'
import { listMerchantsForUser } from '@/modules/merchant/application/merchant-memberships'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantCommercialState } from '@/modules/merchant/application/merchant-commercial-entitlements'
import { getMerchantBillingState, hasMerchantFoundingPilotReceipt } from '@/modules/merchant/application/merchant-billing'
import MerchantPurchasePage from '@/app/[locale]/merchant/purchase/page'

describe('Merchant purchase summary route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } })
    ;(listMerchantsForUser as jest.Mock).mockResolvedValue([{ merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', status: 'ACTIVE' }, membership: { role: 'OWNER' } }])
    ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({ planCode: null, plan: null, status: 'LEGACY_UNMIGRATED' })
    ;(getMerchantBillingState as jest.Mock).mockResolvedValue({ state: { kind: 'NO_SUBSCRIPTION', reason: null, providerPlanCode: null, providerSubscriptionStatus: null, cancelAtPeriodEnd: false }, billing: null, policy: { environment: 'local', stripeMode: 'test', liveBillingAllowed: false, testBillingAllowed: true, billingWritesAllowed: true, disabledReason: null } })
    ;(hasMerchantFoundingPilotReceipt as jest.Mock).mockResolvedValue(false)
  })

  it('returns a canonical order summary for the preserved Growth intent', async () => {
    const result = await MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a', commercialIntent: 'GROWTH' } })
    expect(result).toMatchObject({ props: { merchantId: 'merchant-a', intent: 'GROWTH', action: 'CHECKOUT' } })
    expect(requireMerchantMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
  })

  it('uses the supported change-plan path for an existing subscription', async () => {
    ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({ planCode: 'LAUNCH', plan: { name: 'Launch' }, status: 'PAID_ACTIVE' })
    ;(getMerchantBillingState as jest.Mock).mockResolvedValue({ state: { kind: 'VALID_SUBSCRIPTION', reason: null, providerPlanCode: 'LAUNCH', providerSubscriptionStatus: 'active', cancelAtPeriodEnd: false }, billing: { stripeSubscriptionId: 'sub-1', subscriptionStatus: 'active' }, policy: { environment: 'local', stripeMode: 'test', liveBillingAllowed: false, testBillingAllowed: true, billingWritesAllowed: true, disabledReason: null } })
    const result = await MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a', commercialIntent: 'GROWTH' } })
    expect(result).toMatchObject({ props: { intent: 'GROWTH', action: 'CHANGE_PLAN' } })
  })

  it('routes a policy-disabled workspace to a safe non-write state', async () => {
    ;(getMerchantBillingState as jest.Mock).mockResolvedValue({ state: { kind: 'BILLING_DISABLED', reason: 'BILLING_POLICY_DISABLED', providerPlanCode: null, providerSubscriptionStatus: null, cancelAtPeriodEnd: false }, billing: null, policy: { environment: 'production', stripeMode: 'live', liveBillingAllowed: false, testBillingAllowed: false, billingWritesAllowed: false, disabledReason: 'POLICY_DISABLED' } })
    const result = await MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a', commercialIntent: 'GROWTH' } })
    expect(result).toMatchObject({ props: { intent: 'GROWTH', action: 'BILLING_DISABLED' } })
  })

  it('routes an unverified provider subscription to recovery without checkout fallback', async () => {
    ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({ planCode: 'LAUNCH', plan: { name: 'Launch' }, status: 'PAID_ACTIVE' })
    ;(getMerchantBillingState as jest.Mock).mockResolvedValue({ state: { kind: 'SUBSCRIPTION_MISSING', reason: 'SUBSCRIPTION_NOT_FOUND', providerPlanCode: null, providerSubscriptionStatus: 'active', cancelAtPeriodEnd: false }, billing: { stripeSubscriptionId: 'sub-missing', subscriptionStatus: 'active' }, policy: { environment: 'production', stripeMode: 'live', liveBillingAllowed: true, testBillingAllowed: false, billingWritesAllowed: true, disabledReason: null } })
    const result = await MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a', commercialIntent: 'GROWTH' } })
    expect(result).toMatchObject({ props: { intent: 'GROWTH', action: 'BILLING_RECOVERY' } })
  })

  it('routes a former Pilot with a receipt away from another Pilot checkout', async () => {
    ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({ planCode: 'LAUNCH', plan: { name: 'Launch' }, status: 'PAID_ACTIVE' })
    ;(hasMerchantFoundingPilotReceipt as jest.Mock).mockResolvedValue(true)
    const result = await MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a', commercialIntent: 'FOUNDING_PILOT' } })
    expect(result).toMatchObject({ props: { intent: 'FOUNDING_PILOT', action: 'DUPLICATE_PILOT' } })
  })

  it('sends an authenticated user without a Merchant to the preserved onboarding flow', async () => {
    ;(listMerchantsForUser as jest.Mock).mockResolvedValue([])
    await expect(MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { commercialIntent: 'LAUNCH' } })).rejects.toThrow('REDIRECT:/en/merchant?commercialIntent=LAUNCH')
  })

  it('does not accept an unsupported or Enterprise purchase intent', async () => {
    await expect(MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { commercialIntent: 'price_live_123' } })).rejects.toThrow('REDIRECT:/en/business/pricing')
    await expect(MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { commercialIntent: 'ENTERPRISE' } })).rejects.toThrow('REDIRECT:/en/business/pricing')
  })
})
