export const CURATED_BRAND_SLUGS = [
  'warby-parker',
  'oakley',
  'zenni',
  'gentle-monster',
] as const

export type CuratedBrandSlug = (typeof CURATED_BRAND_SLUGS)[number]

export interface BrandStyleDirection {
  name: string
  image: string
  description: string
  faceShapeTip: string
}

export interface BrandTryOnContent {
  slug: CuratedBrandSlug
  name: string
  title: string
  description: string
  eyebrow: string
  intro: string
  shoppingNote: string
  styles: readonly BrandStyleDirection[]
}

export const BRAND_TRY_ON_CONTENT: Record<CuratedBrandSlug, BrandTryOnContent> = {
  'warby-parker': {
    slug: 'warby-parker',
    name: 'Warby Parker',
    title: 'Warby Parker Virtual Try-On Guide',
    description: 'Compare Warby Parker-inspired optical frame directions on your photo, from soft square and browline to round and transparent styles, before choosing a model.',
    eyebrow: 'Warby Parker frame finder',
    intro: 'Warby Parker shoppers often compare clean optical shapes, approachable colors, and everyday proportions. Use these close style directions to learn which silhouette works on your face before checking exact models and measurements.',
    shoppingNote: 'Start with the frame shape, then compare lens width, bridge width, and temple length against a pair that already fits you.',
    styles: [
      { name: 'Soft square', image: '/assets/glasses-presets/style-explorer/optical-clear-soft-square.jpg', description: 'A balanced everyday shape with softened corners and a light visual footprint.', faceShapeTip: 'A useful starting point for round, oval, and heart-shaped faces.' },
      { name: 'Warm tortoise', image: '/assets/glasses-presets/style-explorer/optical-warm-tortoise.jpg', description: 'Classic acetate color with enough contrast to define the eye area.', faceShapeTip: 'Often flattering when you want warmth without a very dark frame.' },
      { name: 'Slim browline', image: '/assets/glasses-presets/style-explorer/optical-slim-browline.jpg', description: 'A structured upper rim that adds definition while keeping the lower lens light.', faceShapeTip: 'Worth comparing on oval, diamond, and oblong faces.' },
      { name: 'Thin gold oval', image: '/assets/glasses-presets/style-explorer/optical-thin-gold-oval.jpg', description: 'A lightweight metal direction with softer curves and a subtle vintage feel.', faceShapeTip: 'The curved lens can soften square or angular features.' },
    ],
  },
  oakley: {
    slug: 'oakley',
    name: 'Oakley',
    title: 'Oakley Virtual Try-On Guide',
    description: 'Try Oakley-inspired sport and lifestyle frame directions on your photo. Compare wraparound, shield, rectangular, and aviator silhouettes before you buy.',
    eyebrow: 'Oakley frame finder',
    intro: 'Oakley searches often split between performance eyewear and angular everyday frames. Compare coverage, frame width, lens height, and how strongly the top line follows your brow before selecting an exact model.',
    shoppingNote: 'For sport frames, check coverage and temple grip as well as appearance. A photo try-on helps with style, but exact fit still depends on published measurements and an in-person comfort check.',
    styles: [
      { name: 'Shield wraparound', image: '/assets/glasses-presets/style-explorer/sun-shield-wraparound-black.jpg', description: 'High coverage and a continuous sport-led lens line.', faceShapeTip: 'Compare the overall width carefully, especially on narrower faces.' },
      { name: 'Curved flat top', image: '/assets/glasses-presets/style-explorer/sun-curved-flat-top-black.jpg', description: 'A bold top line with athletic curvature and modern coverage.', faceShapeTip: 'Can add structure to round or oval faces.' },
      { name: 'Narrow rectangle', image: '/assets/glasses-presets/style-explorer/sun-narrow-rectangle-black.jpg', description: 'A lower-profile lifestyle direction with crisp horizontal lines.', faceShapeTip: 'The angular shape can create contrast on rounder features.' },
      { name: 'Gold aviator', image: '/assets/glasses-presets/style-explorer/sun-aviator-gold.jpg', description: 'A lighter, curved alternative to strongly wrapped sport frames.', faceShapeTip: 'Useful for comparing a softer shape on square or heart-shaped faces.' },
    ],
  },
  zenni: {
    slug: 'zenni',
    name: 'Zenni',
    title: 'Zenni Virtual Try-On Guide',
    description: 'Compare Zenni-inspired glasses styles on your photo, including clear, tortoise, geometric, and statement frames, before narrowing down your online order.',
    eyebrow: 'Zenni frame finder',
    intro: 'Zenni offers a very broad range, so the fastest way to narrow a search is by silhouette and visual weight. Test a few clearly different directions first, then use the winning shape to filter exact products and sizes.',
    shoppingNote: 'Because online catalogs contain many similar-looking options, save the measurements of your best-fitting current pair and use them alongside virtual try-on results.',
    styles: [
      { name: 'Transparent geometric', image: '/assets/glasses-presets/style-explorer/optical-transparent-geometric.jpg', description: 'Modern angles with a lighter color that does not dominate the face.', faceShapeTip: 'A flexible option for oval faces and a useful contrast for round faces.' },
      { name: 'Statement color', image: '/assets/glasses-presets/style-explorer/optical-statement-color.jpg', description: 'A bolder acetate direction for shoppers who want the frame to lead the look.', faceShapeTip: 'Check that the frame width stays close to your facial width.' },
      { name: 'Clear soft square', image: '/assets/glasses-presets/style-explorer/optical-clear-soft-square.jpg', description: 'An easy everyday shape with low color contrast.', faceShapeTip: 'Often a forgiving starting point across round, oval, and heart-shaped faces.' },
      { name: 'Rimless geometric', image: '/assets/glasses-presets/style-explorer/optical-rimless-geometric.jpg', description: 'Minimal visual weight with a subtle geometric lens outline.', faceShapeTip: 'Useful when heavy acetate overwhelms smaller or more delicate features.' },
    ],
  },
  'gentle-monster': {
    slug: 'gentle-monster',
    name: 'Gentle Monster',
    title: 'Gentle Monster Virtual Try-On Guide',
    description: 'Try Gentle Monster-inspired statement eyewear directions on your photo. Compare oversized, cat-eye, narrow, and sculpted black frames before choosing a model.',
    eyebrow: 'Gentle Monster frame finder',
    intro: 'Gentle Monster shoppers usually want a strong fashion silhouette. The key question is not only whether the frame looks bold, but whether its width, lens height, and brow line stay balanced with your features.',
    shoppingNote: 'Statement frames magnify small fit differences. Compare the official model measurements with a pair you own, particularly total width and bridge placement.',
    styles: [
      { name: 'Oversized gradient', image: '/assets/glasses-presets/style-explorer/sun-oversized-gradient.jpg', description: 'Large lens coverage with a polished fashion-forward profile.', faceShapeTip: 'Check cheek clearance and total width on smaller faces.' },
      { name: 'Black cat-eye', image: '/assets/glasses-presets/style-explorer/sun-cat-eye-black.jpg', description: 'An upswept outer edge that creates a deliberate statement.', faceShapeTip: 'Can lift oval, round, and heart-shaped faces visually.' },
      { name: 'Narrow rectangle', image: '/assets/glasses-presets/style-explorer/sun-narrow-rectangle-black.jpg', description: 'A sharp, compact silhouette with a strong editorial feel.', faceShapeTip: 'Compare lens height carefully if you have a longer face.' },
      { name: 'Curved flat top', image: '/assets/glasses-presets/style-explorer/sun-curved-flat-top-black.jpg', description: 'Sculpted black coverage with a decisive horizontal brow line.', faceShapeTip: 'The angular top line can contrast well with rounder features.' },
    ],
  },
}

export function isCuratedBrandSlug(slug: string): slug is CuratedBrandSlug {
  return CURATED_BRAND_SLUGS.includes(slug as CuratedBrandSlug)
}

export function getCuratedBrandContent(slug: string): BrandTryOnContent | null {
  return isCuratedBrandSlug(slug) ? BRAND_TRY_ON_CONTENT[slug] : null
}
