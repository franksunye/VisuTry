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
    description: 'A short walkthrough of the working shopper experience from Face Analysis and recommendations through Virtual Try-On, Compare, Decision Result, and mobile continuation.',
    url: `${mediaBaseUrl}/demos/visutry-instore-retail-product-demo-v2.mp4`,
    version: 'v2',
    formatLabel: 'Product demo video',
    poster: '/images/business/b2b-vis-03-store-experience-main.png',
  }),
})

export const inStoreRetailWhitepaper = businessResources['instore-retail-whitepaper-v1.3']
export const inStoreRetailDemo = businessResources['instore-retail-demo-v2']
