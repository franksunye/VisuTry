import {
  CANONICAL_FACE_SHAPES,
  CanonicalFaceShape,
  isCanonicalFaceShape,
} from '@/config/face-analysis'
import {
  FaceAnalysisMetric,
  FaceGeometryAnalysis,
  FaceGeometryRatios,
  FaceLandmarkPoint,
} from '@/types/face-analysis'

type PointIndex =
  | 'top'
  | 'chin'
  | 'leftFace'
  | 'rightFace'
  | 'leftCheek'
  | 'rightCheek'
  | 'leftJaw'
  | 'rightJaw'
  | 'leftForehead'
  | 'rightForehead'
  | 'leftEyeOuter'
  | 'rightEyeOuter'
  | 'noseLeft'
  | 'noseRight'
  | 'noseBridge'

const FACE_MESH_INDEX: Record<PointIndex, number> = {
  top: 10,
  chin: 152,
  leftFace: 234,
  rightFace: 454,
  leftCheek: 123,
  rightCheek: 352,
  leftJaw: 172,
  rightJaw: 397,
  leftForehead: 103,
  rightForehead: 332,
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  noseLeft: 98,
  noseRight: 327,
  noseBridge: 168,
}

const MIN_FACE_MESH_POINTS = 455
const MIN_FACE_SPAN = 0.16
const MAX_EYE_LINE_TILT_DEG = 15
const MAX_SYMMETRY_OFFSET = 0.14

export interface FaceGeometryMeasurementOptions {
  faceCount?: number
  imageWidth?: number
  imageHeight?: number
}

function getPoint(points: FaceLandmarkPoint[], key: PointIndex): FaceLandmarkPoint | null {
  return points[FACE_MESH_INDEX[key]] ?? null
}

function distance(
  a: FaceLandmarkPoint,
  b: FaceLandmarkPoint,
  imageWidth: number,
  imageHeight: number
): number {
  return Math.hypot(
    (a.x - b.x) * imageWidth,
    (a.y - b.y) * imageHeight
  )
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildUnavailable(reason: string, faceCount = 0): FaceGeometryAnalysis {
  return {
    version: 'landmark-v1',
    status: 'unavailable',
    source: 'ai-fallback',
    faceDetected: faceCount > 0,
    faceCount,
    qualityScore: 0,
    signals: [],
    warnings: [reason],
  }
}

export function analyzeFaceLandmarks(
  landmarks: FaceLandmarkPoint[] | null | undefined,
  options?: FaceGeometryMeasurementOptions
): FaceGeometryAnalysis {
  const faceCount = options?.faceCount ?? (landmarks?.length ? 1 : 0)
  if (faceCount > 1) {
    return buildUnavailable(
      'Multiple faces were detected. Use a photo with exactly one face.',
      faceCount
    )
  }
  if (!landmarks || landmarks.length < MIN_FACE_MESH_POINTS) {
    return buildUnavailable('Face landmarks were not available for this photo.', faceCount)
  }

  const imageWidth = normalizeDimension(options?.imageWidth)
  const imageHeight = normalizeDimension(options?.imageHeight)

  const required = {
    top: getPoint(landmarks, 'top'),
    chin: getPoint(landmarks, 'chin'),
    leftFace: getPoint(landmarks, 'leftFace'),
    rightFace: getPoint(landmarks, 'rightFace'),
    leftCheek: getPoint(landmarks, 'leftCheek'),
    rightCheek: getPoint(landmarks, 'rightCheek'),
    leftJaw: getPoint(landmarks, 'leftJaw'),
    rightJaw: getPoint(landmarks, 'rightJaw'),
    leftForehead: getPoint(landmarks, 'leftForehead'),
    rightForehead: getPoint(landmarks, 'rightForehead'),
    leftEyeOuter: getPoint(landmarks, 'leftEyeOuter'),
    rightEyeOuter: getPoint(landmarks, 'rightEyeOuter'),
    noseLeft: getPoint(landmarks, 'noseLeft'),
    noseRight: getPoint(landmarks, 'noseRight'),
    noseBridge: getPoint(landmarks, 'noseBridge'),
  }

  if (Object.values(required).some((point) => !point)) {
    return buildUnavailable('Required facial reference points were missing.', faceCount)
  }

  const top = required.top!
  const chin = required.chin!
  const leftFace = required.leftFace!
  const rightFace = required.rightFace!
  const leftCheek = required.leftCheek!
  const rightCheek = required.rightCheek!
  const leftJaw = required.leftJaw!
  const rightJaw = required.rightJaw!
  const leftForehead = required.leftForehead!
  const rightForehead = required.rightForehead!
  const leftEyeOuter = required.leftEyeOuter!
  const rightEyeOuter = required.rightEyeOuter!
  const noseLeft = required.noseLeft!
  const noseRight = required.noseRight!
  const noseBridge = required.noseBridge!

  const faceHeight = distance(top, chin, imageWidth, imageHeight)
  const faceWidth = distance(leftFace, rightFace, imageWidth, imageHeight)
  const cheekWidth = distance(leftCheek, rightCheek, imageWidth, imageHeight)
  const jawWidth = distance(leftJaw, rightJaw, imageWidth, imageHeight)
  const foreheadWidth = distance(leftForehead, rightForehead, imageWidth, imageHeight)
  const noseBridgeWidth = distance(noseLeft, noseRight, imageWidth, imageHeight)
  const eyeLineTiltDeg =
    (Math.atan2(
      (rightEyeOuter.y - leftEyeOuter.y) * imageHeight,
      (rightEyeOuter.x - leftEyeOuter.x) * imageWidth
    ) * 180) /
    Math.PI
  const faceCenterX = (leftFace.x + rightFace.x) / 2
  const symmetryOffset =
    Math.abs(noseBridge.x - faceCenterX) * imageWidth / Math.max(faceWidth, 0.001)

  if (faceHeight <= 0 || faceWidth <= 0 || cheekWidth <= 0) {
    return buildUnavailable('Face geometry could not be measured from this photo.', faceCount)
  }

  const horizontalFaceSpan = Math.abs(rightFace.x - leftFace.x)
  const verticalFaceSpan = Math.abs(chin.y - top.y)
  if (horizontalFaceSpan < MIN_FACE_SPAN || verticalFaceSpan < MIN_FACE_SPAN) {
    return buildUnavailable(
      'The face is too small in the photo. Move closer and keep the full face visible.',
      faceCount
    )
  }

  const ratios: FaceGeometryRatios = {
    faceAspectRatio: round(faceHeight / faceWidth),
    cheekToFaceWidth: round(cheekWidth / faceWidth),
    jawToCheekWidth: round(jawWidth / cheekWidth),
    foreheadToCheekWidth: round(foreheadWidth / cheekWidth),
    eyeLineTiltDeg: round(eyeLineTiltDeg, 1),
    symmetryOffset: round(symmetryOffset),
    noseBridgeToFaceWidth: round(noseBridgeWidth / faceWidth),
  }

  const measured = classifyFaceGeometry(ratios)
  const warnings: string[] = []
  if (Math.abs(ratios.eyeLineTiltDeg) > MAX_EYE_LINE_TILT_DEG) {
    return buildUnavailable(
      'The photo is too tilted for reliable face-shape measurement. Keep both eyes level and try again.',
      faceCount
    )
  }
  if (ratios.symmetryOffset > MAX_SYMMETRY_OFFSET) {
    return buildUnavailable(
      'The face appears turned or off-center. Use a straight-on photo and try again.',
      faceCount
    )
  }
  if (Math.abs(ratios.eyeLineTiltDeg) > 8) {
    warnings.push('The photo appears tilted, so proportions may be less precise.')
  }
  if (ratios.symmetryOffset > 0.08) {
    warnings.push('The face is not centered or is slightly turned, so symmetry is approximate.')
  }

  const qualityScore = clamp(
    96 -
      Math.abs(ratios.eyeLineTiltDeg) * 2.2 -
      ratios.symmetryOffset * 180 -
      (faceCount > 1 ? 12 : 0),
    45,
    96
  )

  return {
    version: 'landmark-v1',
    status: 'measured',
    source: 'mediapipe-face-landmarker',
    faceDetected: true,
    faceCount,
    qualityScore: Math.round(qualityScore),
    measuredShape: measured.shape,
    measuredConfidence: measured.confidence,
    ratios,
    signals: measured.signals,
    warnings,
  }
}

function normalizeDimension(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1
}

export function classifyFaceGeometry(ratios: FaceGeometryRatios): {
  shape: CanonicalFaceShape
  confidence: number
  signals: string[]
} {
  const scores: Record<CanonicalFaceShape, number> = {
    round: 0,
    square: 0,
    oval: 0,
    heart: 0,
    diamond: 0,
    oblong: 0,
    triangle: 0,
  }

  const { faceAspectRatio, jawToCheekWidth, foreheadToCheekWidth } = ratios

  if (faceAspectRatio >= 1.42) scores.oblong += 4
  if (faceAspectRatio >= 1.27 && faceAspectRatio < 1.42) scores.oval += 3
  if (faceAspectRatio < 1.2) scores.round += 2
  if (faceAspectRatio < 1.18 && jawToCheekWidth >= 0.86) scores.square += 3
  if (jawToCheekWidth >= 0.92 && foreheadToCheekWidth >= 0.9) scores.square += 3
  if (jawToCheekWidth < 0.76 && foreheadToCheekWidth >= 0.84) scores.heart += 4
  if (jawToCheekWidth < 0.78 && foreheadToCheekWidth < 0.84) scores.diamond += 4
  if (jawToCheekWidth > 0.98 && foreheadToCheekWidth < 0.88) scores.triangle += 4
  if (jawToCheekWidth >= 0.78 && jawToCheekWidth <= 0.9 && faceAspectRatio >= 1.2) {
    scores.oval += 2
  }
  if (jawToCheekWidth >= 0.82 && jawToCheekWidth <= 0.94 && faceAspectRatio < 1.22) {
    scores.round += 2
  }

  const ranked = CANONICAL_FACE_SHAPES
    .map((shape) => ({ shape, score: scores[shape] }))
    .sort((a, b) => b.score - a.score)
  const best = ranked[0]
  const second = ranked[1]
  const confidence = clamp(0.56 + best.score * 0.065 + (best.score - second.score) * 0.035, 0.58, 0.93)

  return {
    shape: best.shape,
    confidence: round(confidence, 2),
    signals: buildGeometrySignals(best.shape, ratios),
  }
}

function buildGeometrySignals(shape: CanonicalFaceShape, ratios: FaceGeometryRatios): string[] {
  const lengthSignal =
    ratios.faceAspectRatio >= 1.42
      ? 'Longer vertical face proportion'
      : ratios.faceAspectRatio < 1.2
        ? 'Compact face length relative to width'
        : 'Balanced face length-to-width ratio'
  const jawSignal =
    ratios.jawToCheekWidth >= 0.94
      ? 'Jaw width is close to cheekbone width'
      : ratios.jawToCheekWidth <= 0.78
        ? 'Jawline tapers below the cheekbones'
        : 'Jawline has moderate taper'
  const upperSignal =
    ratios.foreheadToCheekWidth >= 0.9
      ? 'Forehead width is close to cheekbone width'
      : 'Cheekbones read wider than the upper face'
  const shapeSignal = `${shape[0].toUpperCase()}${shape.slice(1)} shape supported by measured proportions`

  return [shapeSignal, lengthSignal, jawSignal, upperSignal]
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
  geometry?: FaceGeometryAnalysis | null
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
    ratios.symmetryOffset <= 0.035 ? 'High' : ratios.symmetryOffset <= 0.07 ? 'Balanced' : 'Approximate'

  return [
    measuredMetric(
      'faceShape',
      'Face Shape',
      shapeLabel,
      'Measured + AI',
      `Landmark ratios support a ${shapeLabel.toLowerCase()} face reading; AI styling review is used as a second check.`,
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
      'Cheekbones',
      cheekValue,
      `${Math.round(ratios.foreheadToCheekWidth * 100)}% upper ratio`,
      'Measured upper-face and jaw ratios indicate whether cheekbones are the widest visual anchor.',
      scoreFromRatio(1 - Math.abs(0.84 - ratios.foreheadToCheekWidth), 0.96, 0.2)
    ),
    measuredMetric(
      'symmetry',
      'Symmetry',
      symmetryValue,
      `${Math.round((1 - ratios.symmetryOffset) * 100)}% centered`,
      'Estimated by comparing the nose bridge centerline with the visible face center.',
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
  const ratios = normalizeRatios(candidate.ratios)

  return {
    version: 'landmark-v1',
    status: candidate.status,
    source: candidate.status === 'measured' ? 'mediapipe-face-landmarker' : 'ai-fallback',
    faceDetected: Boolean(candidate.faceDetected),
    faceCount: clampNumber(candidate.faceCount, 0, 10, 0),
    qualityScore: clampNumber(candidate.qualityScore, 0, 100, 0),
    measuredShape: shape,
    measuredConfidence: clampOptional(candidate.measuredConfidence, 0, 1),
    ratios: candidate.status === 'measured' ? ratios : undefined,
    signals: normalizeStringArray(candidate.signals, 6),
    warnings: normalizeStringArray(candidate.warnings, 6),
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
