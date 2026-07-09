/**
 * Face AI Analysis configuration
 */

import type { LucideIcon } from 'lucide-react'
import {
  Circle,
  Diamond,
  Heart,
  Hexagon,
  RectangleHorizontal,
  Square,
  Triangle,
} from 'lucide-react'

export const FACE_ANALYSIS_MODEL = 'gemini-3.1-flash-lite'

export const FACE_ANALYSIS_CREDIT_COST = 1

export const FACE_ANALYSIS_STEPS = ['photo', 'analysis', 'report'] as const
export type FaceAnalysisStep = (typeof FACE_ANALYSIS_STEPS)[number]

export const CANONICAL_FACE_SHAPES = [
  'round',
  'square',
  'oval',
  'heart',
  'diamond',
  'oblong',
  'triangle',
] as const

export type CanonicalFaceShape = (typeof CANONICAL_FACE_SHAPES)[number]

export const FACE_SHAPE_ICONS: Record<CanonicalFaceShape, LucideIcon> = {
  round: Circle,
  square: Square,
  oval: Circle,
  heart: Heart,
  diamond: Diamond,
  oblong: RectangleHorizontal,
  triangle: Triangle,
}

export function getFaceShapeIcon(shape: string): LucideIcon {
  if (isCanonicalFaceShape(shape)) {
    return FACE_SHAPE_ICONS[shape]
  }
  return Hexagon
}

export const FACE_ANALYSIS_LAYOUT = {
  container: 'max-w-7xl mx-auto',
  grid: 'flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6',
  card: 'rounded-xl border border-gray-200 bg-white shadow-sm',
  resultPanelEmpty: 'border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 min-h-[400px]',
  resultPanelFilled: 'border border-gray-200 rounded-xl bg-white shadow-sm min-h-[400px]',
  primaryButton:
    'flex items-center justify-center px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
  secondaryButton:
    'flex items-center justify-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50',
} as const

export function isCanonicalFaceShape(value: string): value is CanonicalFaceShape {
  return (CANONICAL_FACE_SHAPES as readonly string[]).includes(value)
}

/**
 * Categorized failure reasons for the on-device face-shape detector.
 *
 * Photo-quality issues (user-fixable):
 *   no_face, multiple_faces, too_small, tilted, off_center,
 *   missing_landmarks, geometry_error
 *
 * Infrastructure issues (not user-fixable):
 *   model_load_failed, unsupported_browser
 *
 * Fallback:
 *   unknown
 */
export const FACE_SHAPE_FAILURE_REASONS = [
  'no_face',
  'multiple_faces',
  'too_small',
  'tilted',
  'off_center',
  'missing_landmarks',
  'geometry_error',
  'model_load_failed',
  'unsupported_browser',
  'unknown',
] as const

export type FaceShapeFailureReason = (typeof FACE_SHAPE_FAILURE_REASONS)[number]

export const FACE_SHAPE_FAILURE_REASON_LABELS: Record<FaceShapeFailureReason, string> = {
  no_face: 'No face detected',
  multiple_faces: 'Multiple faces',
  too_small: 'Face too small',
  tilted: 'Photo tilted',
  off_center: 'Face off-center',
  missing_landmarks: 'Landmarks incomplete',
  geometry_error: 'Geometry error',
  model_load_failed: 'Model load failed',
  unsupported_browser: 'Unsupported browser',
  unknown: 'Unknown',
}

export const FACE_SHAPE_FAILURE_REASON_GROUPS: Record<
  'photo_quality' | 'infrastructure',
  FaceShapeFailureReason[]
> = {
  photo_quality: [
    'no_face',
    'multiple_faces',
    'too_small',
    'tilted',
    'off_center',
    'missing_landmarks',
    'geometry_error',
  ],
  infrastructure: ['model_load_failed', 'unsupported_browser'],
}

export function isFaceShapeFailureReason(value: string): value is FaceShapeFailureReason {
  return (FACE_SHAPE_FAILURE_REASONS as readonly string[]).includes(value)
}
