import type { FaceShapeContentSlug } from '@/config/face-shape-content'

/** Task-specific copy for existing English search owners; no new routes. */
export const EN_FACE_IDENTIFICATION = {
  intro: 'Compare face length, cheekbone width and jawline to find your closest shape. Follow the quick check below, or get a free on-device estimate from a photo.',
  faqEyebrow: 'Face-shape check',
  faqTitle: 'Common questions about finding your face shape',
  steps: [
    { title: 'See the outline', text: 'Face forward, keep your head level and move hair away from your forehead and jaw.' },
    { title: 'Find the widest area', text: 'Compare your forehead, cheekbones and jaw. Notice where the outline widens or tapers.' },
    { title: 'Check length and corners', text: 'Compare length with width, then look for a curved jaw or defined corners.' },
  ],
  faq: [
    { question: 'How can I tell what my face shape is?', answer: 'Look at the whole outline: length compared with width, the widest area, and the shape of the jaw. Similar width and length with a curved jaw suggests round; a longer outline with a softly tapered jaw suggests oval.' },
    { question: 'Can I check my face shape without uploading a photo?', answer: 'Yes. Use a mirror and compare your forehead, cheekbones, jaw and face length. The free VisuTry Detector is another option: it processes your selected photo locally in your browser, without a server photo upload.' },
    { question: 'Why do face shape tests give different results?', answer: 'Many faces combine features from more than one category. Camera angle, expression, hair and close-up distortion can also change the estimate. Compare two likely shapes instead of treating one label as a rule.' },
  ],
} as const

export const EN_FACE_SHAPE_GLASSES_HUB = {
  metaTitle: 'Glasses for Your Face Shape: 7-Shape Frame Guide | VisuTry',
  metaDescription: 'Compare glasses for round, oval, square, heart, diamond, oblong and triangle faces. Find frame shapes to try, with practical width and fit checks.',
  eyebrow: 'Glasses by face shape',
  title: 'Glasses for Your Face Shape',
  intro: 'Start with a frame shape you like: angles can contrast a curved outline, while rounded frames soften a strong jaw. Use the guide below, then check width and fit.',
  steps: [
    { title: 'Find your closest shape', text: 'Compare the whole outline, not just your chin or cheeks.' },
    { title: 'Choose the effect', text: 'Try contrast for definition, or repeat a curve for a softer look.' },
    { title: 'Check the actual fit', text: 'Compare frame measurements and try the pair on. A photo preview cannot confirm comfort.' },
  ],
  guideIntro: 'Choose a shape to see frame examples and a closer comparison. These are starting points, not rules about what you can wear.',
  principles: [
    'Two people with the same face shape can need different frame sizes.',
    'A photo preview shows appearance; check physical fit and prescription needs separately.',
    'If you like a different shape, try it. Comfort and personal style matter.',
  ],
  nextEyebrow: 'Choosing frames',
  nextTitle: 'Face shape and glasses: common questions',
  faq: [
    { question: 'Which glasses suit each face shape?', answer: 'Rectangular or square frames add contrast to round faces; round or oval frames soften square faces. Oval faces can start with several shapes and focus on scale. For heart, diamond, oblong and triangle faces, compare where the frame adds width or visual weight.' },
    { question: 'What if I am between two face shapes?', answer: 'Try one frame direction from each guide. Compare the same portrait, keeping the frame width similar, so you can judge the outline rather than a size difference.' },
    { question: 'Does face shape tell me my glasses size?', answer: 'No. A shape label does not determine frame width, bridge size or temple length. Check the measurements of a comfortable pair and confirm the fit with the seller or an optician.' },
  ],
} as const

export const EN_FRAME_FIT_CHECKS: Record<FaceShapeContentSlug, string> = {
  round: 'Check width at the cheeks; tiny frames can feel out of scale.',
  oval: 'Compare lens depth and brow position before choosing a larger size.',
  square: 'Try a lighter rim if the frame competes with the jawline.',
  heart: 'Compare upper-rim weight with a lighter or rimless option.',
  diamond: 'Check cheek clearance and avoid a frame that narrows sharply at the sides.',
  oblong: 'Compare deeper lenses with a shallow rectangle at a similar width.',
  triangle: 'Compare a defined upper rim with a quieter lower edge.',
}

type StyleShoppingGuidance = {
  intro: string
  priorities: string
  checks: readonly { title: string; text: string }[]
  links: readonly { href: string; label: string }[]
}

export const EN_STYLE_SHOPPING_GUIDANCE: Partial<Record<FaceShapeContentSlug, StyleShoppingGuidance>> = {
  round: {
    intro: 'Rectangle, square and geometric frames add definition to a round face. Start with a width that suits your cheeks, then compare sharp corners with a softer square outline.',
    priorities: 'A round face usually has a curved jaw and similar visible width and length. Compare frame width first, then decide how much angular contrast you want.',
    checks: [
      { title: 'Width before shape', text: 'Compare the frame front with your cheek width. A rectangular label does not help if the pair feels too narrow.' },
      { title: 'Sharp or soft corners?', text: 'Crisp rectangles create stronger contrast; rounded squares keep some definition with a softer outline.' },
      { title: 'Check while smiling', text: 'Try the pair physically to check that the lower rims clear your cheeks and the bridge stays comfortable.' },
    ],
    links: [
      { href: '/en/glasses-guide/best-rectangle-glasses-for-round-face', label: 'Rectangle frames for a round face' },
      { href: '/en/glasses-guide/do-round-glasses-suit-a-round-face', label: 'Can round faces wear round glasses?' },
      { href: '/en/sunglasses-for/round-face', label: 'Sunglasses for a round face' },
    ],
  },
  oval: {
    intro: 'Oval faces can try rectangle, browline, aviator and square frames. Compare width, lens depth and brow position to find the scale you prefer; no single frame shape is required.',
    priorities: 'An oval outline is moderately longer than it is wide, with a softly tapered jaw. Frame scale usually makes a bigger difference than following one shape rule.',
    checks: [
      { title: 'Keep width in proportion', text: 'Compare where the outer edges sit relative to your temples. Going wider changes the look even when the lens shape stays the same.' },
      { title: 'Compare lens depth', text: 'A shallow rectangle and a deeper aviator occupy different amounts of the face. Try both at a similar width.' },
      { title: 'Look at the brow line', text: 'A bold upper rim draws attention upward. Check its position while keeping your normal expression.' },
    ],
    links: [
      { href: '/en/glasses-guide/best-browline-glasses-for-oval-face', label: 'Browline frames for an oval face' },
      { href: '/en/glasses-guide/best-cat-eye-glasses-for-oval-face', label: 'Cat-eye frames for an oval face' },
      { href: '/en/face-shapes/compare/oval-vs-oblong', label: 'Oval or oblong: compare the outlines' },
    ],
  },
  diamond: {
    intro: 'Oval, rimless, subtle cat-eye and browline frames are useful starting points for a diamond face. Compare a light lower rim with gentle width near the brows, then check cheek clearance.',
    priorities: 'Diamond faces are widest at the cheekbones, with a narrower forehead and jaw. Look at the upper-rim shape and cheek clearance together, rather than choosing a very narrow frame.',
    checks: [
      { title: 'Leave room at the cheeks', text: 'Check the frame front at your widest point, then try the pair while smiling to assess lower-rim clearance.' },
      { title: 'Compare the upper edge', text: 'A modest cat-eye or browline adds emphasis near the forehead. Compare that with the quieter outline of oval or rimless frames.' },
      { title: 'Check the bridge separately', text: 'Cheekbone width does not determine nose-bridge fit. Look for stable, comfortable contact when trying the actual pair.' },
    ],
    links: [
      { href: '/en/glasses-guide/best-browline-glasses-for-diamond-face', label: 'Browline frames for a diamond face' },
      { href: '/en/face-shapes/compare/heart-vs-diamond', label: 'Heart or diamond: compare the outlines' },
      { href: '/en/glasses-guide/how-wide-should-glasses-be-for-my-face', label: 'Check the frame width' },
    ],
  },
}
