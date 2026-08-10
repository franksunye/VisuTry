export type VisualSeoAssetId = `VSEO-${string}`
export type VisualSeoAssetBatch = 'B01' | 'B02'

export type VisualSeoAsset = {
  id: VisualSeoAssetId
  batch: VisualSeoAssetBatch
  sourcePath: string
  publicPath: string
  pagePath: string
  width: number
  height: number
  heading: string
  alt: string
  body: string
  displayWidth?: 'primary' | 'secondary' | 'compare'
  bodyPosition?: 'before' | 'after'
  link?: {
    href: string
    label: string
  }
}

/**
 * B01 is the first accepted visual SEO unit. Keep the page copy here so the
 * rendered figure, image sitemap, and asset QA all use the same mapping.
 */
export const B01_VISUAL_SEO_ASSETS = [
  {
    id: 'VSEO-001',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-001__ai-face-shape-detector-example.png',
    publicPath: '/images/seo/core/ai-face-shape-detector-example.webp',
    pagePath: '/face-shape-detector',
    width: 1448,
    height: 1086,
    heading: 'What the AI Face Shape Detector Measures',
    alt: 'AI face shape detector measuring forehead width, cheekbone width, jaw width, and face length',
    body: 'The detector compares four visible proportions: forehead width, cheekbone width, jaw width, and overall face length. Together, these measurements provide a practical estimate of your likely face shape from one clear photo.',
  },
  {
    id: 'VSEO-002',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-002__common-face-shapes-guide.png',
    publicPath: '/images/seo/core/common-face-shapes-guide.webp',
    pagePath: '/face-shape-detector',
    width: 1448,
    height: 1086,
    heading: 'Common Face Shapes',
    alt: 'Guide comparing round, oval, square, heart, diamond, and oblong face shapes',
    body: 'Common face shapes include round, oval, square, heart, diamond, and oblong. The boundaries are visual guidelines rather than fixed labels, so comparing the full set of proportions is more useful than relying on one feature alone.',
    link: {
      href: '/en/what-is-my-face-shape',
      label: 'Learn how to identify your face shape',
    },
  },
  {
    id: 'VSEO-003',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-003__face-shape-photo-analysis-result.png',
    publicPath: '/images/seo/core/face-shape-photo-analysis-result.webp',
    pagePath: '/face-shape-detector',
    width: 1448,
    height: 1086,
    heading: 'What a Face Shape Analysis Result Shows',
    alt: 'Example face shape photo analysis result with facial proportions and a likely face shape',
    body: 'A useful result connects the estimated shape to the measurements behind it. Use the result as a starting point for glasses discovery, then validate frame width, lens depth, bridge position, and overall visual balance.',
    link: {
      href: '/en/what-is-my-face-shape',
      label: 'See how to use your face shape result',
    },
  },
  {
    id: 'VSEO-004',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-004__how-to-identify-your-face-shape.png',
    publicPath: '/images/seo/face-shapes/how-to-identify-your-face-shape.webp',
    pagePath: '/what-is-my-face-shape',
    width: 1448,
    height: 1086,
    heading: 'How to Identify Your Face Shape',
    alt: 'How to identify your face shape by comparing forehead width, cheekbone width, jaw width, and face length',
    body: 'Compare four proportions: forehead width, cheekbone width, jaw width, and overall face length. The relationship between these measurements helps distinguish common face shapes such as oval, round, square, heart, diamond, and oblong.',
    link: {
      href: '/en/face-shape-detector',
      label: 'Try the free face shape detector',
    },
  },
  {
    id: 'VSEO-005',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-005__face-shape-comparison-guide.png',
    publicPath: '/images/seo/face-shapes/face-shape-comparison-guide.webp',
    pagePath: '/what-is-my-face-shape',
    width: 1536,
    height: 1024,
    heading: 'Face Shape Comparison Guide',
    alt: 'Face shape comparison guide showing round, oval, square, heart, diamond, and oblong proportions',
    body: 'Compare the six common face-shape patterns side by side: soft curves, balanced length, a defined jaw, a wider forehead, wider cheekbones, or longer proportions. Real faces can sit between categories, so use the comparison as a directional guide.',
  },
  {
    id: 'VSEO-006',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-006__what-is-my-face-shape-result.png',
    publicPath: '/images/seo/face-shapes/what-is-my-face-shape-result.webp',
    pagePath: '/what-is-my-face-shape',
    width: 1448,
    height: 1086,
    heading: 'What Is My Face Shape? From Result to Next Step',
    alt: 'Example of a face shape result turning photo proportions into practical glasses guidance',
    body: 'Your face-shape result is most useful when it leads to a decision. Start with the likely shape, then explore frame directions and confirm the visual result on your own photo before choosing a pair.',
    link: {
      href: '/en/face-shape-detector',
      label: 'Find your face shape from a photo',
    },
  },
  {
    id: 'VSEO-007',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-007__what-glasses-suit-my-face-guide.png',
    publicPath: '/images/seo/style/what-glasses-suit-my-face-guide.webp',
    pagePath: '/what-glasses-suit-my-face',
    width: 1448,
    height: 1086,
    heading: 'What Glasses Suit an Oval Face?',
    alt: 'Glasses guide for an oval face showing cat-eye, aviator, and soft rectangle frame directions',
    body: 'For an oval face, start with frame directions that respect balanced proportions: an upswept cat-eye, a classic aviator, or a softly defined rectangle can each create a different visual effect. Treat these as directions to test, not universal rules.',
    link: {
      href: '/en/ai-glasses-advisor',
      label: 'Get personalized glasses advice',
    },
  },
  {
    id: 'VSEO-008',
    batch: 'B01',
    sourcePath: 'assets/visual-seo/B01/source/VSEO-008__compare-glasses-for-your-face.png',
    publicPath: '/images/seo/style/compare-glasses-for-your-face.webp',
    pagePath: '/what-glasses-suit-my-face',
    width: 1448,
    height: 1086,
    heading: 'Compare Glasses for Your Face',
    alt: 'Guide comparing different glasses frame directions on a face to show how shape changes the look',
    body: 'The same face can look different with each frame direction. Compare shape, width, lens depth, and bridge placement on your photo so the final choice reflects both face proportions and the look you want.',
    link: {
      href: '/en/compare-glasses-frames',
      label: 'Compare frames on my photo',
    },
  },
] as const satisfies readonly VisualSeoAsset[]

export const B02_VISUAL_SEO_ASSETS = [
  {
    id: 'VSEO-009',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-009__find-glasses-for-your-face-workflow.png',
    publicPath: '/images/seo/core/find-glasses-for-your-face-workflow.webp',
    pagePath: '/what-glasses-suit-my-face',
    width: 1448,
    height: 1086,
    displayWidth: 'secondary',
    bodyPosition: 'before',
    heading: 'How to Find Glasses for Your Face',
    alt: 'Find glasses for your face workflow from face shape detection to frame directions, try-on, and comparison',
    body: 'A useful glasses search moves from understanding your facial proportions to a small set of frame directions, then to visual validation. The goal is a confident shortlist, not a single rule that claims to decide for you.',
    link: {
      href: '/en/find-glasses-for-my-face',
      label: 'Find glasses for my face from a photo',
    },
  },
  {
    id: 'VSEO-010',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-010__find-glasses-for-my-face.png',
    publicPath: '/images/seo/core/find-glasses-for-my-face.webp',
    pagePath: '/find-glasses-for-my-face',
    width: 1448,
    height: 1086,
    displayWidth: 'primary',
    bodyPosition: 'before',
    heading: 'Find Glasses for My Face',
    alt: 'Find glasses for a face by exploring everyday, lift, and structure frame directions',
    body: 'Once you understand the proportions of your face, explore a few visual directions instead of browsing every frame at once. Everyday, lift, and structure are starting points to test against your own features and preferences.',
    link: {
      href: '/en/ai-glasses-advisor',
      label: 'Open the AI Glasses Advisor',
    },
  },
  {
    id: 'VSEO-011',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-011__glasses-frame-shapes-comparison.png',
    publicPath: '/images/seo/decisions/glasses-frame-shapes-comparison.webp',
    pagePath: '/find-glasses-for-my-face',
    width: 1448,
    height: 1086,
    displayWidth: 'compare',
    bodyPosition: 'before',
    heading: 'Compare Glasses Frame Shapes',
    alt: 'Same face comparing rectangle, round, cat-eye, and aviator glasses frame shapes',
    body: 'A side-by-side view makes frame shape differences easier to judge: rectangle adds a more defined outline, round softens the direction, cat-eye lifts the outer line, and aviator changes the overall balance. The right choice still depends on the look you want.',
    link: {
      href: '/en/compare-glasses-frames',
      label: 'Compare frames on your photo',
    },
  },
  {
    id: 'VSEO-012',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-012__try-glasses-before-choosing.png',
    publicPath: '/images/seo/decisions/try-glasses-before-choosing.webp',
    pagePath: '/find-glasses-for-my-face',
    width: 1448,
    height: 1086,
    displayWidth: 'secondary',
    bodyPosition: 'before',
    heading: 'Try Glasses Before Choosing',
    alt: 'Shortlist glasses frame directions, try them on a face photo, and compare the visual results',
    body: 'Shortlisting reduces the search, virtual try-on shows how a chosen direction changes your photo, and comparison helps when two or more options remain close. Each step answers a different part of the decision.',
    link: {
      href: '/en/virtual-glasses-try-on',
      label: 'Try glasses on your photo',
    },
  },
  {
    id: 'VSEO-013',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-013__virtual-glasses-try-on-before-after.png',
    publicPath: '/images/seo/core/virtual-glasses-try-on-before-after.webp',
    pagePath: '/virtual-glasses-try-on',
    width: 1448,
    height: 1086,
    displayWidth: 'primary',
    bodyPosition: 'before',
    heading: 'See What Virtual Try-On Changes',
    alt: 'Before and after showing a face photo with and without glasses in a virtual try-on preview',
    body: 'Virtual try-on places a chosen frame on your own photo so you can judge the overall visual effect before deciding whether it is worth considering further. It is visual evidence, not a promise of physical fit.',
    link: {
      href: '/en/try-glasses-on-photo',
      label: 'Try a frame on your photo',
    },
  },
  {
    id: 'VSEO-014',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-014__virtual-try-on-different-glasses.png',
    publicPath: '/images/seo/decisions/virtual-try-on-different-glasses.webp',
    pagePath: '/virtual-glasses-try-on',
    width: 1448,
    height: 1086,
    displayWidth: 'compare',
    bodyPosition: 'before',
    heading: 'Compare Different Frame Styles',
    alt: 'Virtual try-on comparison of rectangle, cat-eye, and aviator glasses on the same face',
    body: 'Trying several frame directions on the same face makes the differences concrete. Compare outline, visual width, and the character of each style instead of relying on a product image viewed in isolation.',
    link: {
      href: '/en/compare-glasses-frames',
      label: 'Compare different frame styles',
    },
  },
  {
    id: 'VSEO-015',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-015__how-virtual-glasses-try-on-works.png',
    publicPath: '/images/seo/guides/how-virtual-glasses-try-on-works.webp',
    pagePath: '/virtual-glasses-try-on',
    width: 1448,
    height: 1086,
    displayWidth: 'secondary',
    bodyPosition: 'before',
    heading: 'How Virtual Glasses Try-On Works',
    alt: 'Virtual glasses try-on workflow connecting a face photo, a frame image, and a rendered result',
    body: 'Virtual try-on connects your face photo with a selected frame image and returns a rendered preview. The preview helps you assess appearance and proportion before moving to a closer product or fit check.',
    link: {
      href: '/en/virtual-glasses-try-on',
      label: 'Open virtual glasses try-on',
    },
  },
  {
    id: 'VSEO-016',
    batch: 'B02',
    sourcePath: 'assets/visual-seo/B02/source/VSEO-016__try-glasses-on-your-photo.png',
    publicPath: '/images/seo/core/try-glasses-on-your-photo.webp',
    pagePath: '/try-glasses-on-photo',
    width: 1448,
    height: 1086,
    displayWidth: 'primary',
    bodyPosition: 'before',
    heading: 'Try Glasses on Your Photo',
    alt: 'Original face photo transformed into a glasses try-on result',
    body: 'Start with the photo you already know, add a frame image, and inspect the resulting look in the same visual context. This makes a specific pair easier to evaluate before comparing alternatives.',
    link: {
      href: '/en/compare-glasses-frames',
      label: 'Compare the result with other frames',
    },
  },
] as const satisfies readonly VisualSeoAsset[]

export const VISUAL_SEO_ASSETS = [...B01_VISUAL_SEO_ASSETS, ...B02_VISUAL_SEO_ASSETS] as const

export function getVisualSeoAssetsForPage(pagePath: string, batch?: VisualSeoAssetBatch): readonly VisualSeoAsset[] {
  return VISUAL_SEO_ASSETS.filter((asset) => asset.pagePath === pagePath && (!batch || asset.batch === batch))
}
