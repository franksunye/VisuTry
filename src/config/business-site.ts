export type BusinessPageKey =
  | 'overview'
  | 'platform'
  | 'store'
  | 'campaigns'
  | 'intelligence'
  | 'pricing'
  | 'examples'
  | 'integrations'
  | 'pilot'

export type BusinessCard = {
  title: string
  description: string
  href?: string
  label?: string
}

export type BusinessSection = {
  eyebrow?: string
  title: string
  body?: string
  cards?: BusinessCard[]
  steps?: string[]
  visual?: {
    src: string
    alt: string
    caption?: string
  }
  note?: string
}

export type BusinessPageDefinition = {
  slug: string
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  microcopy?: string
  heroImage?: { src: string; alt: string }
  sections: BusinessSection[]
}

export const businessNav = [
  { label: 'Platform', href: '/business/platform' },
  { label: 'Store', href: '/business/store' },
  { label: 'Campaigns', href: '/business/campaigns' },
  { label: 'Commerce Intelligence', href: '/business/commerce-intelligence' },
  { label: 'Pricing', href: '/business/pricing' },
  { label: 'Examples', href: '/business/examples' },
] as const

const pilotHref = '/business/pilot'

export const businessPages: Record<BusinessPageKey, BusinessPageDefinition> = {
  overview: {
    slug: '/business',
    metaTitle: 'AI Commerce for Eyear Brands & Agencies | VisuTry',
    metaDescription: 'Turn eyewear catalogs and traffic into guided AI decision experiences that move shoppers from discovery to decision to merchant action, with observable intent signals along the way.',
    eyebrow: 'AI Commerce for Eyewear',
    title: 'Be discovered. Help shoppers decide. Turn intent into action.',
    description: 'VisuTry helps eyewear merchants become more discoverable across search and AI, then guides shoppers from product discovery to confident decisions and configured merchant actions — while Commerce Intelligence measures the intent signals in between.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    microcopy: 'Hosted first. Keep your current ecommerce site and product pages.',
    sections: [
      {
        eyebrow: 'Discovery → Decision → Merchant Action',
        title: 'Showing more frames is easy. Helping shoppers move from discovery to action is harder.',
        body: 'VisuTry combines guided discovery, Recommendation, Virtual Try-On, Frame Compare, a reusable Decision Result, and configured Merchant Actions into one eyewear decision journey.',
        cards: [
          { title: 'Discover / Recommend', description: 'Turn a broad merchant catalog into a more relevant shortlist for the shopper.' },
          { title: 'Try-On & Compare', description: 'Help shoppers visualize selected frames and evaluate finalists side by side.' },
          { title: 'Decision Result', description: 'Keep the useful outcome of the journey available beyond the active session.' },
          { title: 'Merchant Actions', description: 'Continue to product, appointment, store visit, inquiry, or another configured merchant destination.' },
        ],
      },
      {
        eyebrow: 'One catalog, multiple journeys',
        title: 'Store for continuity. Campaigns for focus.',
        body: 'Use one reviewed merchant catalog across an always-on Store and focused Campaign Experiences without duplicating product truth.',
        cards: [
          { title: 'Store', description: 'A persistent, merchant-branded shopping experience for broader catalog discovery.', href: '/business/store', label: 'Explore Store' },
          { title: 'Campaigns', description: 'Focused experiences for collections, audiences, sources, style stories, or shopping intent.', href: '/business/campaigns', label: 'Explore Campaigns' },
        ],
      },
      {
        eyebrow: 'Merchant operating model',
        title: 'One workspace to operate Store, Campaigns, and the signals around them.',
        body: 'Operate Store, Campaigns, setup status, and available shopper-intent signals from one merchant workspace instead of stitching together disconnected operating tools.',
      },
      {
        eyebrow: 'Commerce Intelligence',
        title: 'Measure what happens between discovery and action.',
        body: 'Page views alone do not explain whether shoppers found a relevant frame or moved closer to action. VisuTry captures observable decision-stage signals such as Recommendation completion, Try-On, Compare, favorite, inquiry, product click, and source or Experience context where available.',
      },
      {
        eyebrow: 'Hosted first',
        title: 'Add a decision layer without rebuilding your ecommerce stack.',
        body: 'Your existing website, product pages, and checkout remain the commerce source of truth. VisuTry starts as a hosted shopping experience that can sit between selected traffic and your current destination.',
        cards: [
          { title: 'Paid & social traffic', description: 'Route high-intent campaign visitors into a focused shopping journey.' },
          { title: 'Email & creator links', description: 'Give campaign traffic a clearer path than a generic catalog grid.' },
          { title: 'QR & pre-shop', description: 'Support in-store, appointment, or pre-visit discovery without replacing commerce.' },
        ],
      },
      {
        eyebrow: 'Founding Merchant Pilot',
        title: 'Start with a real frame set and a 30-day Pilot.',
        body: 'We start with 8–50 reviewed frames, set up one hosted Store or Campaign Experience, and review shopper behavior with you before you decide how to continue.',
        cards: [
          { title: '$149 / 30 days', description: 'Assisted setup, up to 1,500 AI-assisted shoppers, and up to 3,500 Standard Try-On generations.', href: '/business/pricing', label: 'View Pricing' },
        ],
      },
    ],
  },
  platform: {
    slug: '/business/platform',
    metaTitle: 'VisuTry AI Commerce Platform for Eyewear',
    metaDescription: 'Use one merchant catalog to power Store and Campaign Experiences that guide shoppers from discovery through Decision Result and Merchant Actions, with Commerce Intelligence across the journey.',
    eyebrow: 'VisuTry Platform',
    title: 'One decision layer from product discovery to merchant action.',
    description: 'Use one merchant catalog to power Store and Campaign Experiences that guide shoppers through discovery, Recommendation, Virtual Try-On, Frame Compare, Decision Result, and Merchant Actions — with Commerce Intelligence across the journey.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    sections: [
      {
        eyebrow: 'Platform model',
        title: 'One catalog. Multiple decision experiences.',
        body: 'Products belong to the merchant catalog. Store and Campaigns reuse that catalog rather than duplicating product truth. Each Experience can select a different subset of frames and present a different shopper context.',
        steps: ['Merchant catalog', 'Store or Campaign Experience', 'Discovery & Recommendation', 'Virtual Try-On + Compare', 'Decision Result', 'Merchant Actions', 'Commerce Intelligence'],
      },
      {
        eyebrow: 'Catalog foundation',
        title: 'Start from the merchant’s own frames.',
        body: 'Start with your own reviewed frame data. VisuTry does not replace your catalog or commerce system; it uses the product information needed to power guided Store and Campaign experiences.',
        note: 'Catalog onboarding is assisted and reviewed in the current Pilot workflow.',
      },
      {
        eyebrow: 'Shared decision runtime',
        title: 'Recommendation, Try-On, Compare, Decision Result, and Merchant Actions work as one journey.',
        body: 'Recommendation helps narrow the set of frames. Virtual Try-On helps shoppers visualize selected products. Frame Compare helps evaluate finalists. Decision Result carries the useful outcome forward, and configured Merchant Actions continue the shopper into the merchant’s existing selling flow.',
      },
      {
        eyebrow: 'Experience model',
        title: 'Store and Campaigns are sibling experiences.',
        body: 'A merchant can run only a Store, only Campaigns, or both. Campaigns are not children of Store and do not require a Store to exist first.',
        cards: [
          { title: 'Store', description: 'Persistent, broader catalog experience.', href: '/business/store', label: 'Explore Store' },
          { title: 'Campaigns', description: 'Focused experiences for a specific audience, collection, source, or intent.', href: '/business/campaigns', label: 'Explore Campaigns' },
          { title: 'Commerce Intelligence', description: 'Experience-level engagement and purchase-intent signals.', href: '/business/commerce-intelligence', label: 'Explore Commerce Intelligence' },
        ],
      },
      {
        eyebrow: 'Merchant workspace',
        title: 'The operating surface behind the Experiences.',
        body: 'Manage setup status, Store, Campaigns, and merchant operations from one workspace that connects the operating layer to shopper-facing Experiences.',
      },
      {
        eyebrow: 'Distribution direction',
        title: 'Built for more than one traffic source.',
        body: 'The same commerce experience model can support traffic from websites, campaigns, social, email, and QR today, while additional approved distribution channels can be added as the platform evolves.',
      },
    ],
  },
  store: {
    slug: '/business/store',
    metaTitle: 'AI Storefront for Eyewear Brands & Retailers | VisuTry',
    metaDescription: 'Create a merchant-branded AI storefront that guides shoppers from discovery through Recommendation, Virtual Try-On, Frame Compare, Decision Result, and Merchant Actions.',
    eyebrow: 'AI Storefront',
    title: 'Turn your eyewear catalog into an always-on AI decision storefront.',
    description: 'Give shoppers a merchant-branded path from discovery to decision to action, using Recommendation, Virtual Try-On, Frame Compare, Decision Result, and configured Merchant Actions.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'See Product Examples', href: '/business/examples' },
    sections: [
      {
        eyebrow: 'What the Store does',
        title: 'Four jobs matter: guide, evaluate, carry the result, continue.',
        cards: [
          { title: 'Guide discovery', description: 'Merchant branding, reviewed frame data, and a relevant shortlist help shoppers move beyond an undifferentiated catalog grid.' },
          { title: 'Help shoppers evaluate', description: 'Recommendation, Virtual Try-On, and Frame Compare support the decision before a shopper leaves the experience.' },
          { title: 'Carry the result', description: 'Decision Result keeps the useful outcome of the journey available beyond the active session, including secure phone continuation.' },
          { title: 'Continue to action', description: 'Configured Merchant Actions connect the decision journey to product, appointment, store visit, inquiry, or another supported merchant destination.' },
        ],
      },
      {
        eyebrow: 'Shopper workflow',
        title: 'A simpler path through a difficult category.',
        steps: ['Enter Store', 'Discover & understand', 'Get shortlist', 'Try & compare', 'Decision Result', 'Continue to merchant action'],
      },
      {
        eyebrow: 'Beyond VTO',
        title: 'Virtual Try-On shows a frame. VisuTry helps shoppers decide what to try — and what to do next.',
        body: 'VisuTry treats Virtual Try-On as one step in the decision journey. Recommendation narrows the catalog, Frame Compare helps evaluate finalists, Decision Result preserves the useful outcome, and Merchant Actions continue the shopper into commerce.',
      },
      {
        eyebrow: 'Store product preview',
        title: 'See how the hosted Store experience is designed to work.',
        body: 'This product preview shows the persistent Store format and shopper decision journey without presenting an unverified merchant deployment as live proof.',
      },
    ],
  },
  campaigns: {
    slug: '/business/campaigns',
    metaTitle: 'AI Shopping Campaigns for Eyewear Brands & Agencies | VisuTry',
    metaDescription: 'Create focused AI shopping experiences that move campaign traffic from discovery to decision to Merchant Actions while preserving merchant product truth and measuring observable intent.',
    eyebrow: 'Campaign Experiences',
    title: 'Turn campaign traffic into a focused decision journey.',
    description: 'Create intent-specific commerce experiences for search, paid media, social, email, and QR — moving shoppers from discovery to decision to Merchant Actions while keeping the campaign context intact.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'See a Campaign Example', href: '/c/akila/statement-frames' },
    sections: [
      {
        eyebrow: 'For brand & agency teams',
        title: 'Translate a campaign idea into a focused commerce experience.',
        body: 'Use the same reviewed product truth while adapting the shopper journey to a collection, audience, source, creator story, or media brief. Brand teams keep product and identity control; agency teams get a clearer experience layer between media traffic and merchant commerce.',
        cards: [
          { title: 'Brief-to-experience', description: 'Turn a campaign proposition or collection story into a focused shopper journey without inventing a separate product stack.' },
          { title: 'Channel continuity', description: 'Carry paid, social, creator, email, or QR traffic into an experience that reflects why the shopper arrived.' },
          { title: 'Brand control', description: 'Reuse reviewed merchant product truth and brand context rather than building disconnected campaign microsites.' },
          { title: 'Observable intent', description: 'Review Recommendation, Virtual Try-On, Frame Compare, product-interest, and source context where available.' },
        ],
      },
      {
        eyebrow: 'Product journey',
        title: 'The campaign itself becomes a focused commerce experience.',
        body: 'Carry focused frame discovery into a guided decision, Decision Result, and configured Merchant Actions so the shopper journey stays aligned with campaign context from arrival through the next commerce action.',
      },
      {
        eyebrow: 'Measurement',
        title: 'Measure decision signals by Experience.',
        body: 'Campaign context lets merchants review observable signals such as Recommendation completion, Try-On, Compare, favorite, inquiry, product click, and source context where available.',
      },
      {
        eyebrow: 'Reference Experience',
        title: 'See how a collection-led Campaign can work.',
        body: 'AKILA · Statement Frames is a Reference Experience assembled from public catalog information. It demonstrates product capability and does not imply a customer or partner relationship.',
        cards: [
          { title: 'AKILA · Statement Frames', description: 'Reference Pilot / Simulation for style-led campaign merchandising.', href: '/c/akila/statement-frames', label: 'Open Reference Campaign' },
        ],
        note: 'Reference Experience · Not a customer case study or performance claim.',
      },
    ],
  },
  intelligence: {
    slug: '/business/commerce-intelligence',
    metaTitle: 'Commerce Intelligence for Eyewear Shopping | VisuTry',
    metaDescription: 'Understand observable decision signals across Recommendation, Virtual Try-On, Frame Compare, product interest, Merchant Actions, source, and Experience context.',
    eyebrow: 'Commerce Intelligence',
    title: 'See the signals between discovery and merchant action.',
    description: 'Understand how shoppers move through Recommendation, Virtual Try-On, Frame Compare, product interest, and configured Merchant Actions — without treating intent as guaranteed revenue.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore the Platform', href: '/business/platform' },
    sections: [
      {
        eyebrow: 'What you can observe',
        title: 'Measure the decision path, not only the page view.',
        cards: [
          { title: 'Recommendation', description: 'See whether shoppers complete the narrowing step and move into a more relevant set of frames.' },
          { title: 'Try-On & Compare', description: 'Observe which frames move deeper into visual evaluation and finalist comparison.' },
          { title: 'Product interest', description: 'Capture enabled favorite, inquiry, and other consideration signals around individual products.' },
          { title: 'Merchant Actions & source context', description: 'See when shoppers continue to merchant destinations and review source or Campaign context where available.' },
        ],
      },
      {
        eyebrow: 'Evidence boundary',
        title: 'Intent is useful evidence. It is not a revenue guarantee.',
        body: 'The current Commerce Intelligence layer focuses on observable engagement and purchase-intent behavior. Revenue attribution requires commerce or order-data integration, and incremental revenue claims require credible experiment design.',
        note: 'No guaranteed conversion uplift, revenue lift, or incremental GMV claims.',
      },
      {
        eyebrow: 'Experience comparison',
        title: 'Compare which shopper journeys create stronger observable signals.',
        body: 'Because Store and Campaigns are first-class Experiences, merchants can review behavior in the context of the shopper journey that generated it rather than treating all traffic as one undifferentiated pool.',
      },
    ],
  },
  pricing: {
    slug: '/business/pricing',
    metaTitle: 'VisuTry Eyewear AI Commerce Pricing | Free, Pilot & Merchant Plans',
    metaDescription: 'Simple pricing for the full eyewear decision journey. Compare Free, the $149 Founding Pilot, Launch, Growth, Scale, and Enterprise by AI Commerce Sessions, Campaigns, analytics, and delivery capabilities.',
    eyebrow: 'Pricing',
    title: 'Simple pricing for the full eyewear decision journey.',
    description: 'One AI Commerce Session covers a shopper’s Recommendation, Try-On, and Compare journey — so you scale with meaningful shopper decisions, not individual renders.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    sections: [],
  },
  examples: {
    slug: '/business/examples',
    metaTitle: 'VisuTry Store & Campaign Examples for Eyewear',
    metaDescription: 'Explore VisuTry Store product previews and clearly labeled Campaign Reference Experiences across eyewear merchant archetypes.',
    eyebrow: 'Product Proof',
    title: 'See the same commerce workflow across different eyewear problems.',
    description: 'Use product previews and clearly labeled Reference Experiences to evaluate the shopper journey, not to infer customer relationships or performance claims.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    sections: [
      {
        eyebrow: 'Store product preview',
        title: 'A persistent Store experience.',
        body: 'Use the Store product preview to evaluate the always-on shopper journey without implying a customer or partner deployment.',
      },
      {
        eyebrow: 'Reference Portfolio',
        title: 'Five archetypes. One shared runtime.',
        body: 'These Reference Experiences are product demonstrations assembled from public catalog information. They are not customer success stories, partner implementations, or merchant performance evidence.',
        cards: [
          { title: 'ello sunglasses', description: 'Fit / problem-led DTC discovery.', href: '/c/ello-sunglasses/petite-fit', label: 'View Reference' },
          { title: 'Lowercase NYC', description: 'Premium independent product discovery.', href: '/c/lowercase-nyc/find-your-frame', label: 'View Reference' },
          { title: 'AKILA', description: 'Style-led campaign merchandising.', href: '/c/akila/statement-frames', label: 'View Reference' },
          { title: 'Article One', description: 'Technical / active merchandising beside VTO.', href: '/c/article-one/active-eyewear', label: 'View Reference' },
          { title: 'Framed EWE', description: 'Multi-brand retailer discovery.', href: '/c/framed-ewe/find-your-frames', label: 'View Reference' },
        ],
        note: 'Reference Pilot / Simulation · Public-source catalog information · No customer or partner relationship implied.',
      },
    ],
  },
  integrations: {
    slug: '/business/integrations',
    metaTitle: 'VisuTry Business Integrations & Deployment',
    metaDescription: 'Start hosted-first with your existing ecommerce product pages and expand integrations as the merchant relationship and product needs mature.',
    eyebrow: 'Integrations & Deployment',
    title: 'Start hosted-first. Keep your existing commerce stack.',
    description: 'VisuTry is designed to add a guided decision layer around existing merchant commerce rather than require a platform replacement.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore the Platform', href: '/business/platform' },
    sections: [
      {
        eyebrow: 'Current Pilot path',
        title: 'A practical launch with reviewed product data.',
        steps: ['Catalog review', 'Merchant identity', 'Store or Campaign setup', 'Hosted launch', 'Product handoff', 'Intent review'],
      },
      {
        eyebrow: 'Commerce handoff',
        title: 'Your product pages and checkout remain the source of truth.',
        body: 'The hosted Pilot sends shoppers back to the merchant product or inquiry destination. It does not require replacing Shopify, BigCommerce, or the merchant’s existing site.',
      },
      {
        eyebrow: 'Platform direction',
        title: 'Deeper integrations can follow proven value.',
        body: 'Commerce sync, API access, partner distribution, and AI-assistant or agent traffic are platform directions that should only be marketed as current capabilities when the specific integration is shipped and approved.',
        note: 'Do not interpret this page as a promise that Shopify sync or autonomous checkout is currently GA.',
      },
    ],
  },
  pilot: {
    slug: '/business/pilot',
    metaTitle: 'Start a VisuTry Founding Merchant Pilot',
    metaDescription: 'Launch a 30-day $149 VisuTry Pilot with 8–50 reviewed frames, one hosted Store or Campaign Experience, and assisted setup.',
    eyebrow: 'Founding Merchant Pilot',
    title: 'Test VisuTry with your real eyewear catalog.',
    description: 'Start with a focused frame set, one hosted Store or Campaign Experience, and a 30-day review cycle before making a larger commitment.',
    primaryCta: { label: 'Request Pilot Review', href: '#pilot-request' },
    secondaryCta: { label: 'View Pricing', href: '/business/pricing' },
    microcopy: 'We review fit, catalog scope, and launch timing before confirming the Pilot.',
    sections: [
      {
        eyebrow: 'What to send',
        title: 'A small amount of context is enough to start.',
        cards: [
          { title: 'Business', description: 'Brand or store name, website, and primary contact.' },
          { title: 'Catalog', description: 'Approximate frame count and the collection or products you want to test.' },
          { title: 'Traffic', description: 'Where you expect to send shoppers from first: website, paid media, email, social, QR, or another source.' },
          { title: 'Goal', description: 'The decision problem you want to improve: discovery, recommendation, Try-On, comparison, or product intent.' },
        ],
      },
      {
        eyebrow: 'Pilot scope',
        title: '$149 / 30 days with assisted setup.',
        body: 'The current Founding Merchant Pilot includes 8–50 reviewed frames, one hosted Store or Campaign Experience, guided recommendation, Standard Try-On, Frame Compare, Decision Result / continuation, configured Merchant Handoff, enabled intent signals, up to 1,500 AI-assisted shoppers, up to 3,500 Standard Try-On generations, assisted setup, and a weekly review. Kiosk-ready delivery can be configured when the Pilot use case requires it.',
      },
      {
        eyebrow: 'What happens next',
        title: 'Review → configure → launch → learn.',
        steps: ['Review your catalog', 'Choose Store or Campaign', 'Configure the Experience', 'Launch hosted route', 'Review observed intent', 'Decide how to continue'],
      },
    ],
  },
}

export function businessHref(locale: string, href: string): string {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return href
  return `/${locale}${href}`
}
