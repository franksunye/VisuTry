import type { DecisionJourneyStage } from '@/modules/store/domain/decision-journey'

export type StoreWorkspaceStep = 1 | 2 | 3

export type StoreJourneyProgress = {
  stage: DecisionJourneyStage
  active: boolean
  complete: boolean
}

export function resolveStoreJourneyProgress(input: {
  enabledStages: DecisionJourneyStage[]
  photoReady: boolean
  recommendationReady: boolean
  selectionContinued: boolean
  compareStarted: boolean
}): StoreJourneyProgress[] {
  const recommendationIndex = input.enabledStages.indexOf('RECOMMENDATION')
  const tryOnIndex = input.enabledStages.indexOf('TRY_ON')
  const compareIndex = input.enabledStages.indexOf('COMPARE')
  const activeIndex = !input.photoReady
    ? 0
    : !input.recommendationReady
      ? Math.max(0, recommendationIndex)
      : !input.selectionContinued
        ? Math.max(0, recommendationIndex)
        : compareIndex >= 0 && input.compareStarted
          ? compareIndex
          : tryOnIndex >= 0
            ? tryOnIndex
            : Math.max(0, recommendationIndex)

  return input.enabledStages.map((stage, index) => ({
    stage,
    active: index === activeIndex,
    complete: index < activeIndex,
  }))
}

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
