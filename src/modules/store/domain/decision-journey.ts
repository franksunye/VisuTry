/**
 * Platform-owned shopper capabilities. This is intentionally a closed list:
 * an Experience can select from these stages, but cannot invent a workflow,
 * reorder runtime steps, or attach arbitrary scripts.
 */
export const DECISION_JOURNEY_STAGES = [
  'FACE_ANALYSIS',
  'FIT_PROFILE',
  'RECOMMENDATION',
  'TRY_ON',
  'COMPARE',
] as const

export type DecisionJourneyStage = (typeof DECISION_JOURNEY_STAGES)[number]

export type DecisionJourneyPolicy = {
  enabledStages: DecisionJourneyStage[]
}

export const DEFAULT_DECISION_JOURNEY_POLICY: DecisionJourneyPolicy = {
  enabledStages: [...DECISION_JOURNEY_STAGES],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function canonicalStages(value: unknown): DecisionJourneyStage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const stages = value.filter((stage): stage is DecisionJourneyStage =>
    typeof stage === 'string' && (DECISION_JOURNEY_STAGES as readonly string[]).includes(stage),
  )
  if (stages.length !== value.length) return null
  if (new Set(stages).size !== stages.length) return null
  const expectedOrder = DECISION_JOURNEY_STAGES.filter((stage) => stages.includes(stage))
  if (expectedOrder.length !== stages.length || expectedOrder.some((stage, index) => stage !== stages[index])) return null
  return stages
}

/** Throws when an admin/configuration payload is outside the platform contract. */
export function assertDecisionJourneyPolicy(value: unknown): asserts value is DecisionJourneyPolicy {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== 'enabledStages')) {
    throw new Error('journeyPolicy must contain only enabledStages')
  }
  const stages = canonicalStages(value.enabledStages)
  if (!stages) throw new Error('journeyPolicy.enabledStages must be a unique canonical stage list')
  if (!stages.includes('FACE_ANALYSIS') || !stages.includes('RECOMMENDATION')) {
    throw new Error('FACE_ANALYSIS and RECOMMENDATION are required journey stages')
  }
  if (stages.includes('FIT_PROFILE') && !stages.includes('FACE_ANALYSIS')) {
    throw new Error('FIT_PROFILE requires FACE_ANALYSIS')
  }
  if (stages.includes('TRY_ON') && !stages.includes('RECOMMENDATION')) {
    throw new Error('TRY_ON requires RECOMMENDATION')
  }
  if (stages.includes('COMPARE') && !stages.includes('TRY_ON')) {
    throw new Error('COMPARE requires TRY_ON')
  }
}

/**
 * Reads nullable persisted JSON. Invalid legacy/config rows fail closed to the
 * backward-compatible default rather than making the public Store unavailable.
 */
export function resolveDecisionJourneyPolicy(value: unknown): DecisionJourneyPolicy {
  if (value == null) return { ...DEFAULT_DECISION_JOURNEY_POLICY, enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] }
  try {
    assertDecisionJourneyPolicy(value)
    return { enabledStages: [...value.enabledStages] }
  } catch {
    return { ...DEFAULT_DECISION_JOURNEY_POLICY, enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] }
  }
}

/** Merchant policy remains the commercial ceiling for Experience capabilities. */
export function applyMerchantDecisionJourneyCeiling(
  journey: DecisionJourneyPolicy,
  merchant: { tryOnEnabled?: boolean | null; compareEnabled?: boolean | null },
): DecisionJourneyPolicy {
  let enabledStages = [...journey.enabledStages]
  if (merchant.tryOnEnabled === false) {
    enabledStages = enabledStages.filter((stage) => stage !== 'TRY_ON' && stage !== 'COMPARE')
  }
  if (merchant.compareEnabled === false) {
    enabledStages = enabledStages.filter((stage) => stage !== 'COMPARE')
  }
  return { enabledStages }
}
