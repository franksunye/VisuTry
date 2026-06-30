import type { FaceShapeContentSlug } from '@/config/face-shape-content'

export const FACE_SHAPE_COMPARISON_SLUGS = [
  'oval-vs-oblong',
  'round-vs-square',
  'heart-vs-diamond',
] as const

export type FaceShapeComparisonSlug = (typeof FACE_SHAPE_COMPARISON_SLUGS)[number]

export interface FaceShapeComparisonGuide {
  slug: FaceShapeComparisonSlug
  first: FaceShapeContentSlug
  second: FaceShapeContentSlug
  summary: string
  keyDifference: string
  signals: readonly {
    feature: string
    first: string
    second: string
  }[]
  selfChecks: readonly string[]
}

export const FACE_SHAPE_COMPARISONS: Record<FaceShapeComparisonSlug, FaceShapeComparisonGuide> = {
  'oval-vs-oblong': {
    slug: 'oval-vs-oblong',
    first: 'oval',
    second: 'oblong',
    summary: 'Both shapes are longer than they are wide and can have a softly curved jaw. The difference is how strongly vertical length dominates the outline.',
    keyDifference: 'Oval looks moderately long and balanced; oblong looks distinctly long with straighter, more parallel sides.',
    signals: [
      { feature: 'Face length', first: 'Moderately longer than width', second: 'Clearly and consistently longer than width' },
      { feature: 'Side outline', first: 'Gently curved and tapered', second: 'Straighter and more parallel' },
      { feature: 'Width zones', first: 'Cheekbones may be slightly widest', second: 'Forehead, cheeks, and jaw stay relatively similar' },
      { feature: 'Styling goal', first: 'Preserve natural balance', second: 'Add width and break up vertical length' },
    ],
    selfChecks: [
      'Does your face read as balanced first, or noticeably long first?',
      'Do the sides taper around the cheekbones, or stay relatively straight?',
      'Would added crown height make the face feel disproportionately longer?',
    ],
  },
  'round-vs-square': {
    slug: 'round-vs-square',
    first: 'round',
    second: 'square',
    summary: 'Round and square faces can have similar visible width and length. Jaw curvature—not overall fullness—is usually the most useful separator.',
    keyDifference: 'Round has soft, continuous curves; square has a broader jaw with visible corners and straighter outline segments.',
    signals: [
      { feature: 'Jawline', first: 'Rounded with no strong corner', second: 'Defined mandibular corners' },
      { feature: 'Chin', first: 'Soft and curved', second: 'Broader or more squared' },
      { feature: 'Outer outline', first: 'Continuous curves', second: 'Straighter segments and angles' },
      { feature: 'Styling goal', first: 'Introduce length or controlled angles', second: 'Add curves or deliberately emphasize structure' },
    ],
    selfChecks: [
      'Can you see a definite corner where the jaw turns upward?',
      'Does the lower face look broad and structured, or softly curved?',
      'Do angular frames create useful contrast, or repeat angles already present?',
    ],
  },
  'heart-vs-diamond': {
    slug: 'heart-vs-diamond',
    first: 'heart',
    second: 'diamond',
    summary: 'Both shapes can have high cheekbones and a narrow chin. The decisive clue is whether the forehead or the cheekbones form the widest zone.',
    keyDifference: 'Heart is widest through the forehead or upper face; diamond is widest specifically at the cheekbones and narrows toward both temples and jaw.',
    signals: [
      { feature: 'Widest point', first: 'Forehead or upper cheek area', second: 'Cheekbones' },
      { feature: 'Temple width', first: 'Usually remains relatively broad', second: 'Noticeably narrower than cheekbones' },
      { feature: 'Direction of taper', first: 'Primarily tapers downward', second: 'Tapers both upward and downward' },
      { feature: 'Styling goal', first: 'Add softness or width near the lower face', second: 'Connect narrow forehead and jaw to prominent cheeks' },
    ],
    selfChecks: [
      'Is the forehead visibly wider than the jaw, or are the cheekbones wider than both?',
      'Does the outline narrow above the cheekbones at the temples?',
      'Would adding volume at the temples balance the face, or make the upper face too wide?',
    ],
  },
}

export function getFaceShapeComparison(slug: string): FaceShapeComparisonGuide | null {
  return FACE_SHAPE_COMPARISONS[slug as FaceShapeComparisonSlug] ?? null
}
