import type { FaceShapeContentSlug } from '@/config/face-shape-content'

export interface SunglassesStyleRecommendation {
  name: string
  why: string
  presetId: string
}

export interface SunglassesFaceShapeGuide {
  slug: `${FaceShapeContentSlug}-face`
  faceShape: FaceShapeContentSlug
  name: string
  description: string
  shoppingGoal: string
  bestStyles: readonly SunglassesStyleRecommendation[]
  fitChecks: readonly string[]
  reconsider: readonly string[]
  lensAdvice: string
}

export const SUNGLASSES_FACE_SHAPE_GUIDES: Record<FaceShapeContentSlug, SunglassesFaceShapeGuide> = {
  oval: {
    slug: 'oval-face',
    faceShape: 'oval',
    name: 'Oval',
    description: 'Oval faces are slightly longer than wide with balanced proportions and a softly tapered jaw. Most sunglass shapes can work, so scale and brow alignment are the useful filters.',
    shoppingGoal: 'Preserve the natural balance without letting an oversized or very narrow frame overwhelm it.',
    bestStyles: [
      { name: 'Wayfarer sunglasses', why: 'The softly angular outline adds definition while staying proportional.', presetId: 'sun-wayfarer-black' },
      { name: 'Aviator sunglasses', why: 'The teardrop lens follows the face length without creating excessive width.', presetId: 'sun-aviator-gold' },
      { name: 'Cat-eye sunglasses', why: 'A controlled upsweep highlights the cheekbones and keeps the outline lively.', presetId: 'sun-cat-eye-black' },
      { name: 'Oversized sunglasses', why: 'Balanced proportions can support extra lens depth when the frame still fits the brow and temples.', presetId: 'sun-oversized-gradient' },
    ],
    fitChecks: ['Keep the frame no more than slightly wider than the cheekbones.', 'Check that the upper rim follows rather than hides the brow line.', 'Choose lens depth in proportion to the length of the mid-face.'],
    reconsider: ['Frames dramatically wider than the temples', 'Very shallow lenses on a longer oval face', 'Oversized frames that rest on the cheeks'],
    lensAdvice: 'Because shape options are broad, use lens color for the real job: neutral gray for consistent color, brown for contrast, or polarized lenses for reflected glare.',
  },
  round: {
    slug: 'round-face',
    faceShape: 'round',
    name: 'Round',
    description: 'Round faces have softer curves, fuller cheeks, and relatively similar visible width and length. Sunglasses with clear corners or an upswept line can add useful contrast.',
    shoppingGoal: 'Introduce structure and a little visual lift while keeping enough width for the cheeks.',
    bestStyles: [
      { name: 'Wayfarer sunglasses', why: 'A straight brow and angled lower corners contrast with a curved jawline.', presetId: 'sun-wayfarer-black' },
      { name: 'Cat-eye sunglasses', why: 'The outer lift draws attention upward and creates a more directional outline.', presetId: 'sun-cat-eye-black' },
      { name: 'Narrow rectangle sunglasses', why: 'A horizontal, angular shape adds definition when it is not too narrow for the face.', presetId: 'sun-narrow-rectangle-black' },
      { name: 'Flat-top sunglasses', why: 'A defined upper edge adds structure and can make the face appear slightly longer.', presetId: 'sun-curved-flat-top-black' },
    ],
    fitChecks: ['Look for visible corners rather than a frame that repeats every facial curve.', 'Make sure the hinges reach the face width without pinching.', 'Keep the lower rim from touching fuller cheeks when smiling.'],
    reconsider: ['Tiny circular sunglasses', 'Frames narrower than the widest cheek area', 'Very low lenses that visually shorten the face'],
    lensAdvice: 'Medium-to-dark lenses keep a structured frame visually coherent. Gradient lenses can soften a bold cat-eye without removing its lifting effect.',
  },
  square: {
    slug: 'square-face',
    faceShape: 'square',
    name: 'Square',
    description: 'Square faces combine a broad forehead and strong jaw with visible angles. Curved lenses and lighter rims can contrast with that structure instead of repeating it.',
    shoppingGoal: 'Add curvature and comfortable lens depth without making the frame look undersized against a strong jaw.',
    bestStyles: [
      { name: 'Round sunglasses', why: 'Circular lenses provide the clearest contrast to a straight jaw and broad forehead.', presetId: 'sun-round-tortoise' },
      { name: 'Aviator sunglasses', why: 'Curved teardrop lenses soften the outline while the bridge keeps definition.', presetId: 'sun-aviator-gold' },
      { name: 'Oversized rounded sunglasses', why: 'Extra depth balances a broad face when the corners remain soft.', presetId: 'sun-oversized-gradient' },
      { name: 'Soft cat-eye sunglasses', why: 'A gentle upsweep adds movement without stacking another boxy line over the face.', presetId: 'sun-cat-eye-black' },
    ],
    fitChecks: ['Prefer curved or softened lens corners.', 'Use a frame width that matches the forehead and jaw scale.', 'Check that a deep lens does not touch the cheek when smiling.'],
    reconsider: ['Heavy square frames with sharp low corners', 'Small boxy sunglasses', 'Very thick straight temples that add more horizontal weight'],
    lensAdvice: 'Brown or gradient lenses can make a substantial frame feel softer. Polarization and UV protection matter independently of the frame shape.',
  },
  heart: {
    slug: 'heart-face',
    faceShape: 'heart',
    name: 'Heart',
    description: 'Heart-shaped faces are wider through the forehead or upper cheeks and taper toward a narrower chin. Sunglasses work best when their visual weight does not collect only at the brow.',
    shoppingGoal: 'Connect the wider upper face to the narrower chin with light construction or balanced lower lens depth.',
    bestStyles: [
      { name: 'Aviator sunglasses', why: 'The lens widens near the brow and tapers downward in the same direction as the face.', presetId: 'sun-aviator-gold' },
      { name: 'Light cat-eye sunglasses', why: 'A modest upsweep follows the cheekbone without creating an overly heavy top line.', presetId: 'sun-cat-eye-black' },
      { name: 'Wayfarer sunglasses', why: 'Soft lower corners give the frame structure without exaggerating forehead width.', presetId: 'sun-wayfarer-black' },
      { name: 'Oversized gradient sunglasses', why: 'A gradient lens and generous lower depth can distribute visual weight more evenly.', presetId: 'sun-oversized-gradient' },
    ],
    fitChecks: ['Keep decorative brow details lighter than the frame width suggests.', 'Check that the frame does not extend far beyond the forehead.', 'Look for enough lower lens depth to connect visually with the chin.'],
    reconsider: ['Very heavy browline sunglasses', 'Strong top decoration with tiny lower lenses', 'Frames substantially wider than the forehead'],
    lensAdvice: 'Gradient lenses are especially useful because they reduce visual weight toward the bottom while preserving sun coverage across the upper lens.',
  },
  diamond: {
    slug: 'diamond-face',
    faceShape: 'diamond',
    name: 'Diamond',
    description: 'Diamond faces are widest at the cheekbones and narrower at both the forehead and jaw. Sunglasses should clear the cheekbones and add gentle presence near the brow.',
    shoppingGoal: 'Frame prominent cheekbones without pinching at the widest point or adding another severe angle there.',
    bestStyles: [
      { name: 'Cat-eye sunglasses', why: 'The upswept brow adds width above the cheekbones and follows their natural lift.', presetId: 'sun-cat-eye-black' },
      { name: 'Round sunglasses', why: 'Curved lenses soften the angular transition from cheekbones to a narrow chin.', presetId: 'sun-round-tortoise' },
      { name: 'Oversized sunglasses', why: 'A broader, softly squared lens can bridge a narrow forehead and jaw.', presetId: 'sun-oversized-gradient' },
      { name: 'Aviator sunglasses', why: 'A thin frame keeps the cheekbone area open while the lens adds vertical balance.', presetId: 'sun-aviator-gold' },
    ],
    fitChecks: ['The frame should clear rather than sit directly on the cheekbones.', 'Choose a brow line with gentle width near the temples.', 'Avoid narrow bridges or lens shapes that visually squeeze the center of the face.'],
    reconsider: ['Very narrow sunglasses', 'Sharp corners placed directly at the cheekbone', 'Tiny lenses with little brow presence'],
    lensAdvice: 'Gradient or medium-density lenses keep the upper frame expressive without making the narrow forehead look closed in.',
  },
  oblong: {
    slug: 'oblong-face',
    faceShape: 'oblong',
    name: 'Oblong',
    description: 'Oblong faces are noticeably longer than wide with relatively straight side lines. Sunglasses with generous lens depth interrupt the vertical line and add proportional presence.',
    shoppingGoal: 'Use depth and controlled width to divide face length rather than extending it with a shallow frame.',
    bestStyles: [
      { name: 'Oversized sunglasses', why: 'Deep lenses occupy more of the mid-face and balance strong vertical length.', presetId: 'sun-oversized-gradient' },
      { name: 'Aviator sunglasses', why: 'A long teardrop lens adds coverage while a double bridge breaks up the vertical area.', presetId: 'sun-aviator-gold' },
      { name: 'Wayfarer sunglasses', why: 'A strong brow and adequate lens depth introduce a useful horizontal anchor.', presetId: 'sun-wayfarer-black' },
      { name: 'Shield sunglasses', why: 'A wide single-lens line can add bold horizontal emphasis when the scale fits the temples.', presetId: 'sun-shield-wraparound-black' },
    ],
    fitChecks: ['Prioritize lens depth over a very shallow fashion frame.', 'Use a strong bridge or brow line to break up visible face length.', 'Keep the frame wide enough for the temples but not dramatically oversized.'],
    reconsider: ['Tiny shallow sunglasses', 'Narrow rectangles sitting high on the face', 'Frames with minimal vertical lens coverage'],
    lensAdvice: 'A gradient lens can keep a deep frame from feeling too heavy. For driving, check local safety rules because very dark tints are not suitable for every condition.',
  },
  triangle: {
    slug: 'triangle-face',
    faceShape: 'triangle',
    name: 'Triangle',
    description: 'Triangle faces are wider at the jaw than at the forehead. Sunglasses with an intentional upper line can add presence near the temples and balance the lower face.',
    shoppingGoal: 'Draw the eye toward the brows and temples while avoiding extra visual weight near the lower rim.',
    bestStyles: [
      { name: 'Cat-eye sunglasses', why: 'The upswept outer corners add width and lift near the narrower forehead.', presetId: 'sun-cat-eye-black' },
      { name: 'Aviator sunglasses', why: 'A defined double bridge adds upper-face presence while the thin lower rim stays light.', presetId: 'sun-aviator-gold' },
      { name: 'Flat-top sunglasses', why: 'A strong horizontal brow line balances a wider jaw.', presetId: 'sun-curved-flat-top-black' },
      { name: 'Wayfarer sunglasses', why: 'The wider upper edge and softly angled lens create structure without a bottom-heavy effect.', presetId: 'sun-wayfarer-black' },
    ],
    fitChecks: ['Choose visible detail along the brow or outer upper corners.', 'Keep the lower rim lighter than the upper line when possible.', 'Match frame width to the temples without trying to match the full jaw width.'],
    reconsider: ['Bottom-heavy frames', 'Small low-set sunglasses', 'Strong decoration concentrated below the eyes'],
    lensAdvice: 'A darker upper lens or subtle gradient reinforces upper-face emphasis while keeping the lower part of the frame visually lighter.',
  },
}

export const SUNGLASSES_FACE_SHAPE_SLUGS = Object.values(SUNGLASSES_FACE_SHAPE_GUIDES).map((guide) => guide.slug)

export function getSunglassesFaceShapeGuide(slug: string): SunglassesFaceShapeGuide | undefined {
  return Object.values(SUNGLASSES_FACE_SHAPE_GUIDES).find((guide) => guide.slug === slug)
}
