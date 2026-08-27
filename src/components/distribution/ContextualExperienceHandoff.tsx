import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { CONTEXTUAL_HANDOFFS, type ContextualHandoffPlacement } from '@/config/distribution-handoffs'
import { buildMerchantExperienceHref } from '@/lib/commerce-handoff/merchant-experience-href'

export function ContextualExperienceHandoff({
  locale,
  placement,
}: {
  locale: string
  placement: ContextualHandoffPlacement
}) {
  const handoff = CONTEXTUAL_HANDOFFS[placement]
  const href = buildMerchantExperienceHref({
    path: `/${locale}/c/${handoff.merchantSlug}/${handoff.experienceSlug}`,
    surface: handoff.surface,
    campaign: handoff.campaign,
  })

  return (
    <section className="mt-5 rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] p-4 sm:p-5" aria-labelledby={`${placement}-handoff-title`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm" aria-hidden="true">
            <Compass className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{handoff.eyebrow}</p>
            <h2 id={`${placement}-handoff-title`} className="mt-1 text-base font-semibold text-slate-950">{handoff.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{handoff.description}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {handoff.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
