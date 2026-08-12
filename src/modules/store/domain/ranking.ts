/**
 * Deterministic merchant-frame ranking adapter (pure, unit-testable).
 * Does not make medical, prescription, PD, or guaranteed-fit claims.
 */

import { frameShapePreference } from './frame-fit-preferences'

export const STORE_RANKING_VERSION = 'store-rank-v2'

export type ShopperAnalysisSignals = {
  faceShape?: string | null
  faceShapeConfidence?: number | null
  alternativeFaceShapes?: string[]
  preferredWidthClass?: 'narrow' | 'medium' | 'wide' | null
  faceAspectRatio?: number | null
  jawProfile?: 'tapered' | 'balanced' | 'strong' | null
  upperFaceProfile?: 'narrower' | 'balanced' | 'broad' | null
  styleHints?: string[]
  geometryQualityScore?: number | null
}

export type RankableMerchantFrame = {
  id: string
  merchantId: string
  name: string
  shape: string
  material?: string | null
  color?: string | null
  widthClass?: string | null
  styleTags: string[]
}

export type RankedMerchantFrame = {
  frameId: string
  score: number
  reason: string
  usedAlternativeShape: boolean
}

export type RankingResult = {
  rankingVersion: string
  frames: RankedMerchantFrame[]
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

const SOFT_SILHOUETTES = new Set(['round', 'oval', 'cat-eye'])
const STRUCTURED_SILHOUETTES = new Set(['rectangle', 'square', 'geometric', 'browline'])
const UPPER_FACE_BALANCING_SILHOUETTES = new Set(['round', 'oval', 'aviator'])
const NARROW_UPPER_FACE_SILHOUETTES = new Set(['browline', 'cat-eye', 'aviator'])

function scoreFrame(
  frame: RankableMerchantFrame,
  signals: ShopperAnalysisSignals,
): { score: number; reason: string; usedAlternativeShape: boolean } {
  const reasons: string[] = []
  const shape = normalize(frame.shape)
  const faceShape = normalize(signals.faceShape)
  const geometryReliability = geometryReliabilityFor(signals)
  const shapeMatch = scoreFaceShape(shape, faceShape, signals.alternativeFaceShapes ?? [], geometryReliability)
  const widthMatch = scoreWidth(frame.widthClass, signals.preferredWidthClass, geometryReliability)
  const structuralMatch = scoreStructuralBalance(shape, signals)
  const styleMatch = scoreStyleHints(frame.styleTags, signals.styleHints)
  const metadataScore = (frame.material ? 1 : 0) + (frame.color ? 1 : 0)

  const rawScore = 20 + shapeMatch.score + widthMatch.score + structuralMatch.score + styleMatch.score + metadataScore
  const score = normalizeScore(rawScore)

  if (shapeMatch.reason) reasons.push(shapeMatch.reason)
  if (widthMatch.reason) reasons.push(widthMatch.reason)
  if (structuralMatch.reason) reasons.push(structuralMatch.reason)
  if (styleMatch.reason) reasons.push(styleMatch.reason)

  return {
    score,
    reason: reasons[0] ?? 'A considered option from this merchant catalog based on available style signals',
    usedAlternativeShape: shapeMatch.usedAlternativeShape,
  }
}

/**
 * Rank active merchant frames for one tenant.
 * Tolerates sparse metadata. Returns 4–8 frames when enough candidates exist.
 */
export function rankMerchantFrames(
  frames: RankableMerchantFrame[],
  signals: ShopperAnalysisSignals,
  options?: { limit?: number; merchantId?: string },
): RankingResult {
  const limit = Math.min(Math.max(options?.limit ?? 6, 4), 8)
  const merchantId = options?.merchantId

  const candidates = frames.filter((frame) => {
    if (merchantId && frame.merchantId !== merchantId) return false
    return Boolean(frame.id)
  })

  const ranked = candidates
    .map((frame) => {
      const { score, reason, usedAlternativeShape } = scoreFrame(frame, signals)
      return { frameId: frame.id, score, reason, usedAlternativeShape }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.frameId.localeCompare(b.frameId)
    })
    .slice(0, Math.min(limit, rankedLengthOrAll(candidates.length, limit)))

  return {
    rankingVersion: STORE_RANKING_VERSION,
    frames: ranked,
  }
}

function scoreFaceShape(
  frameShape: string,
  primaryFaceShape: string,
  alternativeFaceShapes: string[],
  geometryReliability: number,
): { score: number; reason: string | null; usedAlternativeShape: boolean } {
  if (!frameShape) return { score: 0, reason: null, usedAlternativeShape: false }

  const primaryPreference = frameShapePreference(primaryFaceShape)
  if (primaryPreference?.primary.includes(frameShape)) {
    return {
      score: 38 * geometryReliability,
      reason: `Balances your ${primaryFaceShape} face with a ${silhouetteDescription(frameShape)}.`,
      usedAlternativeShape: false,
    }
  }
  if (primaryPreference?.secondary.includes(frameShape)) {
    return {
      score: 24 * geometryReliability,
      reason: `A considered ${silhouetteDescription(frameShape)} for your ${primaryFaceShape} proportions.`,
      usedAlternativeShape: false,
    }
  }

  for (const alternative of alternativeFaceShapes.map(normalize)) {
    const preference = frameShapePreference(alternative)
    if (preference?.primary.includes(frameShape)) {
      return {
        score: 20 * geometryReliability,
        reason: `Complements your ${primaryFaceShape || alternative}-to-${alternative} proportions with a ${silhouetteDescription(frameShape)}.`,
        usedAlternativeShape: true,
      }
    }
    if (preference?.secondary.includes(frameShape)) {
      return {
        score: 12 * geometryReliability,
        reason: `A flexible ${silhouetteDescription(frameShape)} for your measured proportions.`,
        usedAlternativeShape: true,
      }
    }
  }

  return { score: 0, reason: null, usedAlternativeShape: false }
}

function scoreWidth(
  frameWidth: string | null | undefined,
  preferredWidth: ShopperAnalysisSignals['preferredWidthClass'],
  geometryReliability: number,
): { score: number; reason: string | null } {
  const normalizedFrameWidth = normalize(frameWidth)
  const normalizedPreferredWidth = normalize(preferredWidth)
  if (!normalizedFrameWidth || !normalizedPreferredWidth) return { score: 0, reason: null }
  if (normalizedFrameWidth === normalizedPreferredWidth) {
    return {
      score: 20 * geometryReliability,
      reason: `A ${normalizedFrameWidth}-width frame that aligns with your measured proportions.`,
    }
  }
  return { score: 0, reason: null }
}

function scoreStructuralBalance(
  shape: string,
  signals: ShopperAnalysisSignals,
): { score: number; reason: string | null } {
  if (!shape) return { score: 0, reason: null }

  let score = 0
  let reason: string | null = null
  if (signals.jawProfile === 'strong' && SOFT_SILHOUETTES.has(shape)) {
    score += 4
    reason = 'Its softer silhouette adds visual balance to stronger jaw proportions.'
  } else if (signals.jawProfile === 'tapered' && STRUCTURED_SILHOUETTES.has(shape)) {
    score += 4
    reason = 'Its defined silhouette adds balance to tapered jaw proportions.'
  }

  if (signals.upperFaceProfile === 'broad' && UPPER_FACE_BALANCING_SILHOUETTES.has(shape)) {
    score += 3
    reason ??= 'Its rounded balance complements broader upper-face proportions.'
  } else if (signals.upperFaceProfile === 'narrower' && NARROW_UPPER_FACE_SILHOUETTES.has(shape)) {
    score += 3
    reason ??= 'Its upper-line detail complements narrower upper-face proportions.'
  }

  return { score: Math.min(score, 7), reason }
}

function scoreStyleHints(
  styleTags: string[],
  styleHints: string[] | undefined,
): { score: number; reason: string | null } {
  const hints = (styleHints ?? []).map(normalize).filter(Boolean)
  const tags = styleTags.map(normalize)
  const tagHits = hints.filter((hint) => tags.includes(hint) || tags.some((tag) => tag.includes(hint)))
  if (tagHits.length === 0) return { score: 0, reason: null }
  const visibleHits = tagHits.slice(0, 2)
  return {
    score: Math.min(tagHits.length, 2) * 4.5,
    reason: `Matches your ${visibleHits.join(' / ')} style cues.`,
  }
}

function geometryReliabilityFor(signals: ShopperAnalysisSignals): number {
  if (!signals.faceShape && !signals.preferredWidthClass && !signals.jawProfile && !signals.upperFaceProfile) {
    return 0
  }
  const confidence = clamp(
    signals.faceShapeConfidence ?? (signals.faceShape ? 0.76 : 0.7),
    0.25,
    1,
  )
  const quality = clamp(
    (signals.geometryQualityScore ?? (signals.faceShape || signals.preferredWidthClass ? 82 : 0)) / 100,
    0.25,
    1,
  )
  return clamp(confidence * 0.65 + quality * 0.35, 0.25, 1)
}

function normalizeScore(rawScore: number): number {
  return Math.round(clamp(rawScore, 0, 100))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function silhouetteDescription(shape: string): string {
  switch (shape) {
    case 'rectangle':
    case 'square':
    case 'geometric':
      return 'more angular silhouette'
    case 'round':
    case 'oval':
      return 'softer rounded silhouette'
    case 'cat-eye':
      return 'lifted cat-eye silhouette'
    case 'aviator':
      return 'balanced aviator silhouette'
    case 'browline':
      return 'defined browline silhouette'
    default:
      return `${shape} silhouette`
  }
}

function rankedLengthOrAll(available: number, limit: number): number {
  if (available <= 0) return 0
  if (available < 4) return available
  return limit
}
