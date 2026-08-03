export type CombinationSearchPageType = 'face-frame' | 'gender-style' | 'decision-question'
export type CombinationSearchAction = 'detector' | 'try_on' | 'compare' | 'advisor'

export type CombinationSearchPage = {
  slug: string
  type: CombinationSearchPageType
  title: string
  metaDescription: string
  eyebrow: string
  intro: string
  queryCluster: string
  primaryAnswer: string
  whyItWorks: string
  watchFor: string
  decisionTip: string
  faq: readonly { question: string; answer: string }[]
  includeCtas: readonly CombinationSearchAction[]
  bottomCtas: readonly CombinationSearchAction[]
  ctaLabels?: {
    detector?: string
    tryOn?: string
    compare?: string
    advisor?: string
  }
  relatedOwnerPath?: string
}

type FaceFrameInput = {
  slug: string
  title: string
  metaDescription: string
  face: string
  frame: string
  primaryAnswer: string
  whyItWorks: string
  watchFor: string
  decisionTip: string
  relatedOwnerPath: string
}

function makeFaceFrame(input: FaceFrameInput): CombinationSearchPage {
  return {
    slug: input.slug,
    type: 'face-frame',
    title: input.title,
    metaDescription: input.metaDescription,
    eyebrow: `${input.frame} frames × ${input.face} face`,
    intro: input.primaryAnswer,
    queryCluster: `face-frame:${input.face.toLowerCase()}:${input.frame.toLowerCase()}`,
    primaryAnswer: input.primaryAnswer,
    whyItWorks: input.whyItWorks,
    watchFor: input.watchFor,
    decisionTip: input.decisionTip,
    relatedOwnerPath: input.relatedOwnerPath,
    includeCtas: ['detector', 'try_on', 'compare'],
    bottomCtas: ['try_on', 'compare'],
    ctaLabels: {
      detector: 'Check my face shape first',
      tryOn: `Try ${input.frame.toLowerCase()} glasses on my photo`,
      compare: 'Compare frame directions',
    },
    faq: [
      {
        question: `Do ${input.frame.toLowerCase()} glasses suit a ${input.face.toLowerCase()} face?`,
        answer: input.primaryAnswer,
      },
      {
        question: `What should I check before buying ${input.frame.toLowerCase()} glasses?`,
        answer: input.watchFor,
      },
      {
        question: 'Is face shape enough to choose a frame?',
        answer:
          'No. Face shape is a useful first filter, but frame width, bridge fit, lens depth, prescription needs, and personal style should all be checked before purchase.',
      },
    ],
  }
}

type GenderStyleInput = {
  slug: string
  title: string
  metaDescription: string
  face: string
  audience: 'Women' | 'Men'
  primaryAnswer: string
  whyItWorks: string
  watchFor: string
  decisionTip: string
  relatedOwnerPath: string
}

function makeGenderStyle(input: GenderStyleInput): CombinationSearchPage {
  return {
    slug: input.slug,
    type: 'gender-style',
    title: input.title,
    metaDescription: input.metaDescription,
    eyebrow: `${input.face} face · ${input.audience.toLowerCase()}`,
    intro: input.primaryAnswer,
    queryCluster: `gender-style:${input.face.toLowerCase()}:${input.audience.toLowerCase()}`,
    primaryAnswer: input.primaryAnswer,
    whyItWorks: input.whyItWorks,
    watchFor: input.watchFor,
    decisionTip: input.decisionTip,
    relatedOwnerPath: input.relatedOwnerPath,
    includeCtas: ['detector', 'advisor', 'try_on'],
    bottomCtas: ['advisor', 'try_on'],
    ctaLabels: {
      detector: 'Check my face shape',
      advisor: 'Get personalized frame advice',
      tryOn: 'Try shortlisted frames on my photo',
    },
    faq: [
      {
        question: `What glasses usually suit ${input.audience.toLowerCase()} with a ${input.face.toLowerCase()} face?`,
        answer: input.primaryAnswer,
      },
      {
        question: 'Should gender decide the frame shape?',
        answer:
          'No. These pages use common styling intent, not a rule. Proportion, fit, comfort, prescription, and the look you want matter more than gender labels.',
      },
      {
        question: 'How do I narrow the shortlist?',
        answer: input.decisionTip,
      },
    ],
  }
}

type DecisionQuestionInput = {
  slug: string
  title: string
  metaDescription: string
  primaryAnswer: string
  whyItWorks: string
  watchFor: string
  decisionTip: string
  includeCtas?: readonly CombinationSearchAction[]
  bottomCtas?: readonly CombinationSearchAction[]
}

function makeDecisionQuestion(input: DecisionQuestionInput): CombinationSearchPage {
  return {
    slug: input.slug,
    type: 'decision-question',
    title: input.title,
    metaDescription: input.metaDescription,
    eyebrow: 'Eyewear decision question',
    intro: input.primaryAnswer,
    queryCluster: `decision-question:${input.slug}`,
    primaryAnswer: input.primaryAnswer,
    whyItWorks: input.whyItWorks,
    watchFor: input.watchFor,
    decisionTip: input.decisionTip,
    includeCtas: input.includeCtas || ['detector', 'try_on', 'compare'],
    bottomCtas: input.bottomCtas || ['try_on', 'compare'],
    ctaLabels: {
      detector: 'Check my face shape',
      tryOn: 'Test the look on my photo',
      compare: 'Compare a few frames',
      advisor: 'Get personalized advice',
    },
    faq: [
      { question: input.title.replace(/\?$/, '') + '?', answer: input.primaryAnswer },
      { question: 'What is the fastest way to validate the choice?', answer: input.decisionTip },
      {
        question: 'What can virtual try-on not confirm?',
        answer:
          'A visual preview cannot confirm physical comfort, exact bridge pressure, optical measurements, or prescription suitability. Confirm those with the seller or an optical professional.',
      },
    ],
  }
}

export const COMBINATION_SEARCH_PAGES: readonly CombinationSearchPage[] = [
  makeFaceFrame({
    slug: 'best-rectangle-glasses-for-round-face',
    title: 'Best Rectangle Glasses for a Round Face',
    metaDescription:
      'Rectangle glasses can add useful structure to a round face. See what proportions to look for, then try the direction on your own photo.',
    face: 'Round',
    frame: 'Rectangle',
    primaryAnswer:
      'Rectangle frames are a strong first direction for many round faces because their straight top line and visible corners contrast with softer facial curves.',
    whyItWorks:
      'The contrast can make the frame feel more defined without requiring an oversized or very heavy look.',
    watchFor:
      'Avoid frames that are much narrower than the cheeks or so shallow that they look undersized. Width and brow alignment matter as much as the rectangle shape itself.',
    decisionTip:
      'Try one medium-width rectangle and one slightly wider option side by side. Keep the one that looks proportional rather than simply the most angular.',
    relatedOwnerPath: '/style/round-face',
  }),
  makeFaceFrame({
    slug: 'best-square-glasses-for-round-face',
    title: 'Best Square Glasses for a Round Face',
    metaDescription:
      'Square glasses create stronger corners against a round face. Learn when the shape works best and compare it with softer alternatives.',
    face: 'Round',
    frame: 'Square',
    primaryAnswer:
      'Square frames can create a crisp, structured contrast on a round face, especially when the frame is wide enough to sit naturally across the cheek area.',
    whyItWorks:
      'The visible corners add definition while a balanced lens depth keeps the frame from looking too severe.',
    watchFor:
      'Very thick square frames can dominate smaller features. Also avoid a frame that ends inside the widest point of the cheeks.',
    decisionTip:
      'Compare a classic square with a rectangle. If the square feels too heavy, keep the angular idea but reduce lens depth or rim thickness.',
    relatedOwnerPath: '/style/round-face',
  }),
  makeFaceFrame({
    slug: 'best-browline-glasses-for-round-face',
    title: 'Best Browline Glasses for a Round Face',
    metaDescription:
      'Browline glasses can add upper-face definition to a round face. See what to check before choosing the look.',
    face: 'Round',
    frame: 'Browline',
    primaryAnswer:
      'Browline frames can work well on round faces because the stronger upper rim creates a horizontal anchor while the lower lens stays visually lighter.',
    whyItWorks:
      'That upper emphasis can add structure without surrounding the whole face with a heavy geometric outline.',
    watchFor:
      'Make sure the browline follows rather than fights your natural eyebrow angle, and avoid a frame that is too narrow across the temples.',
    decisionTip:
      'Try a browline next to a rectangle. Choose browline when you want structure concentrated at the top rather than around the entire lens.',
    relatedOwnerPath: '/style/round-face',
  }),
  makeFaceFrame({
    slug: 'best-cat-eye-glasses-for-round-face',
    title: 'Best Cat-Eye Glasses for a Round Face',
    metaDescription:
      'Cat-eye glasses can add lift and diagonal movement to a round face. Learn how much upsweep is useful before trying them on your photo.',
    face: 'Round',
    frame: 'Cat-Eye',
    primaryAnswer:
      'A controlled cat-eye can suit a round face because the outer upsweep introduces diagonal movement and definition above the cheek line.',
    whyItWorks:
      'The lift can visually redirect attention upward instead of repeating the face’s softer circular outline.',
    watchFor:
      'An extremely narrow or sharply exaggerated cat-eye may pinch the face visually. Check temple width and make sure the upsweep does not sit far above the brows.',
    decisionTip:
      'Compare a subtle cat-eye with a rectangle. The cat-eye is usually the better choice when you want lift and personality rather than purely geometric contrast.',
    relatedOwnerPath: '/style/round-face',
  }),
  makeFaceFrame({
    slug: 'best-geometric-glasses-for-round-face',
    title: 'Best Geometric Glasses for a Round Face',
    metaDescription:
      'Geometric glasses can add deliberate angles to a round face. See how to use the contrast without letting the frame overpower your features.',
    face: 'Round',
    frame: 'Geometric',
    primaryAnswer:
      'Geometric frames can be effective on a round face because multiple straight edges create contrast with a smooth jawline and fuller cheek contour.',
    whyItWorks:
      'The shape feels distinctive while still following the same principle as rectangle or square frames: introduce visible structure.',
    watchFor:
      'Too many sharp edges plus a very thick rim can become visually busy. Keep the overall frame width proportional to the face.',
    decisionTip:
      'Use geometric frames as the bolder comparison option beside a simpler rectangle. If both work, choose based on how expressive you want the eyewear to feel.',
    relatedOwnerPath: '/style/round-face',
  }),
  makeFaceFrame({
    slug: 'best-cat-eye-glasses-for-oval-face',
    title: 'Best Cat-Eye Glasses for an Oval Face',
    metaDescription:
      'Cat-eye glasses often work naturally with balanced oval proportions. See how to choose the right width and amount of lift.',
    face: 'Oval',
    frame: 'Cat-Eye',
    primaryAnswer:
      'Oval faces support many frame shapes, and cat-eye frames are useful when you want to emphasize the cheekbones and add a deliberate upward line.',
    whyItWorks:
      'Because the face is already balanced, the cat-eye can be selected for expression rather than correction.',
    watchFor:
      'Avoid an upsweep that extends far beyond the temple width or a lens that is so shallow it looks disconnected from the rest of the face.',
    decisionTip:
      'Compare a subtle cat-eye with a stronger one. The better option usually follows your brow and cheekbone scale without making the outer corner the only thing you notice.',
    relatedOwnerPath: '/style/oval-face',
  }),
  makeFaceFrame({
    slug: 'best-aviator-glasses-for-oval-face',
    title: 'Best Aviator Glasses for an Oval Face',
    metaDescription:
      'Aviator glasses can suit an oval face when lens depth and bridge width stay in proportion. Use this guide before testing the look on your photo.',
    face: 'Oval',
    frame: 'Aviator',
    primaryAnswer:
      'Aviators often suit oval faces because the softly tapered lens adds character while the overall proportions remain balanced.',
    whyItWorks:
      'The shape can add vertical depth without forcing the face to look wider or more angular than it is.',
    watchFor:
      'Large aviator lenses can cover too much cheek area, while a bridge that sits too low can make the frame look oversized even when the width is correct.',
    decisionTip:
      'Try one classic aviator and one shallower version. Keep the version whose lens depth complements your face length rather than simply choosing the larger frame.',
    relatedOwnerPath: '/style/oval-face',
  }),
  makeFaceFrame({
    slug: 'best-browline-glasses-for-oval-face',
    title: 'Best Browline Glasses for an Oval Face',
    metaDescription:
      'Browline glasses give an oval face more upper-frame definition. See what proportions keep the look balanced.',
    face: 'Oval',
    frame: 'Browline',
    primaryAnswer:
      'Browline frames work well with oval proportions when you want a stronger visual anchor around the brows without adding equal weight around the lower lens.',
    whyItWorks:
      'The face’s natural balance leaves room for the heavier upper rim to become the main styling feature.',
    watchFor:
      'Watch for a browline that sits too high or extends beyond the temples. The frame should echo the brow area rather than create a second unrelated line.',
    decisionTip:
      'Compare a browline against a classic rectangle. Choose browline when the upper-rim emphasis adds character without making the forehead feel crowded.',
    relatedOwnerPath: '/style/oval-face',
  }),
  makeFaceFrame({
    slug: 'best-oversized-glasses-for-oval-face',
    title: 'Best Oversized Glasses for an Oval Face',
    metaDescription:
      'Oversized glasses can work on an oval face, but scale matters more than the label. Learn how to keep a larger frame proportional.',
    face: 'Oval',
    frame: 'Oversized',
    primaryAnswer:
      'Oval faces can carry larger frames because their balanced proportions do not require one specific corrective shape.',
    whyItWorks:
      'A larger lens can become a fashion statement while still preserving the face’s natural symmetry.',
    watchFor:
      'Oversized should not mean wider than the temples by a large margin or low enough to rest visually on the cheeks. Bridge fit and eyebrow visibility remain important.',
    decisionTip:
      'Compare your preferred oversized frame with one medium-size option. If the large frame still leaves the face visible and centered, the scale is probably working.',
    relatedOwnerPath: '/style/oval-face',
  }),
  makeFaceFrame({
    slug: 'best-round-glasses-for-square-face',
    title: 'Best Round Glasses for a Square Face',
    metaDescription:
      'Round glasses can soften the strong angles of a square face. See when the contrast works and what width to avoid.',
    face: 'Square',
    frame: 'Round',
    primaryAnswer:
      'Round frames are a classic contrast for a square face because curved lenses soften the visual repetition of a broad forehead and defined jawline.',
    whyItWorks:
      'The curve creates a different geometry instead of stacking another strong box shape on top of the face.',
    watchFor:
      'Tiny round frames can look undersized against a wider jaw. Aim for enough width and lens depth to stay in scale with the face.',
    decisionTip:
      'Compare a true round frame with a soft oval. If the circle feels too stylized, the oval keeps the softening effect with less visual contrast.',
    relatedOwnerPath: '/style/square-face',
  }),
  makeFaceFrame({
    slug: 'best-aviator-glasses-for-square-face',
    title: 'Best Aviator Glasses for a Square Face',
    metaDescription:
      'Aviators can soften a square face while keeping a strong frame identity. Learn what bridge and lens depth to check.',
    face: 'Square',
    frame: 'Aviator',
    primaryAnswer:
      'Aviator lenses add curves and taper against a square jaw, giving you contrast without making the frame look delicate.',
    whyItWorks:
      'The rounded lower lens can soften the face while the top bar preserves a confident horizontal line.',
    watchFor:
      'Avoid an aviator that is too narrow or whose bottom edge ends directly on the widest jaw line. Very deep lenses can also dominate shorter square faces.',
    decisionTip:
      'Compare a classic aviator with a round frame. Pick the aviator when you want softness plus a stronger top line.',
    relatedOwnerPath: '/style/square-face',
  }),
  makeFaceFrame({
    slug: 'best-rimless-glasses-for-square-face',
    title: 'Best Rimless Glasses for a Square Face',
    metaDescription:
      'Rimless glasses can reduce visual weight on a square face. See why lens shape and size matter even when the frame is minimal.',
    face: 'Square',
    frame: 'Rimless',
    primaryAnswer:
      'Rimless glasses can work well on square faces because they avoid adding another heavy outline around an already structured jaw and forehead.',
    whyItWorks:
      'A softer lens shape keeps the eyewear present without competing with strong facial angles.',
    watchFor:
      'Minimal construction does not fix poor proportions. A lens that is too narrow, shallow, or small can still look out of scale.',
    decisionTip:
      'Compare rimless with a thin metal oval. Choose rimless when you want the least visual weight while keeping enough lens size to match the face.',
    relatedOwnerPath: '/style/square-face',
  }),
  makeFaceFrame({
    slug: 'best-rounded-glasses-for-heart-shaped-face',
    title: 'Best Rounded Glasses for a Heart-Shaped Face',
    metaDescription:
      'Rounded glasses can soften a heart-shaped face when the upper rim stays light and the lens adds presence lower down.',
    face: 'Heart',
    frame: 'Rounded',
    primaryAnswer:
      'Rounded frames can suit heart-shaped faces because soft lens curves avoid adding extra weight to a broader forehead while keeping visual presence through the lower half of the frame.',
    whyItWorks:
      'That balance can connect the upper face to a narrower chin without relying on a very heavy brow line.',
    watchFor:
      'Avoid frames with dense decoration at the top or a width that extends far past the forehead. Keep the bridge comfortable and centered.',
    decisionTip:
      'Compare a rounded frame with a subtle cat-eye. Rounded frames are usually calmer; cat-eye adds more lift and expression.',
    relatedOwnerPath: '/style/heart-face',
  }),
  makeFaceFrame({
    slug: 'best-cat-eye-glasses-for-heart-shaped-face',
    title: 'Best Cat-Eye Glasses for a Heart-Shaped Face',
    metaDescription:
      'A subtle cat-eye can echo the upper-face structure of a heart-shaped face without becoming too top-heavy.',
    face: 'Heart',
    frame: 'Cat-Eye',
    primaryAnswer:
      'A controlled cat-eye can work on heart-shaped faces when the frame keeps the brow area light and uses a gentle outer lift rather than a thick, heavy top rim.',
    whyItWorks:
      'The lift can emphasize cheekbones while the lens still carries enough depth to balance a narrower chin.',
    watchFor:
      'Avoid highly decorated or very wide outer corners that add more weight where the face is already widest.',
    decisionTip:
      'Try a subtle cat-eye beside a rounded frame. Choose the cat-eye if the lift flatters the cheekbones without making the forehead feel broader.',
    relatedOwnerPath: '/style/heart-face',
  }),
  makeFaceFrame({
    slug: 'best-browline-glasses-for-diamond-face',
    title: 'Best Browline Glasses for a Diamond Face',
    metaDescription:
      'Browline glasses can add presence near a narrower forehead on a diamond face. See how to avoid crowding prominent cheekbones.',
    face: 'Diamond',
    frame: 'Browline',
    primaryAnswer:
      'Browline frames can help a diamond face by adding controlled width and definition near the brow area while leaving the lower lens lighter around prominent cheekbones.',
    whyItWorks:
      'The upper emphasis can visually connect narrower temples to the wider middle of the face.',
    watchFor:
      'Avoid very narrow lenses or a thick lower rim that visually pinches the cheek area. Check that the top bar does not sit too high above the brows.',
    decisionTip:
      'Compare a browline with an oval frame. Browline works when you want more upper-face definition; oval is the softer alternative.',
    relatedOwnerPath: '/style/diamond-face',
  }),
  makeFaceFrame({
    slug: 'best-oversized-glasses-for-long-face',
    title: 'Best Oversized Glasses for a Long Face',
    metaDescription:
      'Oversized glasses can add useful lens depth to a long or oblong face. Learn how to add scale without making the frame too wide.',
    face: 'Long',
    frame: 'Oversized',
    primaryAnswer:
      'A deeper oversized frame can suit an oblong face because lens depth interrupts a long vertical line and adds visible scale across the middle of the face.',
    whyItWorks:
      'The goal is usually depth and presence, not simply maximum width.',
    watchFor:
      'Avoid very shallow oversized frames or frames extending far beyond the temples. A large frame should still stay centered and stable on the bridge.',
    decisionTip:
      'Compare a deep oversized rectangle with a medium browline. Choose the larger frame only if the added depth improves proportion rather than covering the face.',
    relatedOwnerPath: '/style/oblong-face',
  }),

  makeGenderStyle({
    slug: 'glasses-for-round-face-women',
    title: 'Glasses for a Round Face: Women’s Styling Guide',
    metaDescription:
      'A practical women’s styling guide for round faces, with frame directions to shortlist before using virtual try-on.',
    face: 'Round',
    audience: 'Women',
    primaryAnswer:
      'For a round face, start with frames that add some structure or lift: rectangles, squares, controlled cat-eyes, and light geometric shapes are strong directions to compare.',
    whyItWorks:
      'These shapes create contrast with softer facial curves while still leaving room for personal style, color, and material choices.',
    watchFor:
      'Do not choose only by label or trend. Frame width, brow alignment, bridge fit, and how much lens depth you like will change the result.',
    decisionTip:
      'Shortlist one structured frame, one lifted frame, and one softer alternative, then try all three on the same photo.',
    relatedOwnerPath: '/style/round-face',
  }),
  makeGenderStyle({
    slug: 'glasses-for-round-face-men',
    title: 'Glasses for a Round Face: Men’s Styling Guide',
    metaDescription:
      'A practical men’s styling guide for round faces, from rectangle and square frames to lighter geometric options.',
    face: 'Round',
    audience: 'Men',
    primaryAnswer:
      'For a round face, rectangle, square, browline, and restrained geometric frames are useful starting points because they introduce clearer edges and horizontal structure.',
    whyItWorks:
      'The contrast can define the eyewear without requiring an aggressive or oversized frame.',
    watchFor:
      'Avoid automatically choosing the thickest frame. A medium rim with the right width often looks more proportional than a very heavy box shape.',
    decisionTip:
      'Compare one classic rectangle with one browline and one softer option. Use the photo result to judge scale rather than relying on category names.',
    relatedOwnerPath: '/style/round-face',
  }),
  makeGenderStyle({
    slug: 'glasses-for-oval-face-women',
    title: 'Glasses for an Oval Face: Women’s Styling Guide',
    metaDescription:
      'Oval faces can support many frame shapes. Use this women’s styling guide to narrow the shortlist by scale and expression.',
    face: 'Oval',
    audience: 'Women',
    primaryAnswer:
      'Oval proportions are flexible, so the best shortlist often comes from deciding how expressive you want the eyewear to be: cat-eye, browline, rectangle, aviator, and balanced oversized frames can all work.',
    whyItWorks:
      'Because there is less need to correct the face outline, color, material, brow alignment, and lens depth become more important decision variables.',
    watchFor:
      'The main risk is scale. Very wide or very narrow frames can disturb otherwise balanced proportions.',
    decisionTip:
      'Choose three different moods rather than three nearly identical shapes, then compare them on one photo.',
    relatedOwnerPath: '/style/oval-face',
  }),
  makeGenderStyle({
    slug: 'glasses-for-oval-face-men',
    title: 'Glasses for an Oval Face: Men’s Styling Guide',
    metaDescription:
      'A practical men’s guide to glasses for oval faces, including rectangle, browline, aviator, and balanced square directions.',
    face: 'Oval',
    audience: 'Men',
    primaryAnswer:
      'Oval faces usually support rectangle, square, browline, aviator, and other balanced frame shapes, so style preference and fit can lead the decision.',
    whyItWorks:
      'The face is already proportionally balanced, which gives you more freedom to choose between classic, minimal, or statement eyewear.',
    watchFor:
      'Do not let the frame become much wider than the temples or so shallow that it looks undersized against the face length.',
    decisionTip:
      'Compare a classic structured frame, a lighter metal option, and one bolder choice. Keep the one that fits your features rather than the category stereotype.',
    relatedOwnerPath: '/style/oval-face',
  }),
  makeGenderStyle({
    slug: 'glasses-for-square-face-women',
    title: 'Glasses for a Square Face: Women’s Styling Guide',
    metaDescription:
      'Use curved or lighter frames to contrast a square face, or choose deliberate geometry when you want to emphasize strong structure.',
    face: 'Square',
    audience: 'Women',
    primaryAnswer:
      'Round, oval, thin metal, soft aviator, and lighter cat-eye frames are useful directions when you want contrast with a defined jaw and broad forehead.',
    whyItWorks:
      'Curves and lighter construction can soften the overall look, while a deliberate geometric frame can instead emphasize structure if that is the style goal.',
    watchFor:
      'Avoid assuming every square face needs a round frame. Width, lens size, and how much jaw emphasis you want should guide the choice.',
    decisionTip:
      'Try one curved frame, one aviator or thin metal frame, and one stronger geometric option before deciding.',
    relatedOwnerPath: '/style/square-face',
  }),
  makeGenderStyle({
    slug: 'glasses-for-square-face-men',
    title: 'Glasses for a Square Face: Men’s Styling Guide',
    metaDescription:
      'A practical men’s guide to frames for square faces, with softer alternatives and structured options to compare.',
    face: 'Square',
    audience: 'Men',
    primaryAnswer:
      'Round, oval, aviator, and lighter metal frames create contrast with a square face; a refined rectangle can also work when you intentionally want to reinforce the structure.',
    whyItWorks:
      'The useful decision is whether you want the frame to soften the jaw or echo it—not whether one shape is universally correct.',
    watchFor:
      'Heavy boxy frames that match the jaw exactly can feel visually dense. Check rim thickness and lens depth as well as shape.',
    decisionTip:
      'Compare one curved frame with one structured frame. The side-by-side result will show whether contrast or reinforcement suits your style better.',
    relatedOwnerPath: '/style/square-face',
  }),
  makeGenderStyle({
    slug: 'glasses-for-heart-shaped-face-women',
    title: 'Glasses for a Heart-Shaped Face: Women’s Styling Guide',
    metaDescription:
      'A women’s styling guide for heart-shaped faces, with lighter, rounded, and subtle cat-eye options to compare.',
    face: 'Heart-Shaped',
    audience: 'Women',
    primaryAnswer:
      'Lightweight rounded frames, subtle cat-eyes, and frames with less visual weight at the brow are useful starting points for a heart-shaped face.',
    whyItWorks:
      'They can keep a broader upper face from becoming top-heavy while adding enough presence around the eyes and lower lens area.',
    watchFor:
      'Very wide or heavily decorated brow lines can amplify forehead width. Keep the upper frame controlled and check temple alignment.',
    decisionTip:
      'Compare a rounded frame, a subtle cat-eye, and one light metal frame on the same photo.',
    relatedOwnerPath: '/style/heart-face',
  }),
  makeGenderStyle({
    slug: 'glasses-for-diamond-face-women',
    title: 'Glasses for a Diamond Face: Women’s Styling Guide',
    metaDescription:
      'A women’s styling guide for diamond faces, focusing on oval, cat-eye, rimless, and browline directions.',
    face: 'Diamond',
    audience: 'Women',
    primaryAnswer:
      'Oval, rimless, subtle cat-eye, and browline frames can work well on diamond faces because they add softness or controlled width around narrower temples.',
    whyItWorks:
      'The goal is usually to connect the forehead and jaw to prominent cheekbones rather than add more width at the cheeks themselves.',
    watchFor:
      'Very narrow frames can pinch visually at the cheekbones, while thick lower rims can make the middle face feel crowded.',
    decisionTip:
      'Try one soft oval, one lifted cat-eye, and one upper-emphasis browline to see which relationship with the cheekbones feels best.',
    relatedOwnerPath: '/style/diamond-face',
  }),

  makeDecisionQuestion({
    slug: 'do-round-glasses-suit-a-round-face',
    title: 'Do Round Glasses Suit a Round Face?',
    metaDescription:
      'Round glasses can suit a round face, but they repeat rather than contrast the face shape. Learn when that is intentional and when another shape may work better.',
    primaryAnswer:
      'Yes, they can. Round-on-round is not automatically wrong; it creates a softer, more harmonious look. If you want more definition, a rectangle, square, or lifted cat-eye will usually create stronger contrast.',
    whyItWorks:
      'Matching shapes create harmony, while contrasting shapes create definition. The right choice depends on the look you want rather than a rigid face-shape rule.',
    watchFor:
      'Small round frames can exaggerate fullness or look undersized. Check frame width and avoid a lens that sits well inside the cheeks.',
    decisionTip:
      'Try a round frame and a rectangle side by side on the same photo. That instantly shows whether harmony or contrast feels better on your face.',
  }),
  makeDecisionQuestion({
    slug: 'do-aviators-suit-an-oval-face',
    title: 'Do Aviators Suit an Oval Face?',
    metaDescription:
      'Aviators often suit oval faces because the proportions are flexible. Lens depth, bridge position, and overall scale decide whether the frame works.',
    primaryAnswer:
      'Usually, yes. Oval faces can carry the tapered aviator shape well, especially when the lens depth is proportional to the face length and the frame does not extend far past the temples.',
    whyItWorks:
      'The oval face already has balanced proportions, so aviators can be selected mainly for style and scale rather than correction.',
    watchFor:
      'Very deep lenses or a low-sitting bridge can make an aviator look oversized. Check cheek clearance and brow alignment.',
    decisionTip:
      'Try one classic aviator and one shallower alternative on your photo, then compare which lens depth looks more natural.',
  }),
  makeDecisionQuestion({
    slug: 'are-cat-eye-glasses-good-for-round-faces',
    title: 'Are Cat-Eye Glasses Good for Round Faces?',
    metaDescription:
      'Cat-eye glasses can be a strong choice for round faces because the outer lift adds diagonal movement and definition.',
    primaryAnswer:
      'Yes, especially when the upsweep is controlled rather than extreme. The diagonal outer corner creates contrast with softer cheeks and a curved jawline.',
    whyItWorks:
      'The shape redirects attention upward and adds structure without requiring a heavy rectangular frame.',
    watchFor:
      'A very narrow cat-eye can pinch the face visually. Make sure the frame reaches the temple area and the outer corner does not sit far above the brows.',
    decisionTip:
      'Compare a subtle cat-eye with a rectangle. Choose based on whether you prefer lift and expression or cleaner geometric structure.',
  }),
  makeDecisionQuestion({
    slug: 'should-glasses-cover-your-eyebrows',
    title: 'Should Glasses Cover Your Eyebrows?',
    metaDescription:
      'Glasses can overlap the eyebrows, but the upper rim should usually relate naturally to the brow line. See what to check before deciding a frame is too high or too large.',
    primaryAnswer:
      'Glasses do not have to leave every eyebrow fully visible, but the upper rim should usually relate naturally to your brow line instead of cutting across it awkwardly.',
    whyItWorks:
      'Brow alignment affects how centered and intentional the frame looks, but it is not a strict fitting rule for every design.',
    watchFor:
      'If the frame hides the brows completely and also sits low on the cheeks, it may simply be too large or positioned poorly. Fit and bridge height matter.',
    decisionTip:
      'Use a straight-on photo and compare two frame heights. Pick the one whose upper rim works with your brow rather than judging eyebrow visibility alone.',
    includeCtas: ['try_on', 'compare', 'advisor'],
    bottomCtas: ['try_on', 'compare'],
  }),
  makeDecisionQuestion({
    slug: 'how-wide-should-glasses-be-for-my-face',
    title: 'How Wide Should Glasses Be for My Face?',
    metaDescription:
      'Learn how wide glasses should be relative to your face, what overhang or squeezing to watch for, and how to validate visual width before buying.',
    primaryAnswer:
      'A good starting point is a frame whose overall width is close to your face width at the temples, without obvious squeezing or large overhang.',
    whyItWorks:
      'Proportional width keeps the eyes reasonably centered in the lenses and prevents the frame from looking pinched or oversized.',
    watchFor:
      'Style can intentionally go wider, but large overhang, visible temple flare, or a frame much narrower than the cheeks are warning signs.',
    decisionTip:
      'Compare a medium and a wider frame on the same photo, then confirm the actual millimeter measurements and temple fit with the seller before buying.',
    includeCtas: ['detector', 'try_on', 'compare'],
    bottomCtas: ['try_on', 'compare'],
  }),
  makeDecisionQuestion({
    slug: 'how-should-glasses-fit-your-face',
    title: 'How Should Glasses Fit Your Face?',
    metaDescription:
      'Learn the visual signs of good glasses fit: width, bridge position, eyebrow line, lens depth, cheek clearance, and what still needs a real fitting.',
    primaryAnswer:
      'Glasses should look centered, sit securely at the bridge, avoid obvious temple flare, and keep the lens scale proportional to your features.',
    whyItWorks:
      'Visual balance comes from several relationships at once: overall width, bridge position, eyebrow line, lens depth, cheek clearance, and where the pupils sit within the lenses.',
    watchFor:
      'A photo preview cannot confirm physical comfort, slipping, pressure behind the ears, or prescription measurements. Those require real dimensions and fitting.',
    decisionTip:
      'Use virtual try-on for visual proportion, then confirm frame measurements and physical fit before purchase.',
    includeCtas: ['advisor', 'try_on', 'compare'],
    bottomCtas: ['try_on', 'advisor'],
  }),
] as const

export const COMBINATION_SEARCH_PAGE_SLUGS = COMBINATION_SEARCH_PAGES.map((page) => page.slug)

export function getCombinationSearchPage(slug: string): CombinationSearchPage | undefined {
  return COMBINATION_SEARCH_PAGES.find((page) => page.slug === slug)
}
