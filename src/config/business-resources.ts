export type BusinessResourceId = 'instore-retail-whitepaper-v1.3' | 'instore-retail-demo-v2'

export type BusinessResource = {
  id: BusinessResourceId
  type: 'whitepaper' | 'video'
  title: string
  description: string
  url: string
  version: string
  formatLabel: string
  poster?: string
}

const mediaBaseUrl = 'https://media.visutry.com/business'

export const businessResources: Readonly<Record<BusinessResourceId, BusinessResource>> = Object.freeze({
  'instore-retail-whitepaper-v1.3': Object.freeze({
    id: 'instore-retail-whitepaper-v1.3',
    type: 'whitepaper',
    title: 'AI Eyewear Decision Experience for In-Store Retail',
    description: 'An eight-page product and deployment overview covering the guided decision journey, shared-device retail, continuity, deployment, and pilot-to-rollout.',
    url: `${mediaBaseUrl}/whitepapers/visutry-ai-eyewear-decision-experience-instore-retail-v1.3.pdf`,
    version: 'v1.3',
    formatLabel: '8-page PDF',
  }),
  'instore-retail-demo-v2': Object.freeze({
    id: 'instore-retail-demo-v2',
    type: 'video',
    title: 'VisuTry In-Store Retail Product Demo',
    description: 'A short walkthrough of the current working VisuTry in-store retail product and shopper experience.',
    url: `${mediaBaseUrl}/demos/visutry-instore-retail-product-demo-v2.mp4`,
    version: 'v2',
    formatLabel: 'Product demo video',
    poster: '/images/business/b2b-vis-03-store-experience-main.png',
  }),
})

export const inStoreRetailWhitepaper = businessResources['instore-retail-whitepaper-v1.3']
export const inStoreRetailDemo = businessResources['instore-retail-demo-v2']

export const eyewearFaceShapeGuide = {
  path: '/business/resources/show-eyewear-on-different-face-shapes',
  title: 'How can eyewear brands show the same frames on different face shapes?',
  description: 'Learn how to use one catalog frame for shopper photo try-on, what to compare across faces, and when a shoot with models is a better choice.',
} as const

export const inventoryCatalogGuide = {
  path: '/business/resources/turn-frame-inventory-into-online-catalog',
  title: 'How to turn an optical store’s frame inventory into an online catalog',
  description: 'Turn a frame inventory spreadsheet and product photos into a shoppable catalog with a sample CSV, live product records, and a storefront you can browse.',
} as const

export const preVisitFrameGalleryGuide = {
  path: '/business/resources/online-frame-gallery-for-optical-stores',
  title: 'How to let patients browse your optical store’s frames before a visit',
  description: 'Set up a pre-visit frame gallery for your optical shop, share it with patients, and use model names and product links to prepare for an in-store fitting.',
} as const

export const buyerSoftwareGuide = {
  path: '/business/resources/how-to-choose-eyewear-virtual-try-on-software',
  title: 'How to choose virtual try-on software for an eyewear store',
  description: 'Compare photo and live AR previews, hosted and embedded delivery, frame asset requirements, and pricing using the same two frames.',
} as const

export const ipadComparisonGuide = {
  path: '/business/resources/ipad-frame-comparison-for-optical-stores',
  title: 'How to compare eyeglass frames on an iPad in an optical store',
  description: 'Walk through an in-store frame comparison with a shared tablet, from choosing the frames to ending the shopper’s session.',
} as const

export const takeHomeShortlistGuide = {
  path: '/business/resources/share-eyewear-shortlist-after-store-visit',
  title: 'How to share an eyewear shortlist after a store visit',
  description: 'Help a shopper leave with the exact frames they liked and reopen their shortlist on their own phone.',
} as const

export const shoppableLookbookGuide = {
  path: '/business/resources/shoppable-lookbook-for-eyewear-brands',
  title: 'How to make a shoppable lookbook for an eyewear collection',
  description: 'Select a collection, pair each look with its frame and color, and test the path from a lookbook to the product page.',
} as const

export const framePhotoGuide = {
  path: '/business/resources/how-to-photograph-frames-for-virtual-try-on',
  title: 'How to photograph eyeglass frames for photo try-on',
  description: 'Check framing, background and colorway against visual examples before adding a product photo to your try-on catalog.',
} as const

export const businessGuides = [
  inventoryCatalogGuide, framePhotoGuide, eyewearFaceShapeGuide, shoppableLookbookGuide,
  preVisitFrameGalleryGuide, ipadComparisonGuide, takeHomeShortlistGuide, buyerSoftwareGuide,
] as const
