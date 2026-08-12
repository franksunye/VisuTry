/**
 * Map on-device face geometry into Store ranking signals.
 * Pure — no MediaPipe / Next imports. Reasons stay non-medical.
 */

import type { ShopperAnalysisSignals } from './ranking'
import { frameShapeHints } from './frame-fit-preferences'
import {
  classifyJawProfile,
  classifyUpperFaceProfile,
} from '@/lib/face-landmark-metrics'

export type GeometrySignalInput = {
  status?: 'measured' | 'unavailable' | null
  measuredShape?: string | null
  alternativeShapes?: string[] | null
  measuredConfidence?: number | null
  qualityScore?: number | null
  faceAspectRatio?: number | null
  jawToCheekWidth?: number | null
  foreheadToCheekWidth?: number | null
  ratios?: {
    faceAspectRatio?: number | null
    jawToCheekWidth?: number | null
    foreheadToCheekWidth?: number | null
  } | null
  /** Optional style direction strings (e.g. recommended frame shape types). */
  styleHints?: string[] | null
}

const KNOWN_SHAPES = new Set([
  'round',
  'square',
  'oval',
  'heart',
  'oblong',
  'diamond',
  'triangle',
])

export function normalizeFaceShape(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return KNOWN_SHAPES.has(normalized) ? normalized : null
}

/**
 * Derive a coarse frame-width preference from face aspect ratio.
 * Longer faces → narrower frame direction; shorter/wider → wider.
 */
export function preferredWidthFromAspectRatio(
  faceAspectRatio: number | null | undefined,
): ShopperAnalysisSignals['preferredWidthClass'] {
  if (typeof faceAspectRatio !== 'number' || !Number.isFinite(faceAspectRatio)) {
    return null
  }
  if (faceAspectRatio >= 1.38) return 'narrow'
  if (faceAspectRatio <= 1.18) return 'wide'
  return 'medium'
}

export function mapGeometryToShopperSignals(
  input: GeometrySignalInput,
): ShopperAnalysisSignals {
  const geometryAvailable = input.status !== 'unavailable'
  const faceShape = geometryAvailable ? normalizeFaceShape(input.measuredShape) : null
  const alternativeFaceShapes = geometryAvailable
    ? Array.from(new Set((input.alternativeShapes ?? [])
      .map(normalizeFaceShape)
      .filter((shape): shape is string => Boolean(shape) && shape !== faceShape)))
      .slice(0, 2)
    : []
  const faceAspectRatio = geometryAvailable
    ? finiteClamped(input.faceAspectRatio ?? input.ratios?.faceAspectRatio, 0.6, 2.2)
    : null
  const jawToCheekWidth = geometryAvailable
    ? finiteClamped(input.jawToCheekWidth ?? input.ratios?.jawToCheekWidth, 0.4, 1.3)
    : null
  const foreheadToCheekWidth = geometryAvailable
    ? finiteClamped(input.foreheadToCheekWidth ?? input.ratios?.foreheadToCheekWidth, 0.4, 1.3)
    : null
  const qualityScore = geometryAvailable
    ? finiteClamped(input.qualityScore, 0, 100)
    : null
  const faceShapeConfidence = faceShape
    ? finiteClamped(input.measuredConfidence, 0, 1)
    : null
  const preferredWidthClass = preferredWidthFromAspectRatio(faceAspectRatio)

  const fromShape = frameShapeHints(faceShape)
  const fromClient = (input.styleHints ?? [])
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)

  const styleHints = Array.from(new Set([...fromShape, ...fromClient])).slice(0, 8)

  return {
    faceShape,
    faceShapeConfidence,
    alternativeFaceShapes,
    preferredWidthClass,
    faceAspectRatio,
    jawProfile: jawProfileFromRatio(jawToCheekWidth),
    upperFaceProfile: upperFaceProfileFromRatio(foreheadToCheekWidth),
    styleHints: styleHints.length > 0 ? styleHints : undefined,
    geometryQualityScore: qualityScore,
  }
}

export function jawProfileFromRatio(
  jawToCheekWidth: number | null | undefined,
): ShopperAnalysisSignals['jawProfile'] {
  return classifyJawProfile(jawToCheekWidth)
}

export function upperFaceProfileFromRatio(
  foreheadToCheekWidth: number | null | undefined,
): ShopperAnalysisSignals['upperFaceProfile'] {
  return classifyUpperFaceProfile(foreheadToCheekWidth)
}

export type GeometryQualityBand = 'high' | 'medium' | 'low' | 'unavailable'

export function geometryQualityBand(signals: ShopperAnalysisSignals): GeometryQualityBand {
  if (signals.geometryQualityScore === null || signals.geometryQualityScore === undefined) {
    return signals.faceShape || signals.preferredWidthClass ? 'medium' : 'unavailable'
  }
  if (signals.geometryQualityScore < 60) return 'low'
  if (signals.geometryQualityScore < 80) return 'medium'
  return 'high'
}

export function shopperSignalCount(signals: ShopperAnalysisSignals): number {
  return [
    signals.faceShape,
    signals.faceShapeConfidence,
    signals.alternativeFaceShapes?.length ? signals.alternativeFaceShapes : null,
    signals.preferredWidthClass,
    signals.faceAspectRatio,
    signals.jawProfile,
    signals.upperFaceProfile,
    signals.styleHints?.length ? signals.styleHints : null,
    signals.geometryQualityScore,
  ].filter((value) => value !== null && value !== undefined).length
}

function finiteClamped(
  value: number | null | undefined,
  min: number,
  max: number,
): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(max, Math.max(min, value))
}
