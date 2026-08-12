/**
 * Canonical, non-medical frame-direction preferences shared by Store mapping,
 * ranking, and shopper-facing reason generation.
 */

export type FrameShapePreference = {
  primary: string[]
  secondary: string[]
}

export const FACE_SHAPE_FRAME_PREFERENCES: Record<string, FrameShapePreference> = {
  round: {
    primary: ['rectangle', 'square', 'geometric', 'browline'],
    secondary: ['classic', 'wayfarer'],
  },
  square: {
    primary: ['round', 'oval', 'aviator', 'cat-eye'],
    secondary: ['classic', 'geometric'],
  },
  oval: {
    primary: ['rectangle', 'aviator', 'cat-eye', 'browline', 'geometric'],
    secondary: ['minimal', 'round', 'square'],
  },
  heart: {
    primary: ['cat-eye', 'aviator', 'round', 'browline'],
    secondary: ['oval', 'minimal', 'fashion'],
  },
  oblong: {
    primary: ['aviator', 'round', 'cat-eye', 'browline'],
    secondary: ['rectangle', 'classic', 'oval'],
  },
  diamond: {
    primary: ['oval', 'round', 'aviator', 'cat-eye'],
    secondary: ['browline', 'minimal'],
  },
  triangle: {
    primary: ['aviator', 'cat-eye', 'browline', 'geometric'],
    secondary: ['bold', 'round'],
  },
}

export function frameShapePreference(faceShape: string | null | undefined): FrameShapePreference | null {
  if (!faceShape) return null
  return FACE_SHAPE_FRAME_PREFERENCES[faceShape] ?? null
}

export function frameShapeHints(faceShape: string | null | undefined): string[] {
  const preference = frameShapePreference(faceShape)
  return preference ? [...preference.primary, ...preference.secondary] : []
}
