import { merchantCommercialActionLabel, merchantCommercialStatusCopy } from '@/modules/merchant/domain/merchant-commercial-copy'
import type { MerchantCommercialPrimaryAction } from '@/modules/merchant/domain/merchant-commercial-copy'

describe('merchantCommercialActionLabel', () => {
  it.each([
    ['ENROLL_PLAN', 'Choose a plan'],
    ['UNLOCK_AI_TRY_ON', 'Unlock AI Try-On'],
    ['UPGRADE_CAPACITY', 'Upgrade capacity'],
    ['RESTORE_AI_CAPACITY', 'Restore AI capacity'],
    ['CONTINUE_AFTER_PILOT', 'Continue after Pilot'],
    ['RESOLVE_PAYMENT', 'Review payment status'],
    ['MANAGE_PLAN', 'Manage plan'],
    ['NONE', 'View plan options'],
  ] as const)('keeps %s label canonical', (action, expected) => {
    expect(merchantCommercialActionLabel(action as MerchantCommercialPrimaryAction)).toBe(expected)
  })
})

describe('merchantCommercialStatusCopy', () => {
  it.each([
    ['PAYMENT_ACTION_REQUIRED', null, 'Action is needed to restore paid features.'],
    ['PAST_DUE', null, 'Action is needed to restore paid features.'],
    ['USAGE_EXHAUSTED', 'LIMIT_REACHED', 'AI Try-On is paused. Your Store remains live.'],
    ['EXPIRED', null, 'This commercial period has ended. Your Store and catalog remain available.'],
    ['PILOT_EXPIRED', null, 'Your Founding Pilot has ended. Your Store and catalog remain available.'],
  ] as const)('returns the existing factual %s copy', (status, threshold, expected) => {
    expect(merchantCommercialStatusCopy({ status, threshold, daysRemaining: null }, 'ACTIVE')).toBe(expected)
  })

  it('preserves existing Free, Pilot, warning, legacy, and cancellation copy', () => {
    expect(merchantCommercialStatusCopy({ status: 'FREE', threshold: null, daysRemaining: null }, 'DRAFT')).toBe('Your Store is in draft on the Free plan.')
    expect(merchantCommercialStatusCopy({ status: 'PILOT_ACTIVE', threshold: 'NORMAL', daysRemaining: 3 })).toBe('Your Founding Pilot ends in 3 days. Choose how to continue.')
    expect(merchantCommercialStatusCopy({ status: 'USAGE_WARNING', threshold: 'WARNING', daysRemaining: null })).toBe('You’re close to your monthly AI Commerce Session limit.')
    expect(merchantCommercialStatusCopy({ status: 'LEGACY_UNMIGRATED', threshold: null, daysRemaining: null })).toBe('This Store is still using its existing access while you choose a current plan.')
    expect(merchantCommercialStatusCopy({ status: 'CANCEL_AT_PERIOD_END', threshold: null, daysRemaining: null })).toBe('Your current plan remains active through the end of this period.')
  })
})
