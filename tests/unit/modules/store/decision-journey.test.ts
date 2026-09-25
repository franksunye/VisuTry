import {
  applyMerchantDecisionJourneyCeiling,
  assertDecisionJourneyPolicy,
  DEFAULT_DECISION_JOURNEY_POLICY,
  resolveDecisionJourneyPolicy,
} from '@/modules/store/domain/decision-journey'

describe('Decision Journey policy', () => {
  it('preserves the full default for nullable legacy Experiences', () => {
    expect(resolveDecisionJourneyPolicy(null)).toEqual(DEFAULT_DECISION_JOURNEY_POLICY)
  })

  it('accepts only canonical subsets and rejects arbitrary workflow order', () => {
    const policy = { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] as const }
    expect(() => assertDecisionJourneyPolicy(policy)).not.toThrow()
    expect(() => assertDecisionJourneyPolicy({ enabledStages: ['FACE_ANALYSIS', 'TRY_ON', 'RECOMMENDATION'] })).toThrow(/canonical/i)
    expect(() => assertDecisionJourneyPolicy({ enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'COMPARE'] })).toThrow(/requires TRY_ON/i)
  })

  it('fails closed to the default when stored JSON is malformed', () => {
    expect(resolveDecisionJourneyPolicy({ enabledStages: ['FACE_ANALYSIS', 'custom-script'] })).toEqual(DEFAULT_DECISION_JOURNEY_POLICY)
  })

  it('lets Experience narrow the journey while Merchant remains the commercial ceiling', () => {
    const experience = resolveDecisionJourneyPolicy({
      enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'],
    })
    expect(applyMerchantDecisionJourneyCeiling(experience, { tryOnEnabled: false, compareEnabled: true }).enabledStages).toEqual([
      'FACE_ANALYSIS',
      'RECOMMENDATION',
    ])
  })
})
