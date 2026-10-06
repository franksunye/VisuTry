import type { MerchantCommercialState } from '@/modules/store/domain/merchant-commercial-state'

export type MerchantCommercialCopyState = Pick<MerchantCommercialState, 'status' | 'threshold'> & {
  daysRemaining?: number | null
}

export type MerchantCommercialPrimaryAction = MerchantCommercialState['primaryAction']

export function merchantCommercialStatusCopy(commercial: MerchantCommercialCopyState, storeStatus?: string | null): string {
  if (commercial.status === 'DEMO_ACTIVE') return 'VisuTry Demo access is active. No subscription or payment is required.'
  if (commercial.status === 'LEGACY_UNMIGRATED') return 'This Store is still using its existing access while you choose a current plan.'
  if (commercial.status === 'FREE') {
    if (storeStatus === 'DRAFT') return 'Your Store is in draft on the Free plan.'
    if (storeStatus === 'ACTIVE') return 'Your Store is live on the Free plan.'
    return 'Your Store access is on the Free plan.'
  }
  if (commercial.status === 'PILOT_ACTIVE') {
    const days = commercial.daysRemaining ?? null
    if (days !== null && days <= 3) return `Your Founding Pilot ends in ${days} day${days === 1 ? '' : 's'}. Choose how to continue.`
    if (days !== null && days <= 7) return `Your Founding Pilot ends in ${days} days.`
    return days === null ? 'Your Founding Pilot is active.' : `${days} day${days === 1 ? '' : 's'} remaining in your Founding Pilot.`
  }
  if (commercial.status === 'PILOT_EXPIRED') return 'Your Founding Pilot has ended. Your Store and catalog remain available.'
  if (commercial.status === 'USAGE_WARNING') return commercial.threshold === 'WARNING' ? 'You’re close to your monthly AI Commerce Session limit.' : 'You’ve used most of this period’s AI Commerce Sessions.'
  if (commercial.status === 'USAGE_EXHAUSTED') return 'AI Try-On is paused. Your Store remains live.'
  if (commercial.status === 'PAYMENT_ACTION_REQUIRED' || commercial.status === 'PAST_DUE') return 'Action is needed to restore paid features.'
  if (commercial.status === 'CANCEL_AT_PERIOD_END') return 'Your current plan remains active through the end of this period.'
  if (commercial.status === 'EXPIRED') return 'This commercial period has ended. Your Store and catalog remain available.'
  return 'Your commercial plan is active.'
}

export function merchantCommercialActionLabel(action: MerchantCommercialPrimaryAction): string {
  switch (action) {
    case 'ENROLL_PLAN': return 'Choose a plan'
    case 'UNLOCK_AI_TRY_ON': return 'Unlock AI Try-On'
    case 'UPGRADE_CAPACITY': return 'Upgrade capacity'
    case 'RESTORE_AI_CAPACITY': return 'Restore AI capacity'
    case 'CONTINUE_AFTER_PILOT': return 'Continue after Pilot'
    case 'RESOLVE_PAYMENT': return 'Review payment status'
    case 'MANAGE_PLAN': return 'Manage plan'
    default: return 'View plan options'
  }
}
