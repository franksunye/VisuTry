import type { MerchantDiscoveryEditorial } from '@/lib/merchant-discovery-editorial'

/** Server-rendered, factual reading content; it never starts a shopper session. */
export function ExperienceDiscoveryEditorial({ editorial }: { editorial: MerchantDiscoveryEditorial }) {
  return (
    <section className="mt-8 border-t border-slate-200/80 pt-7" aria-labelledby="frame-outline-comparison">
      <h2 id="frame-outline-comparison" className="font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">
        Compare two frame outlines
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{editorial.intro}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {editorial.comparison.map((frame) => (
          <article key={frame.frameId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="font-semibold text-slate-950">{frame.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{frame.observation}</p>
            <p className="mt-3 text-xs text-slate-600"><span className="font-semibold text-slate-800">Shape:</span> {frame.shape}</p>
            <a href={`#${encodeURIComponent(frame.anchorId)}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline-offset-2 hover:underline">
              See {frame.name} in the collection
            </a>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">{editorial.nonSaleNotice}</p>
      <div className="mt-7 space-y-5" aria-label="Questions about this collection">
        {editorial.faqs.map((faq) => (
          <div key={faq.question}>
            <h3 className="text-sm font-semibold text-slate-950">{faq.question}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
