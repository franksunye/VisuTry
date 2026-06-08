import faceShapesData from '../../data/face-shapes.json'
import {
  CANONICAL_FACE_SHAPES,
  CanonicalFaceShape,
  isCanonicalFaceShape,
} from '@/config/face-analysis'
import {
  FaceAnalysisAiResult,
  FaceAnalysisBasicResult,
  FaceAnalysisFullResult,
  FaceAnalysisLockedTeaser,
} from '@/types/face-analysis'

const shapeCatalog = faceShapesData as Array<{
  name: string
  displayName: string
  recommendedStyles: string[]
  avoidStyles: string[]
}>

function normalizeShape(value: unknown): CanonicalFaceShape {
  if (typeof value !== 'string') return 'oval'
  const normalized = value.toLowerCase().trim()
  if (isCanonicalFaceShape(normalized)) return normalized
  return 'oval'
}

function toStringArray(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, max)
}

export function parseFaceAnalysisContent(raw: string): FaceAnalysisAiResult {
  const trimmed = raw.trim()
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('AI response was not valid JSON')
  }

  const faceShape = normalizeShape(parsed.faceShape)
  const confidenceRaw = typeof parsed.confidence === 'number' ? parsed.confidence : 0.75
  const confidence = Math.min(1, Math.max(0, confidenceRaw))

  return {
    faceShape,
    confidence,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    keyFeatures: toStringArray(parsed.keyFeatures, 5),
    bestFrames: toStringArray(parsed.bestFrames, 5),
    framesToAvoid: toStringArray(parsed.framesToAvoid, 4),
    styleGuide: typeof parsed.styleGuide === 'string' ? parsed.styleGuide : '',
  }
}

function getCatalogEntry(shape: CanonicalFaceShape) {
  return shapeCatalog.find((entry) => entry.name === shape)
}

export function buildBasicResult(ai: FaceAnalysisAiResult): FaceAnalysisBasicResult {
  const catalog = getCatalogEntry(ai.faceShape)
  return {
    faceShape: ai.faceShape,
    faceShapeDisplayName: catalog?.displayName ?? ai.faceShape,
    confidence: ai.confidence,
    summary: ai.summary || catalog?.displayName || 'Face analysis complete',
    keyFeatures:
      ai.keyFeatures.length > 0
        ? ai.keyFeatures
        : catalog
          ? [catalog.displayName]
          : [],
  }
}

export function buildLockedTeaser(full: FaceAnalysisFullResult): FaceAnalysisLockedTeaser {
  return {
    bestFrames: full.bestFrames.slice(0, 2),
    framesToAvoid: full.framesToAvoid.slice(0, 1),
    catalogRecommendedStyles: full.catalogRecommendedStyles,
  }
}

export function buildFullResult(ai: FaceAnalysisAiResult): FaceAnalysisFullResult {
  const basic = buildBasicResult(ai)
  const catalog = getCatalogEntry(ai.faceShape)

  return {
    ...basic,
    bestFrames:
      ai.bestFrames.length > 0
        ? ai.bestFrames
        : (catalog?.recommendedStyles ?? []).map((s) => `${s} frames`),
    framesToAvoid:
      ai.framesToAvoid.length > 0
        ? ai.framesToAvoid
        : (catalog?.avoidStyles ?? []).map((s) => `${s} frames`),
    styleGuide: ai.styleGuide || basic.summary,
    catalogRecommendedStyles: catalog?.recommendedStyles,
    catalogAvoidStyles: catalog?.avoidStyles,
  }
}

export function fallbackAiResult(): FaceAnalysisAiResult {
  return {
    faceShape: 'oval',
    confidence: 0.5,
    summary: 'Unable to determine face shape with high confidence.',
    keyFeatures: ['Balanced proportions'],
    bestFrames: ['aviator frames', 'clubmaster frames'],
    framesToAvoid: ['overly narrow frames'],
    styleGuide: 'Consider trying a few different frame widths to find your best match.',
  }
}

export function isValidCanonicalList(): boolean {
  return CANONICAL_FACE_SHAPES.every((shape) =>
    shapeCatalog.some((entry) => entry.name === shape)
  )
}
