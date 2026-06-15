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
  FaceGeometryAnalysis,
  FaceAnalysisLockedTeaser,
} from '@/types/face-analysis'
import {
  buildAvoidRecommendations,
  buildFaceMetrics,
  buildFrameRecommendations,
  buildReportStrengths,
  buildStyleTips,
  buildTryOnGuidance,
  getReportDisclaimer,
} from '@/lib/face-analysis-report'

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
    strengths: toStringArray(parsed.strengths, 3),
    styleRecommendations: toStringArray(parsed.styleRecommendations, 3),
  }
}

function getCatalogEntry(shape: CanonicalFaceShape) {
  return shapeCatalog.find((entry) => entry.name === shape)
}

export function buildBasicResult(
  ai: FaceAnalysisAiResult,
  geometry?: FaceGeometryAnalysis | null
): FaceAnalysisBasicResult {
  const catalog = getCatalogEntry(ai.faceShape)
  return {
    faceShape: ai.faceShape,
    faceShapeDisplayName: catalog?.displayName ?? ai.faceShape,
    confidence: ai.confidence,
    summary: ai.summary || catalog?.displayName || 'Face analysis complete',
    keyFeatures:
      geometry?.status === 'measured' && geometry.signals.length > 0
        ? Array.from(new Set([...geometry.signals.slice(0, 2), ...ai.keyFeatures])).slice(0, 5)
        : ai.keyFeatures.length > 0
        ? ai.keyFeatures
        : catalog
          ? [catalog.displayName]
          : [],
    geometry: geometry ?? undefined,
  }
}

export function buildLockedTeaser(full: FaceAnalysisFullResult): FaceAnalysisLockedTeaser {
  return {
    bestFrames: full.bestFrames.slice(0, 2),
    framesToAvoid: full.framesToAvoid.slice(0, 1),
    catalogRecommendedStyles: full.catalogRecommendedStyles,
  }
}

export function buildFullResult(
  ai: FaceAnalysisAiResult,
  geometry?: FaceGeometryAnalysis | null
): FaceAnalysisFullResult {
  const basic = buildBasicResult(ai, geometry)
  const catalog = getCatalogEntry(ai.faceShape)
  const frameRecommendations = buildFrameRecommendations(ai.faceShape)
  const avoidRecommendations = buildAvoidRecommendations(ai.faceShape)
  const styleTips = buildStyleTips(ai.faceShape, ai.styleRecommendations)
  const strengths = buildReportStrengths(ai.faceShape, ai.strengths)

  return {
    ...basic,
    reportVersion: 'v2',
    bestFrames:
      ai.bestFrames.length > 0
        ? ai.bestFrames
        : frameRecommendations.map((item) => `${item.displayName} frames`),
    framesToAvoid:
      ai.framesToAvoid.length > 0
        ? ai.framesToAvoid
        : avoidRecommendations.map((item) => `${item.displayName} frames`),
    styleGuide: ai.styleGuide || basic.summary,
    catalogRecommendedStyles: catalog?.recommendedStyles,
    catalogAvoidStyles: catalog?.avoidStyles,
    overview: {
      summary: ai.summary || basic.summary,
      strengths: geometry?.status === 'measured'
        ? Array.from(new Set([...geometry.signals.slice(0, 2), ...strengths])).slice(0, 3)
        : strengths,
      disclaimer: getReportDisclaimer(),
    },
    metrics: buildFaceMetrics(ai.faceShape, ai.confidence, geometry),
    frameRecommendations,
    avoidRecommendations,
    styleTips,
    tryOnGuidance: buildTryOnGuidance(ai.faceShape),
    geometry: geometry ?? undefined,
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
    strengths: ['Balanced proportions'],
    styleRecommendations: ['Try multiple frame widths before choosing.'],
  }
}

export function isValidCanonicalList(): boolean {
  return CANONICAL_FACE_SHAPES.every((shape) =>
    shapeCatalog.some((entry) => entry.name === shape)
  )
}
