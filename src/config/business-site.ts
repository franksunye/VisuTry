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
    metaTitle: 'AI Commerce for Eyewear Brands & Agencies | VisuTry',
    metaDescription: 'Turn eyewear catalogs and campaign traffic into guided AI shopping experiences for brand, commerce, and agency teams with recommendation, virtual try-on, comparison, and measurable shopper intent.',
    eyebrow: 'AI Commerce for Eyewear',
    title: 'Turn your eyewear catalog into a personalized AI shopping experience.',
    description: 'Help shoppers narrow the catalog, get recommendations, try frames on, compare finalists, and continue to your product or inquiry flow — while you see which products and journeys create stronger intent.',
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    microcopy: 'Hosted first. Keep your current ecommerce site and product pages.',
    sections: [
      {
        eyebrow: 'From browsing to confident choice',
        title: 'Showing more frames is easy. Helping shoppers decide is harder.',
        body: 'Eyewear shoppers often browse many frames without knowing what to try first. VisuTry combines catalog guidance, recommendation, Try-On, Compare, and merchant intent signals into one decision journey.',
        cards: [
          { title: 'Recommend', description: 'Narrow a merchant catalog into a more relevant shortlist.' },
          { title: 'Try On', description: 'Let shoppers preview selected frames using their own photo.' },
          { title: 'Compare', description: 'Help shoppers review finalists side by side.' },
          { title: 'Continue', description: 'Send high-intent shoppers to the merchant product or inquiry destination.' },
          { title: 'Measure', description: 'See recommendation, Try-On, Compare, and product-interest behavior.' },
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
        eyebrow: 'Commerce Intelligence',
        title: 'See what shoppers actually do before the product click.',
        body: 'Page views alone do not explain whether shoppers found a relevant frame. VisuTry captures decision-stage signals such as recommendation completion, Try-On, Compare, favorite, inquiry, product click, top frames, and source or Experience context where available.',
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
    metaDescription: 'Use one merchant catalog to power Store and Campaign Experiences with recommendation, virtual try-on, comparison, and commerce intelligence.',
    eyebrow: 'VisuTry Platform',
    title: 'One decision layer between eyewear traffic and merchant commerce.',
    description: 'Use one merchant catalog to power Store and Campaign Experiences with recommendation, Virtual Try-On, Compare, intent measurement, and product handoff.',
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    sections: [
      {
        eyebrow: 'Platform model',
        title: 'One catalog. Multiple shopping experiences.',
        body: 'Products belong to the merchant catalog. Store and Campaigns reuse that catalog rather than duplicating product truth. Each Experience can select a different subset of frames and present a different shopper context.',
        steps: ['Merchant catalog', 'Store or Campaign Experience', 'Recommendation', 'Try-On', 'Compare', 'Product handoff', 'Commerce Intelligence'],
      },
      {
        eyebrow: 'Catalog foundation',
        title: 'Start from the merchant’s own frames.',
        body: 'VisuTry is designed around merchant-scoped product identity and reviewed product data. The goal is not to replace catalog management systems, but to make the product data required for guided eyewear decisions usable by Store and Campaign Experiences.',
        note: 'Catalog onboarding is assisted and reviewed in the current Pilot workflow.',
      },
      {
        eyebrow: 'Shared decision runtime',
        title: 'Recommendation, Try-On, and Compare work as one journey.',
        body: 'Recommendation helps narrow the set of frames. Try-On helps visualize selected products. Compare helps shoppers review finalists. Product links or inquiry actions then return the shopper to the merchant’s existing selling flow.',
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
        eyebrow: 'Distribution direction',
        title: 'Built for more than one traffic source.',
        body: 'The same commerce experience model can support traffic from websites, campaigns, social, email, QR, and — as the platform evolves — AI assistants and shopping agents.',
      },
    ],
  },
  store: {
    slug: '/business/store',
    metaTitle: 'AI Storefront for Eyewear Brands & Retailers | VisuTry',
    metaDescription: 'Create a merchant-branded AI storefront with frame recommendation, virtual try-on, comparison, product handoff, and intent signals.',
    eyebrow: 'AI Storefront',
    title: 'Turn your eyewear catalog into an AI-guided storefront.',
    description: 'Give shoppers a merchant-branded path from discovery and recommendation to Try-On, Compare, and your existing product or inquiry destination.',
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
    secondaryCta: { label: 'See Product Examples', href: '/business/examples' },
    sections: [
      {
        eyebrow: 'What the Store does',
        title: 'Help shoppers choose before they leave the experience.',
        cards: [
          { title: 'Merchant branded', description: 'A hosted experience shaped around the merchant identity and catalog.' },
          { title: 'Personalized shortlist', description: 'Guide shoppers toward a smaller set of relevant frames.' },
          { title: 'Virtual Try-On', description: 'Preview selected frames using the shopper’s photo.' },
          { title: 'Frame Compare', description: 'Review finalists side by side before clicking through.' },
          { title: 'Intent signals', description: 'Observe product click, favorite, inquiry, and other enabled decision signals.' },
          { title: 'Commerce handoff', description: 'Return shoppers to your existing product or inquiry destination.' },
        ],
      },
      {
        eyebrow: 'Shopper workflow',
        title: 'A simpler path through a difficult category.',
        steps: ['Enter Store', 'Add shopper context', 'Get shortlist', 'Try selected frames', 'Compare finalists', 'Continue to product or inquiry'],
      },
      {
        eyebrow: 'Beyond VTO',
        title: 'Virtual Try-On shows a frame. VisuTry helps shoppers decide which frame to try.',
        body: 'VisuTry treats Try-On as one step in the decision journey. Recommendation narrows the catalog before Try-On, Compare helps evaluate finalists, and intent signals help the merchant understand which frames generated interest.',
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
    metaDescription: 'Create focused AI shopping experiences for eyewear campaigns, collections, audiences, traffic sources, creator stories, and media briefs while preserving merchant product truth.',
    eyebrow: 'Campaign Experiences',
    title: 'Turn campaign traffic into a focused shopping journey.',
    description: 'Reuse the same merchant catalog to create focused experiences for collections, audiences, sources, style stories, promotions, and shopping intent.',
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
    secondaryCta: { label: 'See a Campaign Example', href: '/c/akila/statement-frames' },
    sections: [
      {
        eyebrow: 'Campaign model',
        title: 'Match the experience to the reason the shopper arrived.',
        steps: ['Search / Social / Email / QR', 'Campaign Experience', 'Focused catalog subset', 'Recommendation', 'Try-On + Compare', 'Product intent'],
      },
      {
        eyebrow: 'One catalog, many contexts',
        title: 'Create a focused edit without creating a new product stack.',
        body: 'Campaigns select from the merchant catalog and add experience-specific context. A Campaign can emphasize a collection, fit problem, style direction, season, source, or audience while reusing the same core recommendation, Try-On, Compare, and measurement runtime.',
        cards: [
          { title: 'Collection launch', description: 'Create a focused experience around a new or strategic collection.' },
          { title: 'Fit-led traffic', description: 'Route shoppers with a clear fit problem into a relevant subset.' },
          { title: 'Style & occasion', description: 'Turn editorial or creator traffic into a shoppable point of view.' },
          { title: 'Paid acquisition', description: 'Give campaign traffic a purpose-built decision path before product click.' },
        ],
      },
      {
        eyebrow: 'Measurement',
        title: 'Compare shopper behavior by Experience.',
        body: 'Campaign context lets merchants review observable signals such as recommendation completion, Try-On, Compare, favorite, inquiry, product click, and source context where available.',
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
    metaDescription: 'Understand recommendation, try-on, comparison, product-interest, source, and Experience-level shopper behavior.',
    eyebrow: 'Commerce Intelligence',
    title: 'See the decision signals that happen before purchase.',
    description: 'Understand which products and shopper journeys create stronger observable intent across recommendation, Try-On, Compare, favorite, inquiry, and product click behavior.',
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore the Platform', href: '/business/platform' },
    sections: [
      {
        eyebrow: 'What you can observe',
        title: 'Measure the decision path, not only the page view.',
        cards: [
          { title: 'Sessions & engagement', description: 'Understand activity at the merchant and Experience level.' },
          { title: 'Recommendation', description: 'See whether shoppers complete the narrowing step.' },
          { title: 'Try-On & Compare', description: 'Observe which frames move deeper into evaluation.' },
          { title: 'Favorites & inquiries', description: 'Capture enabled signals that indicate stronger consideration.' },
          { title: 'Product clicks', description: 'See when shoppers continue to merchant product destinations.' },
          { title: 'Source context', description: 'Review source or Campaign context where it is available.' },
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
        title: 'Understand which shopper journeys create stronger signals.',
        body: 'Because Store and Campaigns are first-class Experiences, merchants can review behavior in the context of the shopper journey that generated it rather than treating all traffic as one undifferentiated pool.',
      },
    ],
  },
  pricing: {
    slug: '/business/pricing',
    metaTitle: 'VisuTry Business Pricing | Founding Merchant Pilot',
    metaDescription: 'Start a 30-day VisuTry Founding Merchant Pilot for $149 with a reviewed frame catalog, hosted Store or Campaign Experience, and assisted setup.',
    eyebrow: 'Founding Merchant Pilot',
    title: 'A focused 30-day Pilot before a larger commitment.',
    description: 'Use your real frames, launch one hosted Store or Campaign Experience, and review shopper behavior before deciding how to continue.',
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
    secondaryCta: { label: 'See Examples', href: '/business/examples' },
    sections: [
      {
        eyebrow: 'Current market-capture offer',
        title: '$149 / 30 days',
        body: 'The Founding Merchant Pilot is the approved current external offer. It is a market-capture pricing version, not permanent lifetime pricing.',
        cards: [
          { title: '8–50 reviewed frames', description: 'Start with a focused merchant catalog. 8–20 representative frames is often a practical first test.' },
          { title: '1 hosted Experience', description: 'Launch one Store or Campaign Experience using your catalog.' },
          { title: 'Up to 1,500 AI-assisted shoppers', description: 'AI Commerce Sessions measured at the decision boundary rather than ordinary page views.' },
          { title: 'Up to 3,500 Standard Try-Ons', description: 'Successful Standard Try-On generations included in the Pilot capacity.' },
          { title: 'Recommendation + Compare', description: 'Personalized frame guidance and multi-frame decision support.' },
          { title: 'Assisted setup + weekly review', description: 'VisuTry helps review the catalog, launch the Experience, and review observed behavior.' },
        ],
      },
      {
        eyebrow: 'Commercial boundary',
        title: 'Simple now. Flexible after the Pilot.',
        body: 'Future recurring plans are not yet published as a locked external price card. Continuation is discussed based on real merchant usage, campaigns, integrations, support needs, and the pricing version in effect at that time.',
        note: 'No lifetime price promise. No surprise Pilot overage charge. No revenue or conversion guarantee.',
      },
    ],
  },
  examples: {
    slug: '/business/examples',
    metaTitle: 'VisuTry Store & Campaign Examples for Eyewear',
    metaDescription: 'Explore VisuTry Store product previews and clearly labeled Campaign Reference Experiences across eyewear merchant archetypes.',
    eyebrow: 'Product Proof',
    title: 'See the same commerce workflow across different eyewear problems.',
    description: 'Use product previews and clearly labeled Reference Experiences to evaluate the shopper journey, not to infer customer relationships or performance claims.',
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
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
    primaryCta: { label: 'Start a Pilot', href: pilotHref },
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
        body: 'The current Founding Merchant Pilot includes 8–50 reviewed frames, one hosted Store or Campaign Experience, personalized recommendation, Standard Try-On, Frame Compare, enabled product-intent signals, up to 1,500 AI-assisted shoppers, up to 3,500 Standard Try-On generations, assisted setup, and a weekly review.',
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
