import {
  inventoryCatalogGuide,
  preVisitFrameGalleryGuide,
  buyerSoftwareGuide,
  shoppableLookbookGuide,
  ipadComparisonGuide,
  takeHomeShortlistGuide,
} from './business-resources'

import { getMerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'

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
  | 'resources'

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
    metaTitle: 'AI Eyewear Shopping & Virtual Try-On for Retailers | VisuTry',
    metaDescription: 'Build a hosted eyewear shopping experience with your frames, AI recommendations, comparison and plan-eligible photo virtual try-on. Start with a free merchant workspace.',
    eyebrow: 'AI Eyewear Commerce for Retailers',
    title: 'AI eyewear shopping experiences for your store.',
    description: 'Give shoppers a guided way to discover, compare and choose frames from your catalog. Start with a hosted, merchant-branded Store; add photo-based Virtual Try-On where your plan includes it, and send shoppers back to your product pages.',
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    microcopy: 'Start free with basic recommendations and a private Store preview. Generative Virtual Try-On requires an eligible paid plan; your existing checkout stays yours.',
    sections: [
      {
        eyebrow: 'Discovery → Decision → Merchant Action',
        title: 'Help shoppers choose eyewear, not just browse more frames.',
        body: 'For independent eyewear stores, optical retailers, and brand commerce teams, VisuTry turns an existing frame catalog into a guided selection journey. Recommendations and comparisons help shoppers narrow choices; photo Try-On is available on eligible paid plans.',
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
        title: 'Start with your frames and a private Store preview.',
        body: 'Create a merchant workspace, add frame details and product links, and review your branded Store before sharing it. You can start without replacing your ecommerce platform; paid capabilities and publishing depend on your plan.',
      },
      {
        eyebrow: 'Commerce Intelligence',
        title: 'Know whether the journey is creating meaningful intent.',
        body: 'Commerce Intelligence turns observable shopper behavior into evidence about what is being recommended, evaluated, compared, and continued toward merchant destinations — without claiming revenue that is not directly measured.',
        cards: [
          { title: 'Observable decision signals', description: 'Review shopper behavior in the context of product, Experience, and source where available.', href: '/business/commerce-intelligence', label: 'Explore Commerce Intelligence' },
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
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
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
    metaTitle: 'Virtual Try-On for Eyewear Retailers Using Their Own Frames | VisuTry',
    metaDescription: 'Put your optical store’s frame catalog online. See how shoppers can browse your frames, try them on in a photo with a paid plan, and return to your product pages.',
    eyebrow: 'Hosted Eyewear Storefront',
    title: 'Let shoppers try on frames from your own eyewear store.',
    description: 'Build an online frame catalog with your product photos. Shoppers can browse before visiting your optical store or follow a link to buy on your website. On a paid plan, they can upload a photo to see how your frames look on them.',
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    secondaryCta: { label: 'See Product Examples', href: '/business/examples' },
    sections: [
      {
        eyebrow: 'When to use Store',
        title: 'Let customers browse your frame catalog before a visit.',
        body: 'Send your Store link in an appointment email, add it to your website or put a QR code beside your frame display. Customers can browse the collection on their phone.',
        cards: [
          { title: 'Choose the collection', description: 'Start with the frames you want customers to find, such as a few best sellers or the styles available at a particular shop.', href: inventoryCatalogGuide.path, label: 'Get the frame inventory CSV and sample photos' },
          { title: 'Show the choices', description: 'Customers can browse your collection and get basic frame recommendations. Paid plans add side-by-side comparison and photo try-on.', href: preVisitFrameGalleryGuide.path, label: 'Set up a gallery for pre-visit browsing' },
          { title: 'Send shoppers to the right product', description: 'Include the product link for each frame so customers can check its details and complete a purchase through your existing checkout.' },
        ],
      },
      {
        eyebrow: 'Shopper experience',
        title: 'Guide frame selection from discovery to your product page.',
        steps: ['Enter Store', 'Explore the catalog', 'Narrow a shortlist', 'Try & compare', 'Keep the Decision Result', 'Continue to Merchant Actions'],
      },
      {
        eyebrow: 'Getting started',
        title: 'How to set up a hosted eyewear Store.',
        body: 'To add your first frame manually, enter its name, upload a product photo or supply an image URL, and add either your SKU or the frame’s product page URL. Use a CSV when you have several frames ready.',
        steps: ['Create your free merchant workspace', 'Review and add your frame to the catalog', 'Open your private Store preview', 'Check product links and publish when eligible'],
        note: 'Free includes basic recommendations, not generative Virtual Try-On. Photo Try-On requires an eligible paid plan; native Shopify catalog sync and storefront installation are not part of the hosted setup.',
      },
      {
        eyebrow: 'Common questions',
        title: 'What eyewear retailers need to know before launching.',
        cards: [
          { title: 'Do I need to replace my shop?', description: 'No. VisuTry hosts a separate branded Store and can link shoppers to your existing product pages or other configured merchant destinations.' },
          { title: 'Does the free plan include virtual try-on?', description: 'The free plan includes catalog setup, a private Store preview and basic recommendations. Choose a paid plan to offer photo try-on to shoppers.', href: '/business/pricing', label: 'Compare retail plans and try-on allowances' },
          { title: 'Is this a real-time AR fitting tool?', description: 'No. VisuTry uses AI-assisted photo-based Try-On where enabled. It does not provide a physical-fit or prescription measurement guarantee.' },
          { title: 'Is there a native Shopify app?', description: 'Not in the current hosted Store offer. Shopify merchants can link back to their product pages; native app installation and automated catalog sync are separate future integration work.' },
        ],
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
    metaTitle: 'Eyewear Campaigns and QR Codes for Optical Trunk Shows | VisuTry',
    metaDescription: 'Build an eyewear trunk show campaign with a selection of featured frames, a QR code for the display table, and links to the exact products shoppers saw.',
    eyebrow: 'Campaign Experiences',
    title: 'Focused decision experiences for campaign traffic.',
    description: 'For an optical trunk show, give guests one link to the frames on the display table. Put it in the invitation and on a printed QR card so visitors can find the same models after the event.',
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    secondaryCta: { label: 'See a Campaign Example', href: '/c/akila/statement-frames' },
    sections: [
      {
        eyebrow: 'When to use Campaigns',
        title: 'Use Campaigns when arrival context should change the experience.',
        body: 'A Campaign starts from a specific reason for arrival — a collection launch, paid ad, creator story, fit problem, event, email, or QR — and turns that context into a tighter product and decision experience.',
        cards: [
          { title: 'Collection & launch', description: 'Build a visual edit for the launch using only frames in the collection.', href: shoppableLookbookGuide.path, label: 'Make a shoppable eyewear lookbook' },
          { title: 'Paid & social', description: 'Keep the landing experience aligned with the proposition that earned the click.' },
          { title: 'Creator & editorial', description: 'Carry a style story into a shoppable decision path rather than a generic catalog grid.' },
          { title: 'QR & event', description: 'Give physical or event-driven traffic a focused digital continuation.' },
        ],
      },
      {
        eyebrow: 'Event setup',
        title: 'How do I use a QR code at an optical trunk show?',
        body: 'Choose the frames the rep is bringing. In the Campaign, match each model and color to its photo and product page. Publish the selection, then encode its public URL in your printed QR card. Scan the printed proof on a signed-out phone before placing it beside the frames.',
        cards: [
          { title: 'Before the event', description: 'Include the same collection link in the invitation. If a sample changes, update the selection and check that the printed code still opens the right frames.' },
          { title: 'At the display table', description: 'Put the model name next to the sample. Ask a colleague to scan the card, find that name on their phone and open its product link. Print a short, readable collection address below the code.' },
        ],
      },
      {
        eyebrow: 'Brand & agency workflow',
        title: 'Reuse product truth. Change the context.',
        body: 'Brand teams keep reviewed merchant products and identity consistent while commerce or agency teams adapt the experience to a media brief, audience, collection, or source. That separation avoids disconnected campaign microsites and duplicated product truth.',
      },
      {
        eyebrow: 'Reference Experience',
        title: 'Open a sample collection and follow one frame.',
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
    metaTitle: 'Eyewear Analytics: Frame Interest, Try-Ons and Product Clicks | VisuTry',
    metaDescription: 'See which frames enter consideration and where shoppers continue. Review recommendations, comparisons, completed photo try-ons, and clicks back to your store.',
    eyebrow: 'Commerce Intelligence',
    title: 'See where the decision journey gains — or loses — momentum.',
    description: 'The Commerce Intelligence evidence layer shows which frames shoppers consider and where they go next. Pick a Store or Campaign to review frame interest, completed photo try-ons, comparisons and product clicks for the same period.',
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    secondaryCta: { label: 'Explore the Platform', href: '/business/platform' },
    sections: [
      {
        eyebrow: 'Questions it answers',
        title: 'Turn interaction data into operating questions merchants can act on.',
        cards: [
          { title: 'Are shoppers reaching a shortlist?', description: 'Use Recommendation completion and related engagement to see whether discovery is narrowing into consideration.' },
          { title: 'Which frames reach deeper evaluation?', description: 'Review Virtual Try-On, Frame Compare, favorite, and related product-interest signals where enabled.' },
          { title: 'Which Experiences create stronger intent?', description: 'Compare observable behavior across Store and Campaign Experiences rather than pooling every visit together.' },
          { title: 'Where do shoppers continue?', description: 'Review product clicks, inquiries, and other configured Merchant Actions together with available source context.', href: takeHomeShortlistGuide.path, label: 'See how a shopper can revisit their shortlist' },
        ],
      },
      {
        eyebrow: 'Analysis context',
        title: 'Which frames get tried, compared or clicked?',
        body: 'Choose one collection and date range. Start with the frames appearing in product-interest data. Compare that with completed try-ons, comparison activity and product clicks for the same experience. Keep the original units visible as one person can compare several frames or open a listing twice.',
        cards: [
          { title: 'Interest without a product click', description: 'If a frame attracts attention and few shoppers continue, check the action available on that frame. Open the product link on a phone and confirm it matches the exact model and color.' },
          { title: 'Clicks without an order record', description: 'A product click records a visit to the destination. Use fulfilled orders from your own checkout for a sales figure. Report interest separately when you cannot match an order to the shopper.' },
        ],
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
    metaTitle: 'Virtual Try-On Pricing for Eyewear Retailers | VisuTry',
    metaDescription: `Compare free Store setup and basic recommendations with monthly photo try-on plans for eyewear retailers. Launch costs ${getMerchantPlanDefinition('LAUNCH').priceLabel}. See catalog and image limits.`,
    eyebrow: 'Pricing',
    title: 'How much does virtual try-on cost for an eyewear store?',
    description: `Start free with a private Store preview and basic frame recommendations. Launch, the first monthly plan with photo try-on, costs ${getMerchantPlanDefinition('LAUNCH').priceLabel}. Compare how many products, shopper sessions and try-on images each plan includes.`,
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    secondaryCta: { label: 'View 30-Day Pilot', href: pilotHref },
    sections: [],
  },
  examples: {
    slug: '/business/examples',
    metaTitle: 'Frame Finder Examples for Eyewear Retailers | VisuTry',
    metaDescription: 'See how to offer frame recommendations from your own inventory. Explore a working frame finder, inspect the catalog, and check where shoppers go from a shortlist.',
    eyebrow: 'Product Proof',
    title: 'How can my eyewear store recommend frames from its own inventory?',
    description: 'Give the frame finder a reviewed set of products you carry. Each recommendation should lead to a recognizable model, color and product page. Use the public examples below to walk through that experience as a shopper.',
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    secondaryCta: { label: 'Explore Store', href: '/business/store' },
    sections: [
      {
        eyebrow: 'Store product preview',
        title: 'Test a frame finder with a small optical catalog.',
        body: 'Start with a mix of shapes your store stocks. For each frame, check its shape, product photo, SKU or product link, and any available width or color details. In a private preview, follow a suggested frame to its product page and check the exact variant. Review the selection again when your assortment changes.',
        cards: [
          { title: 'Try the shopper view', description: 'Open the demo collection and find VT Rowan and VT Lane. Compare their catalog shapes and follow each product link. Then explore the guided recommendation path to see how a shopper narrows the selection.', href: '/store/visutry-demo-optical', label: 'Try the Demo Optical frame finder' },
          { title: 'Prepare your own selection', description: 'Use a small set first so staff can check each model. The sample spreadsheet includes images, shapes and working product links for both demonstration frames.', href: inventoryCatalogGuide.path, label: 'Get the two-frame sample catalog' },
        ],
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
  resources: {
    slug: '/business/resources',
    metaTitle: 'Eyewear Retail Guides | VisuTry Business Resources',
    metaDescription: 'Guides for optical stores and eyewear brands on frame catalogs, in-store try-on, campaigns and costs. Watch the retail demo or read the deployment white paper.',
    eyebrow: 'VisuTry Business',
    title: 'Eyewear retail resources',
    description: 'Set up your frame catalog, help shoppers choose frames, and evaluate virtual try-on for your store or brand.',
    primaryCta: { label: 'Product demo', href: '#product-demo' },
    secondaryCta: { label: 'White paper', href: '#white-paper' },
    sections: [],
  },
  integrations: {
    slug: '/business/integrations',
    metaTitle: 'Add Hosted Eyewear Try-On to Your Existing Store | VisuTry',
    metaDescription: 'Connect an existing eyewear website to a hosted try-on catalog. Follow a frame back to its original product page and keep prices, orders, and checkout on your store.',
    eyebrow: 'Integrations & Deployment',
    title: 'How do I add eyewear try-on to my existing website?',
    description: 'Link a button on your eyewear collection page to a published VisuTry Store. Shoppers browse there and follow a frame’s product link back to your website to buy. Your commerce platform continues to handle the cart and checkout.',
    primaryCta: { label: 'Start Free', href: '/merchant?commercialIntent=FREE' },
    secondaryCta: { label: 'Explore the Platform', href: '/business/platform' },
    sections: [
      {
        eyebrow: 'Current Pilot path',
        title: 'Check the round trip from your website to a frame and back.',
        body: 'Start with one variant. Copy its product-page address into the catalog, attach the matching frame photo and open the private preview. Follow the product link and check the model and color. After the Store is published, test the complete path from your collection button on a signed-out phone.',
        cards: [
          { title: 'What needs to live on my website?', description: 'A link to the hosted Store is enough to send shoppers there. If the preview itself must appear inside your product page, check embedded delivery support before choosing a provider.', href: buyerSoftwareGuide.path, label: 'Compare hosted and embedded try-on' },
        ],
        steps: ['Open your collection page', 'Follow its link to the hosted Store', 'Choose one frame', 'Return to that product on your site'],
      },
      {
        eyebrow: 'Merchant workspace proof',
        title: 'A visible operating layer for setup and launch.',
        body: 'The current Pilot is deliberately assisted: merchant identity, Store, Campaigns, and setup status are managed in one workspace while launch steps remain reviewed.',
      },
      {
        eyebrow: 'Merchant Actions',
        title: 'Where does the customer complete the purchase?',
        cards: [
          { title: 'See the product link in a real catalog', description: 'In the Lowercase NYC reference collection, open Ashe and follow View product. Check the destination domain and model. Repeat this check with one of your own products before sharing a live link.', href: '/c/lowercase-nyc/find-your-frame', label: 'Follow a reference frame to its listing' },
        ],
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
    metaTitle: 'Start a VisuTry Founding Merchant Pilot | 30-Day Eyewear Try-On Test',
    metaDescription: 'Run an eyewear try-on pilot with a small frame selection. Review a four-week plan for catalog checks, launch and measurement. Founding Pilot from $149 / 30 days.',
    eyebrow: 'Founding Merchant Pilot',
    title: 'How can an optical store test virtual try-on in 30 days?',
    description: 'Choose a small collection, one place to share it and one shopper action to measure. Final scope and pilot fee are confirmed based on your deployment configuration.',
    primaryCta: { label: 'Request Pilot Review', href: '#pilot-request' },
    secondaryCta: { label: 'View Pricing', href: '/business/pricing' },
    microcopy: 'From $149 / 30 days · We review deployment configuration, catalog scope, and launch timing before confirming the Pilot and fee.',
    sections: [
      {
        eyebrow: 'What to send',
        title: 'A small amount of context is enough to start.',
        cards: [
          { title: 'Business', description: 'Brand or store name, website, and primary contact.' },
          { title: 'Catalog', description: 'Approximate frame count and the collection or products you want to test.' },
          { title: 'Traffic', description: 'Choose one starting point such as a collection page, an email or an in-store tablet. For a shared device, check the plan and setup before inviting shoppers.', href: ipadComparisonGuide.path, label: 'Plan an in-store tablet session' },
          { title: 'Goal', description: 'The decision problem you want to improve: discovery, Recommendation, Virtual Try-On, Frame Compare, or merchant action.' },
        ],
      },
      {
        eyebrow: 'How the Pilot starts',
        title: 'Request → scope review → confirmation → launch & review.',
        steps: ['Request', 'Scope Review', 'Confirmation', 'Launch & Review'],
        body: 'We confirm the frame set, deployment configuration, launch assumptions, Pilot scope, fee, and payment instructions before configuration begins.',
      },
      {
        eyebrow: 'Merchant workspace',
        title: 'A visible operating model, not an invisible black box.',
        body: 'Merchant Workspace keeps setup status, Store, Campaigns, and the operating state visible throughout the Pilot.',
      },
      {
        eyebrow: 'Pilot scope',
        title: 'From $149 / 30 days.',
        body: 'A typical Founding Merchant Pilot includes 8–50 real frames, an AI-assisted shopper experience, Virtual Try-On, Frame Compare, assisted setup, and a weekly review. Hosted, Campaign, in-store, and other deployment configurations may vary in scope and pricing. Final scope and pilot fee are confirmed before billing.',
      },
      {
        eyebrow: 'Example pilot plan',
        title: 'What should we measure during a 30-day eyewear pilot?',
        body: 'For example, choose eight models from one collection and one question: do shoppers reach the original product page after exploring these frames? Agree who will review results, which visits are staff tests, and the date the live link will go up.',
        cards: [
          { title: 'Week 1 · Prepare', description: 'Record the previous four weeks of collection traffic if available. Check eight frame photos, variants and destinations. Have a colleague walk through the private preview.' },
          { title: 'Week 2 · Open one entrance', description: 'Share the published link from one collection page. Record the launch date and any promotion or stock change. Keep staff checks identifiable.' },
          { title: 'Week 3 · Find friction', description: 'Check whether shoppers are arriving, completing try-on and reaching product links. Investigate a broken link or failed preview on the actual phone or browser where it occurred.' },
          { title: 'Week 4 · Review', description: 'Report the number of visitors, completed images and product clicks separately. A pilot with too few shoppers to evaluate the journey gives you a traffic question to test next.', href: '/business/commerce-intelligence', label: 'Read the eyewear analytics guide' },
        ],
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
