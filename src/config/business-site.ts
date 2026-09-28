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
    metaDescription: 'Turn eyewear catalogs and traffic into guided AI decision experiences that move shoppers from discovery to decision to merchant action, with observable intent signals along the way.',
    eyebrow: 'AI Commerce for Eyewear',
    title: 'Be discovered. Help shoppers decide. Turn intent into action.',
    description: 'VisuTry helps eyewear merchants become more discoverable across search and AI, then gives shoppers a clearer path from product discovery to confident decisions and merchant action.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    microcopy: 'Hosted first. Keep your current ecommerce site and product pages.',
    sections: [
      {
        eyebrow: 'Why VisuTry',
        title: 'Eyewear discovery is abundant. Decision confidence is scarce.',
        body: 'VisuTry adds a decision layer between product discovery and merchant commerce so shoppers can narrow choices, evaluate frames, keep a useful result, and continue when they are ready.',
        cards: [
          { title: 'Discover', description: 'Help shoppers move from a broad catalog toward a relevant set of frames.' },
          { title: 'Decide', description: 'Support evaluation with Recommendation, Virtual Try-On, and Frame Compare.' },
          { title: 'Continue', description: 'Carry the useful Decision Result into configured Merchant Actions.' },
        ],
      },
      {
        eyebrow: 'Product surfaces',
        title: 'Store for continuity. Campaigns for focus.',
        body: 'Use the same reviewed merchant catalog in two distinct shopper-facing formats: an always-on Store for broader discovery and focused Campaign Experiences for specific traffic, collections, or intent.',
        cards: [
          { title: 'Store', description: 'Persistent, merchant-branded discovery for shoppers who need room to explore.', href: '/business/store', label: 'Explore Store' },
          { title: 'Campaigns', description: 'Focused decision experiences shaped around why a shopper arrived.', href: '/business/campaigns', label: 'Explore Campaigns' },
        ],
      },
      {
        eyebrow: 'Merchant operating model',
        title: 'One workspace to operate the experiences around your catalog.',
        body: 'Keep merchant setup, Store, Campaigns, and operating status in one workspace rather than managing separate point solutions for each shopper experience.',
      },
      {
        eyebrow: 'Commerce Intelligence',
        title: 'Know whether the journey is creating meaningful intent.',
        body: 'Commerce Intelligence turns observable shopper behavior into evidence about what is being recommended, evaluated, compared, and continued toward merchant destinations — without claiming revenue that is not directly measured.',
        cards: [
          { title: 'Observable decision signals', description: 'Review shopper behavior in the context of product, Experience, and source where available.', href: '/business/commerce-intelligence', label: 'Explore Commerce Intelligence' },
        ],
      },
      {
        eyebrow: 'Founding Merchant Pilot',
        title: 'Start with real frames before making a larger commitment.',
        body: 'Use a focused 30-day Pilot to validate fit, shopper behavior, and operating workflow with your own catalog. Pricing and included capacity are defined on the Pricing page.',
        cards: [
          { title: '$149 / 30 days', description: 'Assisted setup with one hosted Store or Campaign Experience.', href: '/business/pricing', label: 'View Pricing' },
        ],
      },
    ],
  },
  platform: {
    slug: '/business/platform',
    metaTitle: 'VisuTry AI Commerce Platform for Eyewear',
    metaDescription: 'See how VisuTry connects merchant catalog data, Store and Campaign Experiences, a shared decision runtime, Merchant Workspace, and Commerce Intelligence.',
    eyebrow: 'VisuTry Platform',
    title: 'The system behind every VisuTry decision experience.',
    description: 'VisuTry connects merchant product truth, shopper-facing Experiences, a shared decision runtime, merchant operations, and Commerce Intelligence without replacing the merchant’s core commerce stack.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    sections: [
      {
        eyebrow: 'Platform architecture',
        title: 'One catalog foundation. Shared capabilities. Multiple Experiences.',
        body: 'The platform separates merchant product truth from how it is presented. Store and Campaigns reuse the same catalog foundation and decision capabilities while preserving their own shopper context.',
        steps: ['Merchant catalog', 'Experience configuration', 'Shared decision runtime', 'Decision Result + Merchant Actions', 'Commerce Intelligence'],
      },
      {
        eyebrow: 'Catalog foundation',
        title: 'Keep product truth merchant-scoped and reusable.',
        body: 'VisuTry uses reviewed frame data to power shopper-facing Experiences without trying to become the merchant’s primary catalog or commerce system.',
        note: 'Catalog onboarding is assisted and reviewed in the current Pilot workflow.',
      },
      {
        eyebrow: 'Shared decision runtime',
        title: 'Build the decision capabilities once, reuse them across Experiences.',
        body: 'Recommendation, Virtual Try-On, Frame Compare, Decision Result, and Merchant Actions form a shared runtime. Store and Campaigns can use that runtime differently without creating separate feature stacks.',
      },
      {
        eyebrow: 'Experience model',
        title: 'Store and Campaigns are sibling experiences, not a hierarchy.',
        body: 'A merchant can run only a Store, only Campaigns, or both. Each Experience has its own context and product selection while remaining connected to the same merchant foundation.',
        cards: [
          { title: 'Store', description: 'Persistent, broader catalog experience.', href: '/business/store', label: 'Explore Store' },
          { title: 'Campaigns', description: 'Focused experience for a specific audience, source, collection, or intent.', href: '/business/campaigns', label: 'Explore Campaigns' },
          { title: 'Commerce Intelligence', description: 'Evidence layer across product, Experience, action, and available source context.', href: '/business/commerce-intelligence', label: 'Explore Commerce Intelligence' },
        ],
      },
      {
        eyebrow: 'Merchant Workspace',
        title: 'Operate the system from one merchant-facing control surface.',
        body: 'Merchant Workspace connects setup status, Store, Campaigns, and merchant operations to the shopper-facing Experiences without exposing internal platform complexity.',
      },
    ],
  },
  store: {
    slug: '/business/store',
    metaTitle: 'AI Storefront for Eyewear Brands & Retailers | VisuTry',
    metaDescription: 'Create an always-on merchant-branded AI storefront for broader eyewear discovery, guided evaluation, Decision Result, and Merchant Actions.',
    eyebrow: 'AI Storefront',
    title: 'An always-on decision experience for your eyewear catalog.',
    description: 'Use Store when shoppers need room to explore a broader assortment in a persistent merchant-branded experience rather than enter through one campaign proposition.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'See Product Examples', href: '/business/examples' },
    sections: [
      {
        eyebrow: 'When to use Store',
        title: 'Use Store when discovery should stay open-ended.',
        body: 'Store is the persistent shopper-facing surface for broader catalog discovery: a destination that can remain useful across homepage traffic, direct visits, pre-shop research, and repeat exploration.',
        cards: [
          { title: 'Always-on entry', description: 'Give shoppers a stable decision destination that is not tied to a single media flight or promotion.' },
          { title: 'Broader assortment', description: 'Let shoppers explore more of the reviewed merchant catalog than a focused Campaign typically needs.' },
          { title: 'Merchant context', description: 'Keep brand identity and product truth consistent while shoppers narrow their choices.' },
        ],
      },
      {
        eyebrow: 'Shopper experience',
        title: 'Guide exploration without forcing a campaign narrative.',
        steps: ['Enter Store', 'Explore the catalog', 'Narrow a shortlist', 'Try & compare', 'Keep the Decision Result', 'Continue to Merchant Actions'],
      },
      {
        eyebrow: 'Decision continuity',
        title: 'Keep the result useful after the active browsing session.',
        body: 'Decision Result preserves the useful outcome of the journey, including supported secure phone continuation. Merchant Actions then connect that result to product, appointment, store visit, inquiry, or another configured destination.',
      },
      {
        eyebrow: 'Delivery modes',
        title: 'Web by default. Kiosk-ready when the commercial plan supports it.',
        body: 'The same Store experience can be delivered on the web and, where entitled and configured, through a shared-device Kiosk profile with reset and privacy safeguards. Hardware and custom installation remain separately scoped.',
      },
    ],
  },
  campaigns: {
    slug: '/business/campaigns',
    metaTitle: 'AI Shopping Campaigns for Eyewear Brands & Agencies | VisuTry',
    metaDescription: 'Create focused AI shopping experiences that preserve campaign context from traffic source to product edit, shopper decision, Merchant Actions, and observable intent.',
    eyebrow: 'Campaign Experiences',
    title: 'Focused decision experiences for campaign traffic.',
    description: 'Use Campaigns when the reason a shopper arrived should shape the product edit, message, journey, and next merchant action.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'See a Campaign Example', href: '/c/akila/statement-frames' },
    sections: [
      {
        eyebrow: 'When to use Campaigns',
        title: 'Use Campaigns when arrival context should change the experience.',
        body: 'A Campaign starts from a specific reason for arrival — a collection launch, paid ad, creator story, fit problem, event, email, or QR — and turns that context into a tighter product and decision experience.',
        cards: [
          { title: 'Collection & launch', description: 'Focus attention on a strategic edit without duplicating the merchant catalog.' },
          { title: 'Paid & social', description: 'Keep the landing experience aligned with the proposition that earned the click.' },
          { title: 'Creator & editorial', description: 'Carry a style story into a shoppable decision path rather than a generic catalog grid.' },
          { title: 'QR & event', description: 'Give physical or event-driven traffic a focused digital continuation.' },
        ],
      },
      {
        eyebrow: 'Campaign operating model',
        title: 'Keep the source, product edit, and next action aligned.',
        steps: ['Traffic source or brief', 'Focused catalog subset', 'Campaign Experience', 'Configured Merchant Actions', 'Experience + source context'],
        body: 'Campaigns reuse the shared VisuTry decision runtime; the differentiator is the context around that runtime, not a separate feature stack.',
      },
      {
        eyebrow: 'Brand & agency workflow',
        title: 'Reuse product truth. Change the context.',
        body: 'Brand teams keep reviewed merchant products and identity consistent while commerce or agency teams adapt the experience to a media brief, audience, collection, or source. That separation avoids disconnected campaign microsites and duplicated product truth.',
      },
      {
        eyebrow: 'Reference Experience',
        title: 'See how a collection-led Campaign can work.',
        body: 'AKILA · Statement Frames is a Reference Experience assembled from public catalog information. It demonstrates the focused Campaign format and does not imply a customer or partner relationship.',
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
    metaDescription: 'Use observable shopper signals to understand where eyewear decision journeys gain or lose momentum across products, Experiences, actions, and available source context.',
    eyebrow: 'Commerce Intelligence',
    title: 'See where the decision journey gains — or loses — momentum.',
    description: 'Commerce Intelligence helps merchants interpret observable shopper behavior across products, Experiences, Merchant Actions, and available source context. It is an evidence layer, not a revenue attribution shortcut.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore the Platform', href: '/business/platform' },
    sections: [
      {
        eyebrow: 'Questions it answers',
        title: 'Turn interaction data into operating questions merchants can act on.',
        cards: [
          { title: 'Are shoppers reaching a shortlist?', description: 'Use Recommendation completion and related engagement to see whether discovery is narrowing into consideration.' },
          { title: 'Which frames reach deeper evaluation?', description: 'Review Virtual Try-On, Frame Compare, favorite, and related product-interest signals where enabled.' },
          { title: 'Which Experiences create stronger intent?', description: 'Compare observable behavior across Store and Campaign Experiences rather than pooling every visit together.' },
          { title: 'Where do shoppers continue?', description: 'Review product clicks, inquiries, and other configured Merchant Actions together with available source context.' },
        ],
      },
      {
        eyebrow: 'Analysis context',
        title: 'Read signals in the context that produced them.',
        body: 'The same event means more when it is tied back to the product, Experience, configured action, and available source context. Commerce Intelligence keeps those dimensions available for merchant review where the underlying data exists.',
      },
      {
        eyebrow: 'Evidence boundary',
        title: 'Intent is useful evidence. It is not a revenue guarantee.',
        body: 'The current Commerce Intelligence layer focuses on observable engagement and purchase-intent behavior. Revenue attribution requires commerce or order-data integration, and incremental revenue claims require credible experiment design.',
        note: 'No guaranteed conversion uplift, revenue lift, or incremental GMV claims.',
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
        body: 'Use the current Store product surface to evaluate the always-on shopper journey. Reference Experiences below demonstrate additional campaign and merchandising patterns without implying customer relationships.',
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
    metaDescription: 'Start hosted-first with your existing ecommerce product pages and expand integrations only as merchant needs and proven value justify them.',
    eyebrow: 'Integrations & Deployment',
    title: 'Start hosted-first. Keep your existing commerce stack.',
    description: 'VisuTry adds a guided decision layer around existing merchant commerce rather than requiring a platform replacement.',
    primaryCta: { label: 'Start 30-Day Pilot', href: pilotHref },
    secondaryCta: { label: 'Explore the Platform', href: '/business/platform' },
    sections: [
      {
        eyebrow: 'Current Pilot path',
        title: 'A practical launch with reviewed product data.',
        steps: ['Catalog Review', 'Configure', 'Hosted Launch', 'Merchant Actions', 'Intent Review'],
      },
      {
        eyebrow: 'Merchant workspace proof',
        title: 'A visible operating layer for setup and launch.',
        body: 'The current Pilot is deliberately assisted: merchant identity, Store, Campaigns, and setup status are managed in one workspace while launch steps remain reviewed.',
      },
      {
        eyebrow: 'Merchant Actions',
        title: 'Your product pages and checkout remain the source of truth.',
        body: 'The hosted Pilot can continue shoppers to configured product, appointment, inquiry, store-visit, or other supported merchant destinations. It does not require replacing Shopify, BigCommerce, or the merchant’s existing site.',
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
          { title: 'Goal', description: 'The decision problem you want to improve: discovery, Recommendation, Virtual Try-On, Frame Compare, or merchant action.' },
        ],
      },
      {
        eyebrow: 'How the Pilot starts',
        title: 'Request → scope review → confirmation → launch & review.',
        steps: ['Request', 'Scope Review', 'Confirmation', 'Launch & Review'],
        body: 'We confirm the frame set, Store or Campaign format, launch assumptions, Pilot terms, and payment instructions before configuration begins.',
      },
      {
        eyebrow: 'Merchant workspace',
        title: 'A visible operating model, not an invisible black box.',
        body: 'Merchant Workspace keeps setup status, Store, Campaigns, and the operating state visible throughout the Pilot.',
      },
      {
        eyebrow: 'Pilot scope',
        title: '$149 / 30 days with assisted setup.',
        body: 'The current Founding Merchant Pilot includes 8–50 reviewed frames, one hosted Store or Campaign Experience, guided Recommendation, Standard Try-On, Frame Compare, Decision Result / mobile continuation, configured Merchant Actions, enabled intent signals, up to 1,500 AI-assisted shoppers, up to 3,500 Standard Try-On generations, assisted setup, and a weekly review. Kiosk-ready delivery can be configured when the Pilot use case requires it.',
      },
      {
        eyebrow: 'What happens next',
        title: 'Review → configure → launch → learn.',
        steps: ['Review your catalog', 'Choose Store or Campaign', 'Configure the Experience', 'Launch hosted route', 'Review observed intent', 'Decide how to continue'],
      },
      {
        eyebrow: 'After 30 days',
        title: 'Review what happened, then decide whether to continue.',
        body: 'There is no automatic long-term commitment. Continuation is discussed separately based on actual usage, observed shopper behavior, campaign needs, integrations, and support requirements.',
      },
    ],
  },
}

export function businessHref(locale: string, href: string): string {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return href
  return `/${locale}${href}`
}
