import Link from '@/components/layout/PublicLink'

/**
 * Exact English buyer tasks observed near existing AI-referred Try-On/FAQ entry points.
 * Keep the answer text identical in SSR HTML and the existing FAQPage JSON-LD.
 * No image upload, provider call, login check, pricing mutation, or new URL.
 */
export const ENGLISH_EYEWEAR_DECISION_FAQS = [
  {
    question: "Can I use a retailer\'s glasses screenshot for virtual try-on?",
    answer: "Yes. Use a clear, front-facing product photo or screenshot you are permitted to use, together with your own portrait. Sign in to Virtual Try-On and use an available credit to generate an appearance preview. You do not need the retailer to supply a VisuTry store catalog or exact product SKU.",
    href: "/en/try-on/glasses",
    ctaLabel: "Try a frame from a photo",
  },
  {
    question: "Do I need a face-shape report before trying on a specific frame?",
    answer: "No. If you already have a particular frame image, you can go straight to Virtual Try-On. The free Face Shape Detector offers an on-device shape estimate if you need a starting point. Glasses Advisor is a separate personalized recommendation product that uses a credit; the free detector does not unlock its individualized report.",
    href: "/en/face-shape-detector",
    ctaLabel: "Explore the free Face Shape Detector",
  },
  {
    question: "Do frame markings like 52-18-145 or an AI preview prove that glasses will fit?",
    answer: "No. The markings describe lens width (52 mm), bridge width (18 mm), and temple length (145 mm), not the overall frame-front width. You can compare the listed dimensions with a pair you already wear using the free size-marking tool. Neither printed sizes nor an AI appearance preview proves physical comfort or prescription suitability; check with the retailer or an optician before buying.",
    href: "/en/glasses-guide/how-wide-should-glasses-be-for-my-face",
    ctaLabel: "Compare two frame size markings",
  },
] as const

export function EnglishEyewearDecisionFaq() {
  return (
    <section
      id="eyewear-shopping-decisions"
      aria-labelledby="eyewear-shopping-decisions-title"
      className="scroll-mt-28 rounded-lg border border-blue-100 bg-blue-50/50 p-5 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        Practical buying decisions
      </p>
      <h2 id="eyewear-shopping-decisions-title" className="mt-2 text-xl font-bold text-gray-950">
        Before trying glasses from a product image
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-700">
        Start with the task you actually have: a specific frame photo, a style choice, or a size comparison.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {ENGLISH_EYEWEAR_DECISION_FAQS.map((item) => (
          <article key={item.question} className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="font-semibold text-gray-950">{item.question}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">{item.answer}</p>
            <Link
              href={item.href}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {item.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
