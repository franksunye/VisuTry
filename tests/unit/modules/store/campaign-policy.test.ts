import {
  resolveCampaignConversionPolicy,
  resolveCampaignPresentationMode,
} from '@/modules/store/domain/campaign-policy'
import { resolvePresentationMode } from '@/modules/store/domain/presentation-mode'

describe('Campaign policy foundation', () => {
  it('defaults historical Campaigns without policy fields', () => {
    expect(resolveCampaignConversionPolicy({ type: 'CAMPAIGN' })).toEqual({ objective: 'INTENT', gate: 'NONE' })
    expect(resolveCampaignPresentationMode({ experienceType: 'CAMPAIGN' })).toBe('EDITORIAL_FIRST')
  })

  it('keeps Stores outside Campaign conversion policy', () => {
    expect(resolveCampaignConversionPolicy({ type: 'STORE' })).toBeNull()
    expect(resolveCampaignPresentationMode({ experienceType: 'STORE' })).toBe('PRODUCT_FIRST')
  })

  it('uses persisted bounded values and preserves contextual ACTION_FIRST', () => {
    expect(resolveCampaignConversionPolicy({ type: 'CAMPAIGN', campaignObjective: 'TRAFFIC', campaignGate: 'NONE' })).toEqual({ objective: 'TRAFFIC', gate: 'NONE' })
    expect(resolveCampaignConversionPolicy({ type: 'CAMPAIGN', campaignObjective: 'LEAD', campaignGate: 'OPT_IN_AFTER_VALUE' })).toEqual({ objective: 'LEAD', gate: 'OPT_IN_AFTER_VALUE' })
    expect(resolveCampaignPresentationMode({ experienceType: 'CAMPAIGN', persistedPresentationMode: 'ACTION_FIRST' })).toBe('ACTION_FIRST')
    expect(resolvePresentationMode({ experienceType: 'CAMPAIGN', persistedPresentationMode: 'EDITORIAL_FIRST', acquisitionSurface: 'face_analysis' })).toBe('EDITORIAL_FIRST')
  })
})
