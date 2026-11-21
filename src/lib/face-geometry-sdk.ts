import {
  FaceMetricsCalculator,
  FaceSemanticMapper,
  FaceShapeScorer,
  MEDIAPIPE_SEMANTIC_INDEX_MAP,
  classifyFaceGeometry,
  classifyJawProfile,
  classifyUpperFaceProfile,
  computeGeometryQualityScore,
  getFaceGeometryAdvisories,
} from '@visutry/tryon-core'
import type { FaceQualityWarning } from '@visutry/tryon-core'
import type { CanonicalFaceShape, FaceShapeFailureReason } from '@/config/face-analysis'
import type { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

/** Main-site compatibility exports execute the SDK implementation directly. */
export { classifyFaceGeometry, classifyJawProfile, classifyUpperFaceProfile }
export type FaceJawProfile = NonNullable<ReturnType<typeof classifyJawProfile>>
export type FaceUpperProfile = NonNullable<ReturnType<typeof classifyUpperFaceProfile>>

export interface FaceGeometryMeasurementOptions {
  faceCount?: number
  /** Dimensions of the decoded source image. Missing/invalid dimensions reject analysis. */
  imageWidth?: number
  imageHeight?: number
}

const mapper = FaceSemanticMapper.forSource('mediapipe')
const calculator = new FaceMetricsCalculator()
const scorer = new FaceShapeScorer(calculator)
const minLandmarkCount = Math.max(
  ...Object.values(MEDIAPIPE_SEMANTIC_INDEX_MAP).filter((index): index is number => typeof index === 'number'),
) + 1

type Failure = { reason: FaceShapeFailureReason; message: string }

// These mappings retain the consumer API and UI copy; acceptance rules live in the SDK.
const failures: Partial<Record<FaceQualityWarning, Failure>> = {
  INVALID_IMAGE_SIZE: {
    reason: 'geometry_error',
    message: 'Image dimensions were unavailable. Use a decoded image with a valid width and height.',
  },
  INVALID_LANDMARKS: {
    reason: 'geometry_error',
    message: 'Face geometry could not be measured from this photo.',
  },
  MISSING_KEY_POINTS: {
    reason: 'missing_landmarks',
    message: 'Required facial reference points were missing.',
  },
  FACE_TOO_SMALL: {
    reason: 'too_small',
    message: 'The face is too small in the photo. Move closer and keep the full face visible.',
  },
  EXCESSIVE_TILT: {
    reason: 'tilted',
    message: 'The photo is too tilted for reliable face-shape measurement. Keep both eyes level and try again.',
  },
  ASYMMETRIC_FACE: {
    reason: 'off_center',
    message: 'The face appears turned or off-center. Use a straight-on photo and try again.',
  },
}

const advisoryMessages = {
  TILTED_FACE: 'The photo appears tilted, so proportions may be less precise.',
  OFF_CENTER_FACE: 'The face is not centered or is slightly turned, so symmetry is approximate.',
} as const

function unavailable(reason: FaceShapeFailureReason, message: string, faceCount: number): FaceGeometryAnalysis {
  return {
    version: 'landmark-v1',
    status: 'unavailable',
    source: 'ai-fallback',
    faceDetected: faceCount > 0,
    faceCount,
    qualityScore: 0,
    signals: [],
    warnings: [message],
    failureReason: reason,
  }
}

/**
 * Adapts raw detector output to the shared core and preserves landmark-v1 JSON.
 * Geometry, quality thresholds, classification and semantic profiles are owned
 * by @visutry/tryon-core. Image decoding and MediaPipe lifecycle stay in the client.
 */
export function analyzeFaceLandmarks(
  landmarks: FaceLandmarkPoint[] | null | undefined,
  options?: FaceGeometryMeasurementOptions,
): FaceGeometryAnalysis {
  const faceCount = options?.faceCount ?? (landmarks?.length ? 1 : 0)
  if (!Number.isInteger(faceCount) || faceCount < 0) {
    return unavailable('geometry_error', 'The detected face count was invalid.', 0)
  }
  if (faceCount > 1) {
    return unavailable('multiple_faces', 'Multiple faces were detected. Use a photo with exactly one face.', faceCount)
  }
  if (!landmarks || landmarks.length < minLandmarkCount) {
    return unavailable(
      faceCount === 0 ? 'no_face' : 'missing_landmarks',
      'Face landmarks were not available for this photo.',
      faceCount,
    )
  }
  if (faceCount === 0) {
    return unavailable('no_face', 'Face landmarks were not available for this photo.', 0)
  }

  const metrics = calculator.computeFromSemantic(mapper.map(landmarks), {
    width: options?.imageWidth ?? Number.NaN,
    height: options?.imageHeight ?? Number.NaN,
  })
  const result = scorer.scoreFromMetrics(metrics)
  if (result.primary === 'unknown' || !metrics.visutry || !metrics.geometryValid) {
    // Preserve legacy failure precedence when more than one geometric rule fails.
    const failure = (Object.keys(failures) as FaceQualityWarning[])
      .filter((warning) => result.warnings.includes(warning))
      .map((warning) => failures[warning])
      .find((value): value is Failure => value !== undefined)
      ?? failures.INVALID_LANDMARKS!
    return unavailable(failure.reason, failure.message, faceCount)
  }

  return {
    version: 'landmark-v1',
    status: 'measured',
    source: 'mediapipe-face-landmarker',
    faceDetected: true,
    faceCount,
    qualityScore: computeGeometryQualityScore(metrics.visutry),
    measuredShape: result.primary,
    alternativeShapes: result.candidates.slice(1, 3)
      .filter((candidate) => candidate.score > 0)
      .map((candidate) => candidate.shape)
      .filter((shape): shape is CanonicalFaceShape => shape !== 'unknown'),
    measuredConfidence: result.confidence,
    ratios: metrics.visutry,
    signals: result.signals ?? [],
    warnings: getFaceGeometryAdvisories(metrics.visutry).map((advisory) => advisoryMessages[advisory]),
  }
}
