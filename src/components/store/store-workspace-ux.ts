export type StoreWorkspaceStep = 1 | 2 | 3

export type StoreSelectionCtaState = 'try-on-selected' | 'continue-to-try-on' | 'save-selection'

export function resolveStoreWorkspaceStep(input: {
  photoReady: boolean
  selectionContinued: boolean
  tryOnEnabled: boolean
}): StoreWorkspaceStep {
  if (input.selectionContinued && input.tryOnEnabled) return 3
  if (input.photoReady) return 2
  return 1
}

export function resolveStoreSelectionCtaState(input: {
  selectionContinued: boolean
  tryOnEnabled: boolean
}): StoreSelectionCtaState {
  if (!input.tryOnEnabled) return 'save-selection'
  return input.selectionContinued ? 'continue-to-try-on' : 'try-on-selected'
}
