import type { FaceLandmarkPoint } from '@/types/face-analysis'

export type FaceLandmarkConnection = { start: number; end: number }

export type FaceLandmarkConnections = {
  tesselation: FaceLandmarkConnection[]
  contours: FaceLandmarkConnection[]
  irises: FaceLandmarkConnection[]
}

/**
 * The small set of landmarks called out by the Face Analysis overlay. Store's
 * fit map may use fewer visual details, but it must use these same measured
 * reference points rather than inventing another face model.
 */
export const FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES = [
  10, 152, 234, 454, 33, 263, 61, 291, 1, 199,
] as const

export type FaceLandmarkOverlayVariant = 'full' | 'lightweight'

/**
 * Selects presentation density from the detector's own connection topology.
 * The lightweight view removes the dense mesh and iris details, but never
 * replaces the detector's contour connections with Store-specific geometry.
 */
export function selectFaceLandmarkOverlayConnections(
  connections: FaceLandmarkConnections,
  variant: FaceLandmarkOverlayVariant = 'full',
): FaceLandmarkConnections {
  if (variant === 'lightweight') {
    return {
      tesselation: [],
      contours: connections.contours,
      irises: [],
    }
  }

  return connections
}

/**
 * Maps normalized detector coordinates into the same object-cover projection
 * used by the displayed photo in Face Analysis and Store Fit Profile.
 */
export function createCoverMapper(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
) {
  const scale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight)
  const renderedWidth = naturalWidth * scale
  const renderedHeight = naturalHeight * scale
  const offsetX = (containerWidth - renderedWidth) / 2
  const offsetY = (containerHeight - renderedHeight) / 2

  return (point: FaceLandmarkPoint) => ({
    x: offsetX + point.x * renderedWidth,
    y: offsetY + point.y * renderedHeight,
  })
}
