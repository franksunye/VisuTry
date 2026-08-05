/**
 * Map on-device face geometry into Store ranking signals.
 * Pure — no MediaPipe / Next imports. Reasons stay non-medical.
 */

import type { ShopperAnalysisSignals } from './ranking'

export type GeometrySignalInput = {
  measuredShape?: string | null
  faceAspectRatio?: number | null
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

/** Prefer these frame shapes for a given face shape (mirrors ranking preferences). */
const STYLE_HINTS_BY_FACE: Record<string, string[]> = {
  round: ['rectangle', 'square', 'geometric', 'browline', 'classic'],
  square: ['round', 'oval', 'aviator', 'cat-eye', 'classic'],
  oval: ['rectangle', 'aviator', 'cat-eye', 'browline', 'minimal'],
  heart: ['cat-eye', 'aviator', 'round', 'browline', 'fashion'],
  oblong: ['aviator', 'round', 'cat-eye', 'browline', 'classic'],
  diamond: ['oval', 'round', 'aviator', 'cat-eye', 'minimal'],
  triangle: ['aviator', 'cat-eye', 'browline', 'geometric', 'bold'],
}

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
  const faceShape = normalizeFaceShape(input.measuredShape)
  const preferredWidthClass = preferredWidthFromAspectRatio(input.faceAspectRatio)

  const fromShape = faceShape ? STYLE_HINTS_BY_FACE[faceShape] ?? [] : []
  const fromClient = (input.styleHints ?? [])
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)

  const styleHints = Array.from(new Set([...fromShape, ...fromClient])).slice(0, 8)

  return {
    faceShape,
    preferredWidthClass,
    styleHints: styleHints.length > 0 ? styleHints : undefined,
  }
}
