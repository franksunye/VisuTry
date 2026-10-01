import { DECISION_JOURNEY_STAGES, type DecisionJourneyStage } from './decision-journey'

export const DECISION_RESULT_SCHEMA_VERSION = 2
export const DECISION_RESULT_TTL_HOURS = 24
export const DECISION_RESULT_MAX_FRAME_REFS = 12
export const DECISION_RESULT_MAX_TRYON_REFS = 12

export type DecisionResultFrameReference = {
  frameId: string
  sku: string | null
  name: string
  imageUrl: string | null
  productUrl: string | null
  score: number
  reason: string
}

export type DecisionResultTryOnReference =
  | {
      source: 'LIVE_TRYON'
      taskId: string
      frameId: string
      status: 'COMPLETED'
      completedAt: string
    }
  | {
      source: 'PREPARED_DEMO'
      sourceRef: {
        assetKey: string
        provenanceId: string
        manifestVersion: string
        shopperProfileId: string
        shopperProfileVersion: string
      }
      frameId: string
      status: 'PREPARED'
      presentedAt: string
    }

export type LiveDecisionResultTryOnReference = Extract<DecisionResultTryOnReference, { source: 'LIVE_TRYON' }>
export type PreparedDemoDecisionResultReference = Extract<DecisionResultTryOnReference, { source: 'PREPARED_DEMO' }>

export type DecisionResultJourneyContext = {
  experienceId: string | null
  experienceType: 'STORE' | 'CAMPAIGN'
  experienceSlug: string | null
  enabledStages: DecisionJourneyStage[]
}

export type DecisionResultFaceFitSummary = {
  faceShape: string | null
  alternativeShapes: string[]
  preferredWidthClass: string | null
  geometryQualityBand: string | null
  qualityScore: number | null
  signalCount: number
}

export type CanonicalDecisionResultPayload = {
  schemaVersion: typeof DECISION_RESULT_SCHEMA_VERSION
  journey: DecisionResultJourneyContext
  faceFit: DecisionResultFaceFitSummary | null
  recommendation: {
    rankingVersion: string
    frames: DecisionResultFrameReference[]
  } | null
  selectedFrameIds: string[]
  favoriteFrameIds: string[]
  tryOnResults: DecisionResultTryOnReference[]
  compare: {
    startedAt: string
    frameIds: string[]
  } | null
}

export function decisionResultExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + DECISION_RESULT_TTL_HOURS * 60 * 60 * 1000)
}

export function emptyDecisionResultPayload(input: {
  experienceId?: string | null
  experienceType?: 'STORE' | 'CAMPAIGN'
  experienceSlug?: string | null
  enabledStages?: DecisionJourneyStage[]
} = {}): CanonicalDecisionResultPayload {
  return {
    schemaVersion: DECISION_RESULT_SCHEMA_VERSION,
    journey: {
      experienceId: input.experienceId ?? null,
      experienceType: input.experienceType ?? 'STORE',
      experienceSlug: input.experienceSlug ?? null,
      enabledStages: [...(input.enabledStages ?? [])],
    },
    faceFit: null,
    recommendation: null,
    selectedFrameIds: [],
    favoriteFrameIds: [],
    tryOnResults: [],
    compare: null,
  }
}

export function uniqueBounded(values: string[], limit: number): string[] {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].slice(0, limit)
}

function sanitizeCatalogImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048 || value.trim() !== value) return null
  if (/^[\u0000-\u0020]/.test(value) || /[\u0000-\u001f]/.test(value)) return null

  if (value.startsWith('/')) {
    // Keep repository-owned/public root assets, but never persist a private API
    // route (which could refer to shopper media or another session resource).
    if (value.startsWith('//') || value.startsWith('/api/')) return null
    return value
  }

  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null
    return value
  } catch {
    return null
  }
}

export function sanitizeDecisionResultPayload(value: unknown): CanonicalDecisionResultPayload {
  const fallback = emptyDecisionResultPayload()
  if (!value || typeof value !== 'object') return fallback
  const input = value as Partial<CanonicalDecisionResultPayload>
  const journey = input.journey && typeof input.journey === 'object' ? input.journey : fallback.journey
  const recommendation = input.recommendation && typeof input.recommendation === 'object' ? input.recommendation : null
  const frames = Array.isArray(recommendation?.frames)
    ? recommendation.frames.flatMap((frame) => {
        if (!frame || typeof frame !== 'object') return []
        const candidate = frame as Partial<DecisionResultFrameReference>
        if (typeof candidate.frameId !== 'string' || candidate.frameId.length === 0) return []
        return [{
          frameId: candidate.frameId,
          sku: typeof candidate.sku === 'string' ? candidate.sku : null,
          name: typeof candidate.name === 'string' ? candidate.name : 'Recommended frame',
          imageUrl: sanitizeCatalogImageUrl(candidate.imageUrl),
          productUrl: typeof candidate.productUrl === 'string' ? candidate.productUrl : null,
          score: typeof candidate.score === 'number' && Number.isFinite(candidate.score) ? candidate.score : 0,
          reason: typeof candidate.reason === 'string' ? candidate.reason : '',
        }]
      }).slice(0, DECISION_RESULT_MAX_FRAME_REFS)
    : []
  const tryOnResults = Array.isArray(input.tryOnResults)
    ? input.tryOnResults.flatMap<DecisionResultTryOnReference>((result) => {
        if (!result || typeof result !== 'object') return []
        const candidate = result as Record<string, unknown>
        if (typeof candidate.frameId !== 'string' || candidate.frameId.length === 0) return []
        if (
          candidate.source === 'PREPARED_DEMO' &&
          candidate.status === 'PREPARED' &&
          typeof candidate.presentedAt === 'string' &&
          candidate.sourceRef && typeof candidate.sourceRef === 'object'
        ) {
          const sourceRef = candidate.sourceRef as Record<string, unknown>
          if (
            typeof sourceRef.assetKey !== 'string' || !sourceRef.assetKey ||
            typeof sourceRef.provenanceId !== 'string' || !sourceRef.provenanceId ||
            typeof sourceRef.manifestVersion !== 'string' || !sourceRef.manifestVersion ||
            typeof sourceRef.shopperProfileId !== 'string' || !sourceRef.shopperProfileId ||
            typeof sourceRef.shopperProfileVersion !== 'string' || !sourceRef.shopperProfileVersion
          ) return []
          return [{
            source: 'PREPARED_DEMO' as const,
            sourceRef: {
              assetKey: sourceRef.assetKey,
              provenanceId: sourceRef.provenanceId,
              manifestVersion: sourceRef.manifestVersion,
              shopperProfileId: sourceRef.shopperProfileId,
              shopperProfileVersion: sourceRef.shopperProfileVersion,
            },
            frameId: candidate.frameId,
            status: 'PREPARED' as const,
            presentedAt: candidate.presentedAt,
          }]
        }

        // Backward compatibility: schema-v1 payloads persisted only taskId.
        // Never reinterpret an untyped value as PREPARED_DEMO.
        if (
          typeof candidate.taskId !== 'string' ||
          candidate.taskId.length === 0 ||
          candidate.status !== 'COMPLETED' ||
          typeof candidate.completedAt !== 'string'
        ) return []
        return [{
          source: 'LIVE_TRYON' as const,
          taskId: candidate.taskId,
          frameId: candidate.frameId,
          status: 'COMPLETED' as const,
          completedAt: candidate.completedAt,
        }]
      }).slice(0, DECISION_RESULT_MAX_TRYON_REFS)
    : []
  const enabledStages = Array.isArray(journey.enabledStages)
    ? journey.enabledStages.filter((stage): stage is DecisionJourneyStage =>
        typeof stage === 'string' && (DECISION_JOURNEY_STAGES as readonly string[]).includes(stage),
      )
    : []
  return {
    schemaVersion: DECISION_RESULT_SCHEMA_VERSION,
    journey: {
      experienceId: typeof journey.experienceId === 'string' ? journey.experienceId : null,
      experienceType: journey.experienceType === 'CAMPAIGN' ? 'CAMPAIGN' : 'STORE',
      experienceSlug: typeof journey.experienceSlug === 'string' ? journey.experienceSlug : null,
      enabledStages,
    },
    faceFit: input.faceFit && typeof input.faceFit === 'object' ? {
      faceShape: typeof input.faceFit.faceShape === 'string' ? input.faceFit.faceShape : null,
      alternativeShapes: Array.isArray(input.faceFit.alternativeShapes) ? input.faceFit.alternativeShapes.filter((shape): shape is string => typeof shape === 'string').slice(0, 5) : [],
      preferredWidthClass: typeof input.faceFit.preferredWidthClass === 'string' ? input.faceFit.preferredWidthClass : null,
      geometryQualityBand: typeof input.faceFit.geometryQualityBand === 'string' ? input.faceFit.geometryQualityBand : null,
      qualityScore: typeof input.faceFit.qualityScore === 'number' ? input.faceFit.qualityScore : null,
      signalCount: typeof input.faceFit.signalCount === 'number' ? input.faceFit.signalCount : 0,
    } : null,
    recommendation: recommendation && typeof recommendation.rankingVersion === 'string' ? {
      rankingVersion: recommendation.rankingVersion,
      frames,
    } : null,
    selectedFrameIds: uniqueBounded(Array.isArray(input.selectedFrameIds) ? input.selectedFrameIds.filter((id): id is string => typeof id === 'string') : [], DECISION_RESULT_MAX_FRAME_REFS),
    favoriteFrameIds: uniqueBounded(Array.isArray(input.favoriteFrameIds) ? input.favoriteFrameIds.filter((id): id is string => typeof id === 'string') : [], DECISION_RESULT_MAX_FRAME_REFS),
    tryOnResults,
    compare: input.compare && typeof input.compare === 'object' && typeof input.compare.startedAt === 'string' ? {
      startedAt: input.compare.startedAt,
      frameIds: uniqueBounded(Array.isArray(input.compare.frameIds) ? input.compare.frameIds.filter((id): id is string => typeof id === 'string') : [], DECISION_RESULT_MAX_FRAME_REFS),
    } : null,
  }
}
