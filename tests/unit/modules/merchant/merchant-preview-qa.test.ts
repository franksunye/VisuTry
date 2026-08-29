/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn(), update: jest.fn() },
    merchantBillingAccount: { findUnique: jest.fn(), update: jest.fn() },
    merchantBillingEvent: { count: jest.fn(), findMany: jest.fn() },
    experience: { count: jest.fn() },
    merchantFrame: { count: jest.fn() },
    merchantUsageLedger: { count: jest.fn(), findMany: jest.fn(), createMany: jest.fn() },
    user: { findUnique: jest.fn() },
    merchantMembership: { upsert: jest.fn() },
    $transaction: jest.fn(),
    environmentMetadata: { findUnique: jest.fn() },
  },
}))

jest.mock('@/modules/merchant/application/merchant-commercial-entitlements', () => ({
  getMerchantCommercialState: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getMerchantCommercialState } from '@/modules/merchant/application/merchant-commercial-entitlements'
import {
  PREVIEW_QA_MERCHANTS,
  PREVIEW_QA_USAGE_THRESHOLDS,
  PreviewQaGuardError,
  assertPreviewQaMerchant,
  expirePreviewPilot,
  parsePreviewQaMerchantAlias,
  usageCountForThreshold,
  validatePreviewQaEnvironment,
} from '@/modules/merchant/application/merchant-preview-qa'

const previewEnv = {
  VERCEL_ENV: 'preview',
  APP_ENV: 'preview',
  VISUTRY_PREVIEW_QA: '1',
  VISUTRY_DATABASE_IDENTITY: 'preview-db',
  DATABASE_URL: 'postgresql://preview-db/neondb',
  STRIPE_MERCHANT_BILLING_MODE: 'test',
  STRIPE_SECRET_KEY: 'sk_test_preview',
  STRIPE_FOUNDING_PILOT_PRICE_ID: 'price_founding_pilot',
}

const qaPilot = {
  id: 'qa-pilot-id',
  slug: PREVIEW_QA_MERCHANTS['QA-PILOT'].slug,
  name: PREVIEW_QA_MERCHANTS['QA-PILOT'].name,
  classification: 'TEST',
  classificationSource: 'G4C_PREVIEW_QA_HARNESS',
  classificationReason: 'G4-C Preview QA harness QA-PILOT; non-commercial test data.',
  status: 'ACTIVE',
  planCode: 'FOUNDING_PILOT',
  commercialStatus: 'PILOT_ACTIVE',
  commercialStage: 'MARKET_CAPTURE',
  pricingVersion: 'v1',
  entitlementVersion: 'v1',
  commerceSessionAllowance: null,
  standardRenderAllowance: null,
  campaignAllowance: null,
  entitlementEffectiveFrom: new Date('2026-08-01T00:00:00.000Z'),
  billingPeriodEnd: new Date('2026-08-31T00:00:00.000Z'),
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
}

describe('G4-C Preview QA harness guardrails', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv, ...previewEnv }
    jest.clearAllMocks()
    ;(prisma.environmentMetadata.findUnique as jest.Mock).mockResolvedValue({ environment: 'PREVIEW', databaseIdentity: 'preview-db' })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('requires the explicit Preview QA flag and refuses production first', () => {
    expect(() => validatePreviewQaEnvironment({ ...previewEnv, VERCEL_ENV: 'production' })).toThrow(PreviewQaGuardError)
    expect(() => validatePreviewQaEnvironment({ ...previewEnv, VISUTRY_PREVIEW_QA: '0' })).toThrow(/VISUTRY_PREVIEW_QA=1/)
    expect(() => validatePreviewQaEnvironment({ ...previewEnv, VERCEL_ENV: 'development' })).toThrow(/VERCEL_ENV=preview/)
    expect(validatePreviewQaEnvironment(previewEnv)).toEqual({ environment: 'preview', stripeMode: 'test', qaFlag: '1' })
  })

  it('rejects production hosts and non-test Stripe keys', () => {
    expect(() => validatePreviewQaEnvironment({ ...previewEnv, NEXT_PUBLIC_SITE_URL: 'https://www.visutry.com' })).toThrow(/production application URL/)
    expect(() => validatePreviewQaEnvironment({ ...previewEnv, STRIPE_SECRET_KEY: 'sk_live_forbidden' })).toThrow(/Stripe TEST secret key/)
    expect(() => validatePreviewQaEnvironment({ ...previewEnv, STRIPE_MERCHANT_BILLING_MODE: 'live' })).toThrow(/STRIPE_MERCHANT_BILLING_MODE=test/)
  })

  it('allows only fixed QA aliases and TEST merchants', () => {
    expect(parsePreviewQaMerchantAlias('qa-free')).toBe('QA-FREE')
    expect(() => parsePreviewQaMerchantAlias('arbitrary-merchant')).toThrow(/QA-FREE/)
    expect(() => assertPreviewQaMerchant({ id: 'real-1', classification: 'REAL' })).toThrow(/REAL Merchant/)
    expect(() => assertPreviewQaMerchant({ id: 'external-1', classification: 'POSSIBLE_EXTERNAL' })).toThrow(/classification TEST/)
    expect(() => assertPreviewQaMerchant({ id: 'test-1', classification: 'TEST' })).not.toThrow()
  })

  it.each(PREVIEW_QA_USAGE_THRESHOLDS)('maps %d%% to a canonical append-only usage count', (percentage) => {
    expect(usageCountForThreshold(1000, percentage)).toBe(Math.round(1000 * percentage / 100))
  })

  it('requires a real Stripe TEST Pilot receipt before the expiry mutation', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(qaPilot)
    ;(getMerchantCommercialState as jest.Mock).mockResolvedValue({
      commercialState: 'CANONICAL', status: 'PILOT_ACTIVE', planCode: 'FOUNDING_PILOT',
      period: { kind: 'fixed_30_days', start: qaPilot.entitlementEffectiveFrom, end: qaPilot.billingPeriodEnd },
      usage: { aiCommerceSessions: 0, activeCampaigns: 0, catalogItems: 0, standardTryOnGenerations: 0 },
      aiCommerceSessionLimit: 1500, aiCommerceSessionPercentage: 0, threshold: 'NORMAL',
      featureAvailability: { STORE: true, GENERATIVE_TRY_ON: true },
    })
    ;(prisma.merchantBillingAccount.findUnique as jest.Mock).mockResolvedValue({ stripePriceId: 'price_founding_pilot', stripeSubscriptionId: null, subscriptionStatus: 'paid', stripeCustomerId: 'cus_test' })
    ;(prisma.experience.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.merchantFrame.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.merchantBillingEvent.count as jest.Mock).mockReturnValue(0)
    ;(prisma.merchantBillingEvent.findMany as jest.Mock).mockResolvedValue([])

    await expect(expirePreviewPilot({ merchant: 'QA-PILOT' })).rejects.toThrow(/No PROCESSED Stripe TEST event/)
    expect(prisma.merchant.update).not.toHaveBeenCalled()
  })

  it('expires only an activated TEST Pilot, preserves receipt revenue, and keeps Store live', async () => {
    ;(prisma.merchant.findUnique as jest.Mock).mockResolvedValue(qaPilot)
    ;(getMerchantCommercialState as jest.Mock)
      .mockResolvedValueOnce({ commercialState: 'CANONICAL', status: 'PILOT_ACTIVE', planCode: 'FOUNDING_PILOT', period: { kind: 'fixed_30_days', start: qaPilot.entitlementEffectiveFrom, end: qaPilot.billingPeriodEnd }, usage: { aiCommerceSessions: 0, activeCampaigns: 0, catalogItems: 1, standardTryOnGenerations: 0 }, aiCommerceSessionLimit: 1500, aiCommerceSessionPercentage: 0, threshold: 'NORMAL', featureAvailability: { STORE: true, GENERATIVE_TRY_ON: true } })
      .mockResolvedValueOnce({ commercialState: 'CANONICAL', status: 'PILOT_EXPIRED', planCode: 'FOUNDING_PILOT', period: { kind: 'fixed_30_days', start: qaPilot.entitlementEffectiveFrom, end: new Date('2026-08-01T00:00:00.000Z') }, usage: { aiCommerceSessions: 0, activeCampaigns: 0, catalogItems: 1, standardTryOnGenerations: 0 }, aiCommerceSessionLimit: 1500, aiCommerceSessionPercentage: 0, threshold: 'NORMAL', featureAvailability: { STORE: true, GENERATIVE_TRY_ON: false } })
    ;(prisma.merchantBillingAccount.findUnique as jest.Mock).mockResolvedValue({ stripePriceId: 'price_founding_pilot', stripeSubscriptionId: null, subscriptionStatus: 'paid', stripeCustomerId: 'cus_test' })
    ;(prisma.experience.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.merchantFrame.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.merchantBillingEvent.count as jest.Mock).mockReturnValue(1)
    ;(prisma.merchantBillingEvent.findMany as jest.Mock).mockResolvedValue([{ stripePriceId: 'price_founding_pilot', status: 'PROCESSED', eventType: 'checkout.session.completed', providerEventId: 'evt_pilot', stripeCheckoutSessionId: 'cs_pilot' }])
    ;(prisma.merchant.update as jest.Mock).mockResolvedValue({ id: qaPilot.id })

    const result = await expirePreviewPilot({ merchant: 'QA-PILOT' })

    expect(result.pass).toBe(true)
    expect(result.revenueBeforeCents).toBe(0)
    expect(result.revenueAfterCents).toBe(0)
    expect(prisma.merchant.update).toHaveBeenCalledWith(expect.objectContaining({ data: { billingPeriodEnd: expect.any(Date) } }))
    expect(prisma.merchant.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ planCode: expect.anything() }) }))
  })
})
