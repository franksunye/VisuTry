import {
  CanonicalFaceShape,
  isCanonicalFaceShape,
  isFaceShapeFailureReason,
} from '@/config/face-analysis'
import {
  FaceAnalysisMetric,
  FaceGeometryAnalysis,
  FaceGeometryRatios,
} from '@/types/face-analysis'

// Keep existing imports and persisted landmark-v1 reports compatible while all
// runtime geometry/classification uses the shared SDK implementation.
export {
  analyzeFaceLandmarks,
  classifyFaceGeometry,
  classifyJawProfile,
  classifyUpperFaceProfile,
} from '@/lib/face-geometry-sdk'
export type {
  FaceGeometryMeasurementOptions,
  FaceJawProfile,
  FaceUpperProfile,
} from '@/lib/face-geometry-sdk'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function measuredMetric(
  id: FaceAnalysisMetric['id'],
  label: string,
  value: string,
  caption: string,
  detail: string,
  score: number
): FaceAnalysisMetric {
  return { id, label, value, caption, detail, score, source: 'landmark' }
}

export function buildMeasuredFaceMetrics(
  shape: CanonicalFaceShape,
  confidence: number,
  geometry?: FaceGeometryAnalysis | null,
  options?: { interpretation?: 'landmark-only' | 'ai-assisted' }
): FaceAnalysisMetric[] | null {
  if (!geometry || geometry.status !== 'measured' || !geometry.ratios) return null

  const ratios = geometry.ratios
  const shapeLabel = `${shape[0].toUpperCase()}${shape.slice(1)}`
  const matchScore = Math.round((geometry.measuredShape === shape
    ? Math.max(confidence, geometry.measuredConfidence ?? confidence)
    : confidence) * 100)

  const lengthValue =
    ratios.faceAspectRatio >= 1.42 ? 'Long' : ratios.faceAspectRatio < 1.2 ? 'Short to Medium' : 'Balanced'
  const widthValue =
    ratios.cheekToFaceWidth >= 0.88 ? 'Wide' : ratios.cheekToFaceWidth < 0.8 ? 'Narrow to Balanced' : 'Balanced'
  const jawValue =
    ratios.jawToCheekWidth >= 0.94 ? 'Strong' : ratios.jawToCheekWidth <= 0.78 ? 'Tapered' : 'Moderate'
  const cheekValue =
    ratios.foreheadToCheekWidth < 0.84 && ratios.jawToCheekWidth < 0.82
      ? 'Prominent'
      : ratios.cheekToFaceWidth >= 0.86
        ? 'Defined'
        : 'Balanced'
  const symmetryValue =
    ratios.symmetryOffset <= 0.035 ? 'Well aligned' : ratios.symmetryOffset <= 0.07 ? 'Acceptable' : 'Approximate'
  const alignmentCaption =
    ratios.symmetryOffset <= 0.035 ? 'Centered in photo' : ratios.symmetryOffset <= 0.07 ? 'Slightly offset' : 'Retake if possible'
  const landmarkOnly = options?.interpretation === 'landmark-only'

  return [
    measuredMetric(
      'faceShape',
      'Face Shape',
      shapeLabel,
      landmarkOnly ? 'Geometry match' : 'Measured + AI',
      landmarkOnly
        ? `Landmark ratios from this photo support a ${shapeLabel.toLowerCase()} face-shape estimate.`
        : `Landmark ratios support a ${shapeLabel.toLowerCase()} face reading; AI styling review is used as a second check.`,
      clamp(matchScore, 68, 96)
    ),
    measuredMetric(
      'faceLength',
      'Face Length',
      lengthValue,
      `${ratios.faceAspectRatio}:1`,
      'Measured from upper-face reference point to chin, compared with facial width.',
      scoreFromRatio(ratios.faceAspectRatio, 1.34, 0.28)
    ),
    measuredMetric(
      'faceWidth',
      'Face Width',
      widthValue,
      `${Math.round(ratios.cheekToFaceWidth * 100)}% cheek span`,
      'Measured cheekbone span compared with the outer face width visible in the photo.',
      scoreFromRatio(ratios.cheekToFaceWidth, 0.86, 0.16)
    ),
    measuredMetric(
      'jawline',
      'Jawline',
      jawValue,
      `${Math.round(ratios.jawToCheekWidth * 100)}% of cheek width`,
      'Measured lower-face width compared with cheekbone width to estimate jaw structure.',
      scoreFromRatio(ratios.jawToCheekWidth, 0.88, 0.2)
    ),
    measuredMetric(
      'cheekbones',
      'Cheekbone Span',
      cheekValue,
      `${Math.round(ratios.foreheadToCheekWidth * 100)}% upper ratio`,
      'Measured upper-face and jaw ratios indicate whether cheekbones are the widest visual anchor.',
      scoreFromRatio(1 - Math.abs(0.84 - ratios.foreheadToCheekWidth), 0.96, 0.2)
    ),
    measuredMetric(
      'symmetry',
      'Photo Alignment',
      symmetryValue,
      alignmentCaption,
      'Checks how closely the visible nose bridge aligns with the face center in this photo; it does not measure facial symmetry.',
      clamp(Math.round(96 - ratios.symmetryOffset * 180), 68, 96)
    ),
  ]
}

function scoreFromRatio(value: number, target: number, tolerance: number): number {
  return clamp(Math.round(96 - (Math.abs(value - target) / tolerance) * 22), 68, 96)
}

export function normalizeGeometryAnalysis(value: unknown): FaceGeometryAnalysis | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<FaceGeometryAnalysis>
  if (candidate.version !== 'landmark-v1') return null
  if (candidate.status !== 'measured' && candidate.status !== 'unavailable') return null

  const shape = typeof candidate.measuredShape === 'string' && isCanonicalFaceShape(candidate.measuredShape)
    ? candidate.measuredShape
    : undefined
  const alternativeShapes = Array.isArray(candidate.alternativeShapes)
    ? candidate.alternativeShapes
        .filter((value): value is CanonicalFaceShape => typeof value === 'string' && isCanonicalFaceShape(value))
        .filter((value) => value !== shape)
        .slice(0, 2)
    : undefined
  const ratios = normalizeRatios(candidate.ratios)
  const failureReason =
    candidate.status === 'unavailable' &&
    typeof candidate.failureReason === 'string' &&
    isFaceShapeFailureReason(candidate.failureReason)
      ? candidate.failureReason
      : undefined

  return {
    version: 'landmark-v1',
    status: candidate.status,
    source: candidate.status === 'measured' ? 'mediapipe-face-landmarker' : 'ai-fallback',
    faceDetected: Boolean(candidate.faceDetected),
    faceCount: clampNumber(candidate.faceCount, 0, 10, 0),
    qualityScore: clampNumber(candidate.qualityScore, 0, 100, 0),
    measuredShape: shape,
    alternativeShapes,
    measuredConfidence: clampOptional(candidate.measuredConfidence, 0, 1),
    ratios: candidate.status === 'measured' ? ratios : undefined,
    signals: normalizeStringArray(candidate.signals, 6),
    warnings: normalizeStringArray(candidate.warnings, 6),
    failureReason,
  }
}

function normalizeRatios(value: unknown): FaceGeometryRatios | undefined {
  if (!value || typeof value !== 'object') return undefined
  const ratios = value as Partial<FaceGeometryRatios>
  const normalized = {
    faceAspectRatio: clampOptional(ratios.faceAspectRatio, 0.6, 2.2),
    cheekToFaceWidth: clampOptional(ratios.cheekToFaceWidth, 0.4, 1.2),
    jawToCheekWidth: clampOptional(ratios.jawToCheekWidth, 0.4, 1.3),
    foreheadToCheekWidth: clampOptional(ratios.foreheadToCheekWidth, 0.4, 1.3),
    eyeLineTiltDeg: clampOptional(ratios.eyeLineTiltDeg, -35, 35),
    symmetryOffset: clampOptional(ratios.symmetryOffset, 0, 0.4),
    noseBridgeToFaceWidth: clampOptional(ratios.noseBridgeToFaceWidth, 0.02, 0.6),
  }
  if (Object.values(normalized).some((item) => item === undefined)) return undefined
  return normalized as FaceGeometryRatios
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback
}

function clampOptional(value: unknown, min: number, max: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : undefined
}

function normalizeStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, max)
}
