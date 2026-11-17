import Link from '@/components/layout/PublicLink'

/** Source-verified, task-distinct public facts. Mount only in the audited English URLs. */
export const GEO_TASK_FACTS = {
  "home": {
    title: "Choose a tool for your real eyewear decision",
    answer: "No fixed four-step process is required. Start with the free on-device Detector if you do not know your face shape. If you have a specific product image, go directly to Try-On. Use credit-based Advisor only for personalized recommendations; Frame Compare tests built-in preset looks.",
    limitation: "Personalized reports and AI-generated images require an account and available credits; a styling preview does not replace an optician's fitting.",
    action: { href: "/en/faq", label: "Choose the right tool" },
  },
  "advisor": {
    title: "What personalized Glasses Advisor adds",
    answer: "An uploaded portrait powers a personalized eyewear report and frame recommendations. The free Face Shape Detector estimates shape locally without unlocking the Advisor's credit-based Top Picks.",
    limitation: "Advisor helps you shortlist frame directions; it does not identify an exact retail SKU or provide a prescription or guaranteed physical fit.",
    action: { href: "/en/try-on/glasses", label: "Try one exact frame afterward" },
  },
  "try-on": {
    title: "What to bring when you already know a frame",
    answer: "Upload your own portrait and a clear front-facing image or permitted store screenshot of a specific frame. Sign in and use an available credit to generate a visual Try-On preview of that supplied product image.",
    limitation: "This does not identify an exact retailer SKU or guarantee nose-bridge comfort, optical measurements, authenticity or stock availability.",
    action: { href: "/en/glasses-guide/how-wide-should-glasses-be-for-my-face", label: "Compare printed frame measurements" },
  },
  "compare": {
    title: "What the four-frame comparison really compares",
    answer: "Use one portrait and choose up to four built-in preset frame looks. Frame Compare generates each look separately and shows them side by side; each generated frame uses one available credit.",
    limitation: "Preset styles are not exact retailer products or a way to upload four arbitrary store screenshots. For a particular product image use custom Virtual Try-On.",
    action: { href: "/en/try-on/glasses", label: "Try a specific frame image" },
  },
  "guide": {
    title: "Turn general frame advice into a practical size check",
    answer: "Printed 52-18-145 markings describe lens width, bridge width and temple length. Compare a comfortable current pair with a candidate in the browser-only markings tool; then consider a visual preview of the exact product.",
    limitation: "Those three numbers do not equal the total outer front width, and neither size markings nor an AI preview can confirm physical comfort.",
    action: { href: "/en/glasses-guide/how-wide-should-glasses-be-for-my-face", label: "Open the free size comparison" },
  },
  "blog": {
    title: "Read the guide that matches your next buying decision",
    answer: "Already have a frame screenshot? Read the custom Try-On guide. Deciding between two real products? Use the two-pair decision checklist. If size is your main uncertainty, compare printed markings.",
    limitation: "General guides do not replace the paid personalized Advisor, verified retailer product information or a physical fitting.",
    action: { href: "/en/blog/find-perfect-glasses-online-guide", label: "Compare two pairs before buying" },
  },
  "merchant": {
    title: "What a VisuTry Store merchant can actually do",
    answer: "Prepare catalog items, preview a hosted Store and support shopper frame discovery, virtual try-on and purchase-intent signals. This Merchant catalog-to-experience workflow is separate from a Consumer Advisor report.",
    limitation: "Do not assume automatic Store-URL catalog importing, an official Shopify app, an autonomous checkout agent or guaranteed merchant sales.",
    action: { href: "/en/business/platform", label: "Explore the merchant platform" },
  },
  "find": {
    title: "Find a short list before trying exact products",
    answer: "Start with facial proportions and the measurements of a current comfortable pair. Pick a few frame directions to test, then preview a specific product image if you have already chosen one.",
    limitation: "Face-shape labels are styling heuristics, not a prescription or a paid personalized recommendation report.",
    action: { href: "/en/face-shape-detector", label: "Use the free face-shape detector" },
  },
  "suit": {
    title: "Which glasses suit you depends on more than one label",
    answer: "Compare frame shape, upper rim, width, bridge placement, lens depth and your preferences. General advice is free to read; an individualized photo report is part of the separate credit-based Advisor.",
    limitation: "You do not need an Advisor report to preview a particular product image you already own or have permission to use.",
    action: { href: "/en/face-analysis", label: "Learn about personalized Advisor" },
  },
  "photo": {
    title: "Understand the two images needed for Try-On",
    answer: "Provide a straight-on portrait and one clear front-facing glasses image or seller screenshot that you are permitted to use. The generated image previews that supplied frame on your face.",
    limitation: "The preview is not an exact-fit measurement or an official store inventory match. Frame Compare works with built-in presets instead.",
    action: { href: "/en/try-on/glasses", label: "Preview the product image" },
  },
  "virtual": {
    title: "When browser-based virtual try-on is useful",
    answer: "Once you have narrowed actual product photos, upload your portrait and the frame image for each candidate. Check how the frame looks, then confirm the actual listing and size.",
    limitation: "A photo preview cannot verify lens prescriptions, bridge pressure or in-store comfort and does not imply a partnership with the pictured brand.",
    action: { href: "/en/try-on/glasses", label: "Open custom Virtual Try-On" },
  },
  "advisorSearch": {
    title: "Understand the free Detector versus paid Advisor",
    answer: "The local free Detector estimates a likely face shape without uploading its photo. A different credit-based Glasses Advisor analyzes your uploaded photo and prepares personal frame recommendations.",
    limitation: "The personalized Advisor report does not certify medical measurements or identify a particular store's inventory.",
    action: { href: "/en/face-analysis", label: "Read the Advisor details" },
  },
  "compareSearch": {
    title: "Compare presets, not invented retailer stock",
    answer: "Use a single portrait with up to four built-in frame presets to compare visual silhouettes side by side. One generation uses one credit per preset frame.",
    limitation: "To inspect a specific retail product or color, use its image in custom Try-On, then check size and availability with the seller.",
    action: { href: "/en/try-on/glasses/compare", label: "Open preset Frame Compare" },
  },
} as const

export type GeoTaskId = keyof typeof GEO_TASK_FACTS

export const GEO_SEARCH_TASK_BY_PATH = {
  '/find-glasses-for-my-face': 'find',
  '/what-glasses-suit-my-face': 'suit',
  '/try-glasses-on-photo': 'photo',
  '/virtual-glasses-try-on': 'virtual',
  '/ai-glasses-advisor': 'advisorSearch',
  '/compare-glasses-frames': 'compareSearch',
} as const satisfies Record<string, GeoTaskId>

export function getGeoSearchTaskId(sourcePage: string): GeoTaskId | null {
  return GEO_SEARCH_TASK_BY_PATH[sourcePage as keyof typeof GEO_SEARCH_TASK_BY_PATH] ?? null
}

export function GeoTaskFacts({ task }: { task: GeoTaskId }) {
  const item = GEO_TASK_FACTS[task]
  return (
    <section data-geo-task={task} aria-labelledby={`geo-task-${task}`} className="mt-10 scroll-mt-28 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Practical eyewear decision</p>
      <h2 id={`geo-task-${task}`} className="mt-2 text-xl font-bold leading-snug text-slate-950 md:text-2xl">{item.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{item.answer}</p>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600"><strong className="font-semibold text-slate-900">What this does not guarantee:</strong> {item.limitation}</p>
      <Link href={item.action.href} className="mt-4 inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{item.action.label}</Link>
    </section>
  )
}
