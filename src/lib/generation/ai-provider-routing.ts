/**
 * One server-only operator switch for new Grsai-backed AI work.
 * An already accepted task must always finish with its pinned provider.
 * No implicit failure-driven cross-provider resubmission is permitted.
 */
export type AiProvider = 'grsai' | 'kie'
export type TryOnSurface = 'consumer' | 'store'

export function activeAiProvider(): AiProvider {
  const selected = process.env.AI_PROVIDER
  if (selected === undefined || selected === '' || selected === 'grsai') return 'grsai'
  if (selected !== 'kie') throw new Error('Invalid AI_PROVIDER setting; expected grsai or kie')
  if (!process.env.KIE_API_KEY) throw new Error('AI_PROVIDER=kie requires KIE_API_KEY')
  return 'kie'
}

/** Surface is intentionally ignored: Consumer and Store/Campaign switch together. */
export function selectNewTryOnProvider(_surface: TryOnSurface): AiProvider {
  return activeAiProvider()
}

export function selectFaceAnalysisProvider(): AiProvider {
  return activeAiProvider()
}
