export type VisualSeoAssetId = `VSEO-${string}`

export type VisualSeoAsset = {
  id: VisualSeoAssetId
  sourcePath: string
  publicPath: string
  pagePath: string
  width: number
  height: number
  heading: string
  alt: string
  body: string
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

export function getVisualSeoAssetsForPage(pagePath: string): readonly VisualSeoAsset[] {
  return B01_VISUAL_SEO_ASSETS.filter((asset) => asset.pagePath === pagePath)
}
