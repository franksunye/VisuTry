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
jest.mock('@/modules/merchant/application/merchant-billing', () => ({ getMerchantBillingSummary: jest.fn() }))
jest.mock('@/components/merchant/MerchantPurchaseSummary', () => ({
  MerchantPurchaseSummary: (props: { merchantId: string; intent: string; action: string }) => <div data-merchant-id={props.merchantId} data-purchase-intent={props.intent} data-purchase-action={props.action} />,
}))

import { getServerSession } from 'next-auth'
import { listMerchantsForUser } from '@/modules/merchant/application/merchant-memberships'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantCommercialState } from '@/modules/merchant/application/merchant-commercial-entitlements'
import { getMerchantBillingSummary } from '@/modules/merchant/application/merchant-billing'
import MerchantPurchasePage from '@/app/[locale]/merchant/purchase/page'

describe('Merchant purchase summary route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } })
    ;(listMerchantsForUser as jest.Mock).mockResolvedValue([{ merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', status: 'ACTIVE' }, membership: { role: 'OWNER' } }])
    ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({ planCode: null, plan: null, status: 'LEGACY_UNMIGRATED' })
    ;(getMerchantBillingSummary as jest.Mock).mockResolvedValue(null)
  })

  it('returns a canonical order summary for the preserved Growth intent', async () => {
    const result = await MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a', commercialIntent: 'GROWTH' } })
    expect(result).toMatchObject({ props: { merchantId: 'merchant-a', intent: 'GROWTH', action: 'CHECKOUT' } })
    expect(requireMerchantMembership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] })
  })

  it('uses the supported change-plan path for an existing subscription', async () => {
    ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({ planCode: 'LAUNCH', plan: { name: 'Launch' }, status: 'PAID_ACTIVE' })
    ;(getMerchantBillingSummary as jest.Mock).mockResolvedValue({ stripeSubscriptionId: 'sub-1', subscriptionStatus: 'active' })
    const result = await MerchantPurchasePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a', commercialIntent: 'GROWTH' } })
    expect(result).toMatchObject({ props: { intent: 'GROWTH', action: 'CHANGE_PLAN' } })
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
