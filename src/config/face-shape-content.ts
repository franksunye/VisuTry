export const FACE_SHAPE_SLUGS = [
  'oval',
  'round',
  'square',
  'heart',
  'diamond',
  'oblong',
  'triangle',
] as const

export type FaceShapeContentSlug = (typeof FACE_SHAPE_SLUGS)[number]

export interface FaceShapeContentGuide {
  slug: FaceShapeContentSlug
  styleSlug: `${FaceShapeContentSlug}-face`
  name: string
  shortDefinition: string
  definition: string
  balanceGoal: string
  identify: readonly string[]
  measurements: readonly { label: string; guidance: string }[]
  oftenConfusedWith: readonly FaceShapeContentSlug[]
  glasses: {
    tryFirst: readonly string[]
    reconsider: readonly string[]
    rationale: string
  }
  hairstyles: {
    tryFirst: readonly string[]
    principles: readonly string[]
    reconsider: readonly string[]
    rationale: string
  }
}

export const FACE_SHAPE_CONTENT: Record<FaceShapeContentSlug, FaceShapeContentGuide> = {
  oval: {
    slug: 'oval',
    styleSlug: 'oval-face',
    name: 'Oval',
    shortDefinition: 'A face that is slightly longer than it is wide, with balanced proportions and a softly tapered jaw.',
    definition: 'Oval faces usually have no single width zone that overwhelms the others. The cheekbones may be the widest point, while the forehead and jaw taper gently rather than ending in sharp corners.',
    balanceGoal: 'Preserve the natural balance and choose scale deliberately instead of trying to correct the outline.',
    identify: [
      'Face length is moderately greater than face width.',
      'The jawline curves smoothly into a rounded or softly tapered chin.',
      'Forehead and jaw feel balanced, with cheekbones often slightly wider.',
      'The face does not read as strongly angular, very long, or nearly circular.',
    ],
    measurements: [
      { label: 'Length vs width', guidance: 'Look for moderate vertical length rather than an extreme long or short proportion.' },
      { label: 'Cheekbones', guidance: 'They are often the widest area, but not dramatically wider than the forehead.' },
      { label: 'Jawline', guidance: 'The jaw narrows gradually and has no pronounced square corner.' },
    ],
    oftenConfusedWith: ['oblong', 'round'],
    glasses: {
      tryFirst: ['Balanced rectangular frames', 'Browline frames', 'Aviators', 'Classic square frames'],
      reconsider: ['Frames much wider than the face', 'Very narrow frames', 'Oversized frames that hide the brows'],
      rationale: 'Oval proportions support many frame shapes, so brow alignment, width, and lens depth are more useful filters than a rigid shape rule.',
    },
    hairstyles: {
      tryFirst: ['Collarbone layers', 'Textured bob', 'Soft curtain bangs', 'Long waves with balanced volume'],
      principles: ['Keep volume proportional on both sides.', 'Use a part or fringe to highlight the feature you like most.', 'Let the cut frame the cheekbones without covering the whole outline.'],
      reconsider: ['Very heavy fringe paired with flat sides', 'Extreme crown height with very long straight lengths'],
      rationale: 'Because the outline is already balanced, hairstyle choice can focus on texture, maintenance, and feature emphasis rather than correction.',
    },
  },
  round: {
    slug: 'round',
    styleSlug: 'round-face',
    name: 'Round',
    shortDefinition: 'A face with similar visible width and length, fuller cheeks, and a gently curved jawline.',
    definition: 'Round faces are defined more by soft transitions than by exact body weight or cheek fullness. The sides curve continuously, the chin is rounded, and the jaw corners are not strongly visible.',
    balanceGoal: 'Introduce vertical movement or controlled angles while keeping the result natural rather than trying to hide facial fullness.',
    identify: [
      'Visible face width and length are relatively close.',
      'Cheeks form the fullest or widest part of the outline.',
      'The jawline is curved with a rounded chin.',
      'Forehead, cheek, and jaw transitions appear soft rather than angular.',
    ],
    measurements: [
      { label: 'Length vs width', guidance: 'The difference is smaller than it is on oval or oblong faces.' },
      { label: 'Jawline', guidance: 'Look for a continuous curve instead of a defined mandibular corner.' },
      { label: 'Cheek area', guidance: 'The middle of the face often carries the most visible width.' },
    ],
    oftenConfusedWith: ['oval', 'square'],
    glasses: {
      tryFirst: ['Rectangular frames', 'Square frames', 'Geometric frames', 'Slightly upswept frames'],
      reconsider: ['Tiny round frames', 'Frames substantially narrower than the cheeks', 'Very low, shallow lenses'],
      rationale: 'Straight edges and visible corners add contrast to curved proportions, while adequate frame width keeps the glasses in scale with the cheeks.',
    },
    hairstyles: {
      tryFirst: ['Long face-framing layers', 'Angled lob', 'Side-swept fringe', 'Volume concentrated above the temples'],
      principles: ['Create some vertical direction at the crown.', 'Keep movement below or above the widest cheek area.', 'Use off-center parts or diagonal lines for gentle contrast.'],
      reconsider: ['Blunt chin-length cuts with maximum side volume', 'Very wide straight-across bangs with flat crown volume'],
      rationale: 'Length, diagonals, and controlled side volume can visually extend the face without treating roundness as something that must be concealed.',
    },
  },
  square: {
    slug: 'square',
    styleSlug: 'square-face',
    name: 'Square',
    shortDefinition: 'A face with a broad forehead, a strong jaw, and similar width through the upper and lower face.',
    definition: 'Square faces combine balanced width with more visible angles. The jaw corners tend to be defined, and the forehead, cheekbones, and jaw may appear relatively close in width.',
    balanceGoal: 'Choose whether to soften the angles with curves or emphasize the strong structure with deliberate geometric styling.',
    identify: [
      'Forehead and jawline appear similar in width.',
      'Jaw corners are more visible than on round or oval faces.',
      'The chin may be broad or only slightly tapered.',
      'The overall outline feels structured rather than elongated.',
    ],
    measurements: [
      { label: 'Upper vs lower width', guidance: 'Forehead and jaw are usually closer in width than on heart or triangle faces.' },
      { label: 'Jaw angle', guidance: 'A visible corner is more important than absolute jaw width.' },
      { label: 'Length vs width', guidance: 'The face is balanced or moderately long, but not dominated by vertical length.' },
    ],
    oftenConfusedWith: ['round', 'oblong'],
    glasses: {
      tryFirst: ['Round frames', 'Oval frames', 'Thin metal frames', 'Soft aviators'],
      reconsider: ['Heavy boxy frames matching the jaw exactly', 'Very narrow rectangles', 'Thick frames with sharp low corners'],
      rationale: 'Curved lenses can soften a strong jaw, while lighter construction prevents the glasses from competing with an already defined outline.',
    },
    hairstyles: {
      tryFirst: ['Soft waves', 'Layered shoulder-length cuts', 'Side-swept bangs', 'Textured pixie with movement'],
      principles: ['Use texture to break up straight outline lines.', 'Place layers around rather than directly on the jaw corner.', 'An off-center part can add asymmetry and movement.'],
      reconsider: ['A blunt cut ending exactly at the jaw corner', 'Very flat styles with a severe center line and no texture'],
      rationale: 'Soft texture and offset lines create contrast with the angular outline; clean geometric cuts can instead be used when the goal is to emphasize it.',
    },
  },
  heart: {
    slug: 'heart',
    styleSlug: 'heart-face',
    name: 'Heart',
    shortDefinition: 'A face with more width through the forehead or upper cheeks and a noticeably narrower, often pointed chin.',
    definition: 'Heart-shaped faces taper from the upper face toward the jaw. A widow’s peak can reinforce the impression but is not required; the forehead-to-jaw relationship matters more than the hairline shape.',
    balanceGoal: 'Reduce excessive visual weight at the top and add softness or presence around the lower face.',
    identify: [
      'The forehead or upper cheek area is wider than the jaw.',
      'The jaw narrows toward a smaller or pointed chin.',
      'Cheekbones may be prominent but do not sit between two equally narrow zones.',
      'The outline visibly tapers downward.',
    ],
    measurements: [
      { label: 'Forehead vs jaw', guidance: 'The upper face is measurably or visibly wider than the lower face.' },
      { label: 'Chin', guidance: 'A narrow or pointed chin supports the classification, but is not sufficient alone.' },
      { label: 'Cheekbones', guidance: 'They can be broad, though usually not as isolated as on a diamond face.' },
    ],
    oftenConfusedWith: ['diamond', 'triangle'],
    glasses: {
      tryFirst: ['Lightweight frames', 'Rounded frames', 'Subtle cat-eye frames', 'Bottom-balanced frames'],
      reconsider: ['Very heavy browlines', 'Frames much wider than the forehead', 'Top-heavy decoration'],
      rationale: 'Lighter upper lines and some visual presence below the eyes can connect a broader forehead to a narrower chin.',
    },
    hairstyles: {
      tryFirst: ['Chin-length bob', 'Collarbone waves', 'Side-swept fringe', 'Layers with movement below the cheekbones'],
      principles: ['Keep some width near the jaw or shoulders.', 'Use a fringe to soften the forehead without closing the face.', 'Avoid concentrating every layer at the upper cheek.'],
      reconsider: ['Extreme crown width with tight flat ends', 'Very short blunt fringe with no lower-face volume'],
      rationale: 'Movement around the jaw and lower lengths can balance the wider upper face while keeping the cheekbones visible.',
    },
  },
  diamond: {
    slug: 'diamond',
    styleSlug: 'diamond-face',
    name: 'Diamond',
    shortDefinition: 'A face where the cheekbones are the dominant width, with a narrower forehead and jaw.',
    definition: 'Diamond faces have a distinct middle-face emphasis. The outline widens toward the cheekbones and then narrows both upward toward the temples and downward toward the chin.',
    balanceGoal: 'Connect the narrow forehead and jaw to the cheekbones with gentle width, curves, or controlled volume.',
    identify: [
      'Cheekbones are clearly wider than both forehead and jaw.',
      'The forehead narrows at the temples.',
      'The lower face tapers to a narrow or pointed chin.',
      'The outline appears angular through the cheek area.',
    ],
    measurements: [
      { label: 'Cheek prominence', guidance: 'The cheek width should exceed both the forehead and jaw, not just one of them.' },
      { label: 'Forehead', guidance: 'The temples are narrower than the cheekbones, unlike many heart-shaped faces.' },
      { label: 'Jaw and chin', guidance: 'The lower outline narrows rather than remaining broad or square.' },
    ],
    oftenConfusedWith: ['heart', 'oval'],
    glasses: {
      tryFirst: ['Oval frames', 'Rimless frames', 'Cat-eye frames', 'Browline frames'],
      reconsider: ['Very narrow frames', 'Tiny lenses', 'Frames that pinch visually at the cheekbones'],
      rationale: 'Gentle width near the eyes can bridge a narrower forehead while curved lines avoid adding another hard angle at the cheekbones.',
    },
    hairstyles: {
      tryFirst: ['Chin-length bob', 'Side part with soft fringe', 'Shoulder-length waves', 'Pixie with temple volume'],
      principles: ['Add some softness near the forehead or jaw.', 'Keep the cheekbone area visible rather than adding maximum width there.', 'Use movement to connect the three width zones.'],
      reconsider: ['Maximum volume directly at the cheekbones', 'Slicked-back styles with no softness at the temples'],
      rationale: 'Balanced volume above or below the cheekbones makes the whole outline feel connected while preserving its distinctive structure.',
    },
  },
  oblong: {
    slug: 'oblong',
    styleSlug: 'oblong-face',
    name: 'Oblong',
    shortDefinition: 'A face that is noticeably longer than it is wide, with relatively consistent width from forehead to jaw.',
    definition: 'Oblong faces are led by vertical length. The sides may appear straighter, and the forehead, cheekbones, and jaw often remain closer in width than on tapered heart or triangle faces.',
    balanceGoal: 'Break up continuous vertical length and introduce useful width or depth around the sides of the face.',
    identify: [
      'Face length is the most dominant proportion.',
      'Forehead, cheeks, and jaw are relatively consistent in width.',
      'The sides of the face appear straighter than on an oval face.',
      'The chin can be rounded or angular, but the long proportion remains primary.',
    ],
    measurements: [
      { label: 'Length vs width', guidance: 'Vertical length is more pronounced than on an oval face.' },
      { label: 'Side lines', guidance: 'The outline tends to stay relatively parallel through much of the face.' },
      { label: 'Width distribution', guidance: 'No single horizontal zone usually dominates dramatically.' },
    ],
    oftenConfusedWith: ['oval', 'square'],
    glasses: {
      tryFirst: ['Deep rectangular frames', 'Oversized frames', 'Browline frames', 'Statement frames'],
      reconsider: ['Very shallow frames', 'Tiny narrow lenses', 'Frames sitting high with little lens depth'],
      rationale: 'More lens depth and visible frame presence interrupt the vertical line and add proportionate scale.',
    },
    hairstyles: {
      tryFirst: ['Shoulder-length waves', 'Textured bob', 'Curtain bangs', 'Layered cuts with side volume'],
      principles: ['Build width around the cheek or jaw area.', 'Use a fringe to shorten the uninterrupted vertical area.', 'Keep crown height controlled when lengths are very long.'],
      reconsider: ['Very long pin-straight hair with flat sides', 'Extreme crown height without side movement'],
      rationale: 'Side volume, texture, and a fringe can divide the long outline into balanced sections without hiding the face.',
    },
  },
  triangle: {
    slug: 'triangle',
    styleSlug: 'triangle-face',
    name: 'Triangle',
    shortDefinition: 'A face with a jawline wider than the forehead, creating an outline that becomes broader toward the bottom.',
    definition: 'Triangle, sometimes called pear, is the inverse width pattern of a heart-shaped face. The temples or forehead are narrower, while the jaw carries the strongest horizontal width.',
    balanceGoal: 'Add presence near the brows and temples while keeping the strong jaw from carrying all visual weight.',
    identify: [
      'The jaw is wider than the forehead and often wider than the cheekbones.',
      'The forehead or temple area is the narrowest upper zone.',
      'The outline broadens as it moves downward.',
      'The jaw may be rounded or angular, but its width is the defining signal.',
    ],
    measurements: [
      { label: 'Forehead vs jaw', guidance: 'The jaw should visibly exceed the forehead width.' },
      { label: 'Cheekbones', guidance: 'They may be broad, but usually do not exceed the jaw as they do on diamond faces.' },
      { label: 'Direction of taper', guidance: 'The face narrows upward rather than downward.' },
    ],
    oftenConfusedWith: ['square', 'heart'],
    glasses: {
      tryFirst: ['Browline frames', 'Cat-eye frames', 'Aviators', 'Frames with a defined upper rim'],
      reconsider: ['Bottom-heavy frames', 'Very narrow frames', 'Low decoration that repeats jaw width'],
      rationale: 'A stronger upper line adds visual presence near a narrower forehead and balances a broader jaw.',
    },
    hairstyles: {
      tryFirst: ['Layered cuts with temple volume', 'Textured pixie', 'Side-swept bangs', 'Waves beginning above the jaw'],
      principles: ['Place width around the upper face.', 'Keep the heaviest ends away from the widest jaw point.', 'Use crown and temple movement to balance the lower outline.'],
      reconsider: ['A blunt jaw-length cut with outward volume', 'Flat crown paired with heavy ends at the jaw'],
      rationale: 'Upper-face volume and lighter ends redistribute attention upward while allowing the jawline to remain a strong feature.',
    },
  },
}

export function getFaceShapeContent(slug: string): FaceShapeContentGuide | null {
  const normalized = slug.toLowerCase().replace(/-face$/, '') as FaceShapeContentSlug
  return FACE_SHAPE_CONTENT[normalized] ?? null
}
