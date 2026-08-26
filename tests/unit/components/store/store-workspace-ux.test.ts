import { resolveStoreSelectionCtaState, resolveStoreWorkspaceStep } from '@/components/store/store-workspace-ux'

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
})
