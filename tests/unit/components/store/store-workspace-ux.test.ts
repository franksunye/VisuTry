import { resolveStoreJourneyProgress, resolveStoreSelectionCtaState, resolveStoreWorkspaceStep } from '@/components/store/store-workspace-ux'

describe('Store workspace progression', () => {
  it('keeps a selected-but-not-continued shopper in Choose frames', () => {
    expect(resolveStoreWorkspaceStep({ photoReady: true, selectionContinued: false, tryOnEnabled: true })).toBe(2)
    expect(resolveStoreSelectionCtaState({ selectionContinued: false, tryOnEnabled: true })).toBe('try-on-selected')
  })

  it('moves to Start Try-On after the selection continuation succeeds', () => {
    expect(resolveStoreWorkspaceStep({ photoReady: true, selectionContinued: true, tryOnEnabled: true })).toBe(3)
    expect(resolveStoreSelectionCtaState({ selectionContinued: true, tryOnEnabled: true })).toBe('continue-to-try-on')
  })

  it('retains a save state for catalogs without try-on enabled', () => {
    expect(resolveStoreSelectionCtaState({ selectionContinued: false, tryOnEnabled: false })).toBe('save-selection')
  })

  it('renders policy-defined stages and advances Compare only after the compare event succeeds', () => {
    const stages = ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'] as const
    expect(resolveStoreJourneyProgress({
      enabledStages: [...stages],
      photoReady: true,
      recommendationReady: true,
      selectionContinued: true,
      compareStarted: false,
    })).toEqual([
      { stage: 'FACE_ANALYSIS', active: false, complete: true },
      { stage: 'RECOMMENDATION', active: false, complete: true },
      { stage: 'TRY_ON', active: true, complete: false },
      { stage: 'COMPARE', active: false, complete: false },
    ])
    expect(resolveStoreJourneyProgress({
      enabledStages: [...stages],
      photoReady: true,
      recommendationReady: true,
      selectionContinued: true,
      compareStarted: true,
    }).at(-1)).toEqual({ stage: 'COMPARE', active: true, complete: false })
  })
})
